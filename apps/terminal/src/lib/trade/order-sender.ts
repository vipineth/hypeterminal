import type {
	InfoClient,
	IRequestTransport,
	OrderParameters,
	OrderStatusResponse,
	TwapHistoryResponse,
	TwapOrderParameters,
} from "@nktkas/hyperliquid";
import { type ExchangeSingleWalletConfig, noop, order, twapOrder } from "@nktkas/hyperliquid/api/exchange";
import { getWalletAddress } from "@nktkas/hyperliquid/signing";
import Big from "big.js";
import type { CloidOrder, PlanLeg } from "@/domain/trade/order-intent";
import type { ExchangeClock } from "@/lib/trade/exchange-clock";
import {
	getRequestSlot,
	getUserSlotPrefix,
	type PendingRequest,
	type RequestLabel,
	type RequestStore,
} from "@/lib/trade/pending-requests";

export const EXPIRY_WINDOW_MS = 30_000;
const AUTO_RESEND_DELAYS_MS = [1000, 2000, 4000];
const LOOKUP_DELAYS_MS = [500, 1000, 2000];
const READ_TIMEOUT_MS = 3000;
const LAPSE_MARGIN_MS = 5000;

type Reply =
	| { kind: "ok"; response: unknown }
	| { kind: "duplicate" | "tooLow" | "expired" }
	| { kind: "rejected" | "unreachable"; error: string };

const SETTLING_ERRORS = [
	{ kind: "duplicate", pattern: /^Invalid nonce: duplicate nonce \d+$/ },
	{ kind: "tooLow", pattern: /^Invalid nonce: nonce too low \d+ < \d+$/ },
	{ kind: "expired", pattern: /^Action already expired$/ },
] as const;

export function classifyReply(raw: unknown): Reply {
	if (!isRecord(raw)) return { kind: "rejected", error: "Unexpected exchange reply" };
	if (raw.status === "ok") return { kind: "ok", response: raw.response };
	const error = typeof raw.response === "string" ? raw.response : "Unexpected exchange reply";
	const settling = SETTLING_ERRORS.find(({ pattern }) => pattern.test(error));
	return settling ? { kind: settling.kind } : { kind: "rejected", error };
}

export type TwapRecord = TwapHistoryResponse[number];

export type Lookup =
	| { kind: "order"; statuses: OrderStatusResponse[] | null }
	| { kind: "twap"; match: TwapRecord | null; readable: boolean };

export type Settlement =
	| { kind: "pending"; request: PendingRequest; error: string }
	| { kind: "answered"; request: PendingRequest; response: unknown }
	| { kind: "consumed"; request: PendingRequest; lookup: Lookup }
	| { kind: "expired"; request: PendingRequest; lookup: Lookup }
	| { kind: "canceled"; request: PendingRequest };

type Busy = { kind: "busy" };
type Missing = { kind: "missing" };

export type SubmitOutcome =
	| Busy
	| { kind: "failed"; error: string }
	| { kind: "blocked"; earlier: Settlement }
	| { kind: "sent"; settlement: Settlement };

export type CancelOutcome = Settlement | Busy | Missing | { kind: "foreignSigner"; request: PendingRequest };

type OrderSubmissionParams = Pick<OrderParameters, "grouping" | "builder"> & { orders: CloidOrder[] };

type TwapParams = Pick<TwapOrderParameters, "twap">;

export type Submission =
	| { kind: "order"; params: OrderSubmissionParams; legs: PlanLeg[]; label: RequestLabel | null }
	| { kind: "twap"; params: TwapParams; coin: string; label: RequestLabel | null };

export interface Signer {
	user: `0x${string}`;
	config: ExchangeSingleWalletConfig;
}

