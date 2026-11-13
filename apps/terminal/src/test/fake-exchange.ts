import { ExchangeClient, HttpRequestError, InfoClient, type IRequestTransport } from "@nktkas/hyperliquid";
import { keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { ChangeBus, KeyValueStore } from "@/lib/trade/pending-requests";

export const TEST_USER = "0x0000000000000000000000000000000000000001";
export const TEST_AGENT_KEY = keccak256(stringToHex("hypeterminal fake exchange agent"));
export const OTHER_AGENT_KEY = keccak256(stringToHex("hypeterminal fake exchange other agent"));

type Fate = "deliver" | "lost" | "noReply" | "inTransit";

export type WireOrder = {
	a: number;
	b: boolean;
	p: string;
	s: string;
	r: boolean;
	t: { limit: { tif: string } } | { trigger: { isMarket: boolean; triggerPx: string; tpsl: string } };
	c?: string;
};

type Body = { action: Record<string, unknown> & { type: string }; nonce: number; expiresAfter?: number };

export type LegOutcome = { status: unknown; lookup: string };

type TwapHistoryRecord = {
	time: number;
	state: Record<string, unknown> & { coin: string; timestamp: number };
	status: { status: string; description?: string };
	twapId?: number;
};

const DEFAULT_COINS: Record<number, string> = { 4: "ETH", 5: "SOL", 10008: "@8" };

let nextTwapId = 50000;

export function createFakeExchange({ coins = DEFAULT_COINS }: { coins?: Record<number, string> } = {}) {
	const exchangeRequests: string[] = [];
	const processedNonces = new Set<number>();
	const lookups = new Map<string, { status: string; order: WireOrder & { oid: number; isTrigger: boolean } }>();
	const twapHistory: TwapHistoryRecord[] = [];
	const inTransit: Body[] = [];
	const fates: Fate[] = [];
	const state = {
		offline: false,
		exchangeDown: false,
		infoDown: false,
		rejectWith: null as string | null,
		rejectConsumes: false,
		lookupLag: 0,
		clockSkewMs: 0,
		nonceFloor: 0,
		nextOid: 1,
		placedLegs: 0,
		startedTwaps: 0,
		twapError: null as string | null,
		twapStatus: { status: "activated" } as TwapHistoryRecord["status"],
		legOutcome: null as null | ((order: WireOrder, index: number) => LegOutcome | undefined),
		onArrive: null as null | ((body: Body) => void),
		onSend: null as null | ((body: Body) => void),
		onReply: null as null | ((reply: unknown) => Promise<void> | void),
	};

	function exchangeNow() {
		return Date.now() + state.clockSkewMs;
	}

	function timedOut() {
		return new HttpRequestError({ detail: "Request timed out after 10000 ms" });
	}

	function defaultLegOutcome(order: WireOrder, oid: number): LegOutcome {
		if ("trigger" in order.t) return { status: "waitingForTrigger", lookup: "open" };
		if (order.t.limit.tif === "FrontendMarket" || order.t.limit.tif === "Ioc") {
			return { status: { filled: { totalSz: order.s, avgPx: order.p, oid } }, lookup: "filled" };
		}
		return { status: { resting: { oid } }, lookup: "open" };
	}

	function placeLeg(order: WireOrder, index: number): unknown {
		const oid = state.nextOid++;
		const outcome = state.legOutcome?.(order, index) ?? defaultLegOutcome(order, oid);
		const isError = typeof outcome.status === "object" && outcome.status !== null && "error" in outcome.status;
		if (!isError) state.placedLegs++;
		if (order.c)
			lookups.set(order.c, { status: outcome.lookup, order: { ...order, oid, isTrigger: "trigger" in order.t } });
		return outcome.status;
	}

	function startTwap(twap: Record<string, unknown>) {
		if (state.twapError) return { status: { error: state.twapError } };
		const twapId = nextTwapId++;
		state.startedTwaps++;
		twapHistory.push({
			time: Math.floor(exchangeNow() / 1000),
			state: {
				coin: coins[twap.a as number] ?? `#${twap.a}`,
				side: twap.b ? "B" : "A",
				sz: String(twap.s),
				executedSz: "0.0",
				executedNtl: "0.0",
				minutes: twap.m,
				reduceOnly: twap.r,
				randomize: twap.t,
				timestamp: exchangeNow(),
			},
			status: state.twapStatus,
			twapId,
		});
		return { status: { running: { twapId } } };
	}

	function process(body: Body): unknown {
		state.onArrive?.(body);
		const { action, nonce, expiresAfter } = body;
		if (state.rejectWith && !state.rejectConsumes) return { status: "err", response: state.rejectWith };
		if (processedNonces.has(nonce)) return { status: "err", response: `Invalid nonce: duplicate nonce ${nonce}` };
		if (nonce <= state.nonceFloor) {
			return { status: "err", response: `Invalid nonce: nonce too low ${nonce} < ${state.nonceFloor + 1}` };
		}
		processedNonces.add(nonce);
		if (state.rejectWith) return { status: "err", response: state.rejectWith };
		if (expiresAfter !== undefined && exchangeNow() > expiresAfter) {
			return { status: "err", response: "Action already expired" };
		}
		if (action.type === "noop") return { status: "ok", response: { type: "default" } };
		if (action.type === "twapOrder") {
			return { status: "ok", response: { type: "twapOrder", data: startTwap(action.twap as Record<string, unknown>) } };
		}
		const statuses = (action.orders as WireOrder[]).map(placeLeg);
		return { status: "ok", response: { type: "order", data: { statuses } } };
	}

	function answerInfo(payload: { type: string; oid?: string }): unknown {
		if (payload.type === "exchangeStatus") return { time: exchangeNow(), specialStatuses: null };
		if (payload.type === "twapHistory") return structuredClone(twapHistory);
		if (payload.type === "orderStatus") {
			if (state.lookupLag > 0) {
				state.lookupLag--;
				return { status: "unknownOid" };
			}
			const found = payload.oid ? lookups.get(payload.oid) : undefined;
			if (!found) return { status: "unknownOid" };
			return { status: "order", order: { order: found.order, status: found.status, statusTimestamp: exchangeNow() } };
		}
		throw new Error(`fake exchange has no info type ${payload.type}`);
	}

	const transport: IRequestTransport = {
		isTestnet: true,
		async request<T>(endpoint: string, payload: unknown): Promise<T> {
			if (state.offline) throw new HttpRequestError({ detail: "Failed to fetch" });
			if (endpoint === "info") {
				if (state.infoDown) throw new HttpRequestError({ detail: "Failed to fetch" });
				return answerInfo(payload as { type: string }) as T;
			}
			exchangeRequests.push(JSON.stringify(payload));
			const fate = fates.shift() ?? (state.exchangeDown ? "lost" : "deliver");
			state.onSend?.(payload as Body);
			if (fate === "lost") throw timedOut();
			if (fate === "inTransit") {
				inTransit.push(payload as Body);
				throw timedOut();
			}
			const reply = process(payload as Body);
			if (fate === "noReply" || state.exchangeDown) throw timedOut();
			await state.onReply?.(reply);
			return reply as T;
		},
	};

	return {
		state,
		transport,
		trading: new ExchangeClient({ transport, wallet: privateKeyToAccount(TEST_AGENT_KEY) }),
		info: new InfoClient({ transport }),
		exchangeRequests,
		twapHistory,
		nextExchangeRequests(...next: Fate[]) {
			fates.push(...next);
		},
		deliverInTransit(): unknown[] {
			return inTransit.splice(0).map(process);
		},
		sentBodies(): Body[] {
			return exchangeRequests.map((raw) => JSON.parse(raw));
		},
		orderRequests(): Body[] {
			return exchangeRequests.map((raw) => JSON.parse(raw) as Body).filter((body) => body.action.type === "order");
		},
		seedTwap(record: TwapHistoryRecord) {
			twapHistory.push(record);
		},
		exchangeNow,
	};
}

export type FakeExchange = ReturnType<typeof createFakeExchange>;

export function createMemoryKeyValue() {
	const items = new Map<string, unknown>();
	return {
		items,
		async get(key: string): Promise<unknown> {
			await Promise.resolve();
			return structuredClone(items.get(key));
		},
		async set(key: string, value: unknown) {
			await Promise.resolve();
			items.set(key, structuredClone(value));
		},
		async keys() {
			return [...items.keys()];
		},
	};
}

export type MemoryKeyValue = ReturnType<typeof createMemoryKeyValue>;

export function failingWrites(store: KeyValueStore, keyPrefix = ""): KeyValueStore {
	return {
		get: (key) => store.get(key),
		keys: () => store.keys(),
		async set(key, value) {
			if (key.startsWith(keyPrefix)) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
			await store.set(key, value);
		},
	};
}

export function createMemoryBus() {
	const endpoints = new Set<{ owner: object; listener: (slot: string) => void }>();
	return {
		join(): ChangeBus {
			const owner = {};
			return {
				post(slot) {
					for (const endpoint of endpoints) {
						if (endpoint.owner !== owner) queueMicrotask(() => endpoint.listener(slot));
					}
				},
				subscribe(listener) {
					const endpoint = { owner, listener };
					endpoints.add(endpoint);
					return () => endpoints.delete(endpoint);
				},
			};
		},
	};
}

export function goesDownOnFirstSend(exchange: FakeExchange) {
	exchange.state.onSend = () => {
		exchange.state.exchangeDown = true;
		exchange.state.infoDown = true;
		exchange.state.onSend = null;
	};
}

export function comesBackUp(exchange: FakeExchange) {
	exchange.state.exchangeDown = false;
	exchange.state.infoDown = false;
}

export function createMemoryLocks() {
	const tails = new Map<string, Promise<unknown>>();
	return {
		request<T>(name: string, callback: () => Promise<T>): Promise<T> {
			const previous = tails.get(name) ?? Promise.resolve();
			const run = previous.then(callback, callback);
			tails.set(
				name,
				run.catch(() => undefined),
			);
			return run;
		},
	};
}
