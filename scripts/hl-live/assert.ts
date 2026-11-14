import type { ClearinghouseStateResponse, L2BookResponse, OrderSuccessResponse } from "@nktkas/hyperliquid";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import type { ExchangeOrder } from "@/config/trade";
import type Big from "big.js";
import { type Numeric, toSafeBig } from "@/lib/trade/numbers";
import { toLegState } from "@/lib/trade/leg-state";

export type StatusKind = "resting" | "filled" | "waitingForFill" | "waitingForTrigger" | "error";

export type OrderStatus = OrderSuccessResponse["response"]["data"]["statuses"][number];

export type WireMarketKind = "perp" | "builderPerp" | "spot";

const MIN_ORDER_NOTIONAL = 10;
const ROUND_UP = 3;
const PRICE_SIG_FIGS = 5;

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

export function statusKind(status: OrderStatus): StatusKind {
	if (typeof status === "string") return status;
	if ("resting" in status) return "resting";
	if ("filled" in status) return "filled";
	return "error";
}

export function expectStatuses(statuses: OrderStatus[], expected: StatusKind[]): void {
	const failures = statuses.map(toLegState).filter((state) => state.status !== "placed");
	if (statuses.length === 0 || failures.length > 0) {
		const reasons = failures.map((state) => (state.status === "rejected" && state.reason ? state.reason : state.status));
		throw new Error(`the app reads the response as a failure: ${reasons.join("; ") || "no response from exchange"}`);
	}
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

export function priceStep(price: Numeric, szDecimals: number, kind: WireMarketKind): Big {
	const maxDecimals = Math.max((kind === "spot" ? 8 : 6) - szDecimals, 0);
	const decimalStep = toSafeBig(10).pow(-maxDecimals);
	const magnitude = Math.floor(Math.log10(toSafeBig(price).toNumber()));
	const sigFigStep = toSafeBig(10).pow(Math.min(magnitude - PRICE_SIG_FIGS + 1, 0));
	return decimalStep.gt(sigFigStep) ? decimalStep : sigFigStep;
}

export function priceWithin(actual: Numeric, target: Numeric, step: Big, slackBps = 0): boolean {
	const slack = toSafeBig(target).times(slackBps).div(10_000);
	return toSafeBig(actual).minus(toSafeBig(target)).abs().lte(step.plus(slack));
}
