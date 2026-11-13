import type { ClearinghouseStateResponse, FrontendOpenOrdersResponse, L2BookResponse, OrderSuccessResponse } from "@nktkas/hyperliquid";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import type { ExchangeOrder } from "@/config/trade";
import type Big from "big.js";
import { type Numeric, toSafeBig } from "@/lib/trade/numbers";

export type StatusKind = "resting" | "filled" | "waitingForFill" | "waitingForTrigger" | "error";

export type OrderStatus = OrderSuccessResponse["response"]["data"]["statuses"][number];

export type WireMarketKind = "perp" | "builderPerp" | "spot";

export const HARNESS_CLOID_PREFIX = "0x686c6c697665";
const MIN_ORDER_NOTIONAL = 10;
const ROUND_UP = 3;

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function newCloid(): `0x${string}` {
	const tail = Array.from(crypto.getRandomValues(new Uint8Array(10)), (byte) => byte.toString(16).padStart(2, "0"));
	return `${HARNESS_CLOID_PREFIX}${tail.join("")}`;
}

export function isHarnessCloid(cloid: string | null | undefined): boolean {
	return typeof cloid === "string" && cloid.startsWith(HARNESS_CLOID_PREFIX);
}

export function statusKind(status: OrderStatus): StatusKind {
	if (typeof status === "string") return status;
	if ("resting" in status) return "resting";
	if ("filled" in status) return "filled";
	return "error";
}

export function expectStatuses(statuses: OrderStatus[], expected: StatusKind[]): void {
	const actual = statuses.map(statusKind);
	if (actual.join() !== expected.join()) {
		throw new Error(`expected statuses [${expected.join(", ")}], got ${JSON.stringify(statuses)}`);
	}
}

export function positionSize(state: ClearinghouseStateResponse, coin: string): string {
	return state.assetPositions.find((entry) => entry.position.coin === coin)?.position.szi ?? "0";
}

export function expectPosition(state: ClearinghouseStateResponse, coin: string, expected: Numeric): void {
	const actual = positionSize(state, coin);
	if (!toSafeBig(actual).eq(toSafeBig(expected))) throw new Error(`expected ${coin} position ${toSafeBig(expected).toString()}, got ${actual}`);
}

export function harnessOrders(orders: FrontendOpenOrdersResponse, coin?: string): FrontendOpenOrdersResponse {
	return orders.filter((order) => isHarnessCloid(order.cloid) && (coin === undefined || order.coin === coin));
}

export function depthWithinSlippage(book: L2BookResponse | null, isBuy: boolean, markPx: Numeric, slippageBps: number): Big {
	const [bids, asks] = book?.levels ?? [[], []];
	const band = toSafeBig(slippageBps).div(10_000);
	const limit = toSafeBig(markPx).times(isBuy ? band.plus(1) : toSafeBig(1).minus(band));
	return (isBuy ? asks : bids)
		.filter((level) => (isBuy ? toSafeBig(level.px).lte(limit) : toSafeBig(level.px).gte(limit)))
		.reduce((sum, level) => sum.plus(toSafeBig(level.sz)), toSafeBig(0));
}

export function sizeForNotional(markPx: Numeric, szDecimals: number, notional: number, wholeTens = false): string {
	const raw = toSafeBig(notional).div(toSafeBig(markPx)).round(szDecimals, ROUND_UP);
	if (szDecimals > 0 || !wholeTens) return raw.toString();
	return raw.div(10).round(0, ROUND_UP).times(10).toString();
}

export function validateOrder(order: ExchangeOrder, kind: WireMarketKind, szDecimals: number, markPx: Numeric): string[] {
	const problems: string[] = [];
	const priceType = kind === "spot" ? "spot" : "perp";
	const check = (label: string, value: string, format: (value: string) => string) => {
		try {
			const onGrid = format(value);
			if (onGrid !== value) problems.push(`${label} ${value} is not on the wire grid, expected ${onGrid}`);
		} catch (error) {
			problems.push(`${label} ${value} is invalid: ${errorMessage(error)}`);
		}
	};
	const toPriceGrid = (value: string) => formatPrice(value, szDecimals, priceType);
	check("price", order.p, toPriceGrid);
	if ("trigger" in order.t) check("trigger", String(order.t.trigger.triggerPx), toPriceGrid);
	if (order.s !== "0") {
		check("size", order.s, (value) => formatSize(value, szDecimals));
		if (!order.r && toSafeBig(order.s).times(toSafeBig(markPx)).lt(MIN_ORDER_NOTIONAL)) problems.push(`notional below ${MIN_ORDER_NOTIONAL}`);
	}
	return problems;
}