export interface LockManagerLike {
	request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

export interface SenderEnv {
	info: () => InfoClient;
	store: RequestStore;
	clock: ExchangeClock;
	locks: () => LockManagerLike | null;
	windowMs?: number;
	sleep?: (ms: number) => Promise<void>;
}

export function getRequestKey(request: Pick<PendingRequest, "slot" | "nonce">): string {
	return `${request.slot}#${request.nonce}`;
}

type SignedBody = { nonce: number } & Record<string, unknown>;

class HeldBeforeSend extends Error {}

export function createOrderSender(env: SenderEnv) {
	const windowMs = env.windowMs ?? EXPIRY_WINDOW_MS;
	const sleep = env.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
	const sending = new Set<string>();
	const busyListeners = new Set<() => void>();

	function transport(): IRequestTransport {
		return env.info().config_.transport;
	}

	function network(): string {
		return transport().isTestnet ? "testnet" : "mainnet";
	}

	function slotFor(user: string, asset: number): string {
		return getRequestSlot(network(), user, asset);
	}

	function emitBusy() {
		for (const listener of busyListeners) listener();
	}

	async function exclusive<T>(slot: string, run: () => Promise<T>): Promise<T | Busy> {
		if (sending.has(slot)) return { kind: "busy" };
		sending.add(slot);
		emitBusy();
		try {
			return await run();
		} finally {
			sending.delete(slot);
			emitBusy();
		}
	}

	function withSlotLock<T>(slot: string, run: () => Promise<T>): Promise<T> {
		const locks = env.locks();
		return locks ? locks.request(`hypeterminal:pending-request:${slot}`, run) : run();
	}

	async function submit(signer: Signer, submission: Submission): Promise<SubmitOutcome> {
		const asset = Number(submission.kind === "order" ? submission.params.orders[0].a : submission.params.twap.a);
		const slot = slotFor(signer.user, asset);
		return exclusive(slot, async () => {
			const claim = await withSlotLock(slot, () => claimSlot(slot, asset, signer, submission));
			if (claim.kind !== "signed") return claim;
			return { kind: "sent", settlement: await settle(claim.request, true) };
		});
	}

	async function claimSlot(
		slot: string,
		asset: number,
		signer: Signer,
		submission: Submission,
	): Promise<{ kind: "signed"; request: PendingRequest } | SubmitOutcome> {
		const earlier = env.store.get(slot);
		if (earlier) {
			const settlement = await settle(earlier, false);
			if (!placedNothing(settlement)) return { kind: "blocked", earlier: settlement };
		}
		try {
			const request = await signRequest(slot, asset, signer, submission);
			env.store.put(request);
			return { kind: "signed", request };
		} catch (error) {
			return { kind: "failed", error: errorMessage(error) };
		}
	}

	async function signRequest(
		slot: string,
		asset: number,
		{ user, config }: Signer,
		submission: Submission,
	): Promise<PendingRequest> {
		const knownIds = submission.kind === "twap" ? await readTwapIds(user) : null;
		const expiresAfter = (await env.clock.now()) + windowMs;
		const body = await holdSign(config, (held) =>
			submission.kind === "order"
				? order(held, submission.params, { expiresAfter })
				: twapOrder(held, submission.params, { expiresAfter }),
		);
		return {
			slot,
			kind: submission.kind,
			user: user.toLowerCase(),
			signer: (await getWalletAddress(config.wallet)).toLowerCase(),
			asset,
			body: JSON.stringify(body),
			nonce: body.nonce,
			expiresAfter,
			cloids: submission.kind === "order" ? submission.params.orders.map((leg) => leg.c) : [],
			legs: submission.kind === "order" ? submission.legs : [],
			twap: submission.kind === "twap" ? { coin: submission.coin, knownIds } : null,
			label: submission.label,
			createdAt: Date.now(),
		};
	}

	async function settle(request: PendingRequest, firstSend: boolean): Promise<Settlement> {
		const delays = firstSend ? [0, ...AUTO_RESEND_DELAYS_MS] : [0];
		let error = "";
		for (const [attempt, delay] of delays.entries()) {
			if (delay > 0) await sleep(delay);
			const timeoutMs = firstSend && attempt === 0 ? null : READ_TIMEOUT_MS;
			const reply = await send(JSON.parse(request.body), timeoutMs);
			if (reply.kind === "ok") return finish(request, { kind: "answered", request, response: reply.response });
			if (reply.kind === "duplicate" || reply.kind === "tooLow") {
				return finish(request, { kind: "consumed", request, lookup: await lookUp(request, LOOKUP_DELAYS_MS) });
			}
			if (reply.kind === "expired" || (reply.kind === "rejected" && (await hasLapsed(request)))) {
				return finish(request, { kind: "expired", request, lookup: await lookUp(request, [0]) });
			}
			if (reply.kind === "rejected" || reply.kind === "unreachable") error = reply.error;
		}
		return { kind: "pending", request, error };
	}

	function finish(request: PendingRequest, settlement: Settlement): Settlement {
		env.store.remove(request);
		return settlement;
	}

	async function send(body: unknown, timeoutMs: number | null): Promise<Reply> {
		try {
			const signal = timeoutMs === null ? undefined : AbortSignal.timeout(timeoutMs);
			return classifyReply(await transport().request("exchange", body, signal));
		} catch (error) {
			return { kind: "unreachable", error: errorMessage(error) };
		}
	}

	async function hasLapsed(request: PendingRequest): Promise<boolean> {
		try {
			return (await env.clock.now()) > request.expiresAfter + LAPSE_MARGIN_MS;
		} catch {
			return false;
		}
	}

	function slotOf(requestKey: string): string {
		return requestKey.slice(0, requestKey.lastIndexOf("#"));
	}

	function storedRequest(requestKey: string): PendingRequest | null {
		const request = env.store.get(slotOf(requestKey));
		return request && getRequestKey(request) === requestKey ? request : null;
	}

	function retry(requestKey: string): Promise<Settlement | Busy | Missing> {
		return exclusive(slotOf(requestKey), () =>
			withSlotLock(slotOf(requestKey), async () => {
				const request = storedRequest(requestKey);
				return request ? settle(request, false) : { kind: "missing" as const };
			}),
		);
	}

	function cancel(signer: Signer, requestKey: string): Promise<CancelOutcome> {
		return exclusive(slotOf(requestKey), () =>
			withSlotLock(slotOf(requestKey), async (): Promise<CancelOutcome> => {
				const request = storedRequest(requestKey);
				if (!request) return { kind: "missing" };
				if ((await getWalletAddress(signer.config.wallet)).toLowerCase() !== request.signer) {
					return { kind: "foreignSigner", request };
				}
				let cancelBody: SignedBody;
				try {
					cancelBody = await holdSign(signer.config, (held) => noop(held, { nonce: request.nonce }));
				} catch (error) {
					return { kind: "pending", request, error: errorMessage(error) };
				}
				const reply = await send(cancelBody, READ_TIMEOUT_MS);
				if (reply.kind === "ok") return finish(request, { kind: "canceled", request });
				if (reply.kind === "duplicate" || reply.kind === "tooLow") {
					return finish(request, { kind: "consumed", request, lookup: await lookUp(request, LOOKUP_DELAYS_MS) });
				}
				return { kind: "pending", request, error: "error" in reply ? reply.error : reply.kind };
			}),
		);
	}

	function lookUp(request: PendingRequest, delays: number[]): Promise<Lookup> {
		return request.kind === "order" ? lookUpOrders(request, delays) : lookUpTwap(request, delays);
	}

	async function lookUpOrders(request: PendingRequest, delays: number[]): Promise<Lookup> {
		const statuses = await poll(
			delays,
			() => readOrderStatuses(request),
			(latest) => latest.every((status) => status.status !== "unknownOid"),
		);
		return { kind: "order", statuses };
	}

	async function lookUpTwap(request: PendingRequest, delays: number[]): Promise<Lookup> {
		const found = await poll(
			delays,
			async () => {
				const history = await readTwapHistory(request.user);
				return history && { match: findOurTwap(history, request) };
			},
			(latest) => latest.match !== null,
		);
		return { kind: "twap", match: found?.match ?? null, readable: found !== null };
	}

	async function readOrderStatuses(request: PendingRequest): Promise<OrderStatusResponse[] | null> {
		const signal = AbortSignal.timeout(READ_TIMEOUT_MS);
		try {
			return await Promise.all(
				request.cloids.map((cloid) =>
					env.info().orderStatus({ user: request.user as `0x${string}`, oid: cloid as `0x${string}` }, signal),
				),
			);
		} catch {
			return null;
		}
	}

	async function readTwapHistory(user: string): Promise<TwapHistoryResponse | null> {
		try {
			return await env.info().twapHistory({ user: user as `0x${string}` }, AbortSignal.timeout(READ_TIMEOUT_MS));
		} catch {
			return null;
		}
	}

	async function readTwapIds(user: string): Promise<number[] | null> {
		const history = await readTwapHistory(user);
		return history ? history.flatMap(({ twapId }) => (twapId === undefined ? [] : [twapId])) : null;
	}

	function list(user: string): PendingRequest[] {
		return env.store.list(getUserSlotPrefix(network(), user));
	}

	async function poll<T>(
		delays: number[],
		read: () => Promise<T | null>,
		isDone: (latest: T) => boolean,
	): Promise<T | null> {
		let latest: T | null = null;
		for (const delay of delays) {
			if (delay > 0) await sleep(delay);
			latest = (await read()) ?? latest;
			if (latest && isDone(latest)) return latest;
		}
		return latest;
	}

	return {
		submit,
		retry,
		cancel,
		list,
		subscribe: env.store.subscribe,
		warmClock: env.clock.warm,
		isBusy: () => sending.size > 0,
		subscribeBusy(listener: () => void) {
			busyListeners.add(listener);
			return () => busyListeners.delete(listener);
		},
	};
}

export type OrderSender = ReturnType<typeof createOrderSender>;

export function placedNothing(settlement: Settlement): boolean {
	if (settlement.kind === "canceled") return true;
	if (settlement.kind !== "expired") return false;
	const { lookup } = settlement;
	if (lookup.kind === "twap") return lookup.match === null;
	return lookup.statuses?.every((status) => status.status === "unknownOid") === true;
}

export function findOurTwap(history: TwapHistoryResponse, request: PendingRequest): TwapRecord | null {
	if (!request.twap?.knownIds) return null;
	const known = new Set(request.twap.knownIds);
	const { twap } = (JSON.parse(request.body) as { action: TwapParams }).action;
	const side = twap.b ? "B" : "A";
	return (
		history.find(
			({ twapId, state }) =>
				twapId !== undefined &&
				!known.has(twapId) &&
				state.coin === request.twap?.coin &&
				state.side === side &&
				Big(state.sz).eq(twap.s) &&
				state.minutes === twap.m &&
				state.reduceOnly === twap.r &&
				state.randomize === twap.t,
		) ?? null
	);
}

async function holdSign(
	config: ExchangeSingleWalletConfig,
	sign: (held: ExchangeSingleWalletConfig) => Promise<unknown>,
): Promise<SignedBody> {
	let captured: unknown = null;
	const held: IRequestTransport = {
		isTestnet: config.transport.isTestnet,
		async request(_endpoint, payload) {
			captured = payload;
			throw new HeldBeforeSend();
		},
	};
	try {
		await sign({ ...config, transport: held });
	} catch (error) {
		if (!(error instanceof HeldBeforeSend)) throw error;
	}
	const body: unknown = JSON.parse(JSON.stringify(captured));
	if (!isRecord(body) || typeof body.nonce !== "number") throw new Error("Signing produced no request");
	return body as SignedBody;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
