import Big from "big.js";
import { describe, expect, it } from "vitest";
import { ORDER_MIN_NOTIONAL_USD } from "@/config/trade";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { getSwapQuote } from "@/domain/trade/swap";

interface SwapMarket {
	assetId: number;
	markPx: string;
	szDecimals: number;
}

const JEFF_USDC: SwapMarket = { assetId: 10004, markPx: "2.1164", szDecimals: 0 };
const HFUN_USDC: SwapMarket = { assetId: 10001, markPx: "10.714", szDecimals: 2 };

function swap(market: SwapMarket, amount: string, isBuying: boolean) {
	const quote = getSwapQuote({ amount, markPx: market.markPx, szDecimals: market.szDecimals, isBuying });
	const plan = buildOrderPlan({
		kind: "swap",
		assetId: market.assetId,
		isBuy: isBuying,
		sizeValue: quote.orderSize,
		szDecimals: market.szDecimals,
		markPx: Number(market.markPx),
		slippageBps: 100,
	});
	return { wireSize: plan.orders[0]?.s, estimatedReceive: quote.estimatedReceive };
}

describe("swap buy sizing", () => {
	it("buys 25 JEFF for 52.91 USDC at a 2.1164 mark", () => {
		expect(swap(JEFF_USDC, "52.91", true).wireSize).toBe("25");
	});

	it("buys 55 HFUN for 589.27 USDC at a 10.714 mark", () => {
		expect(swap(HFUN_USDC, "589.27", true).wireSize).toBe("55");
	});

	it("never sends one lot fewer than a lot-exact amount buys", () => {
		const misses: string[] = [];
		for (const market of [JEFF_USDC, HFUN_USDC]) {
			const lot = Big(10).pow(-market.szDecimals);
			for (let lots = 1; lots <= 3000; lots++) {
				const size = lot.times(lots);
				const amount = size.times(market.markPx);
				if (amount.lt(ORDER_MIN_NOTIONAL_USD)) continue;
				const { wireSize } = swap(market, amount.toFixed(), true);
				if (wireSize !== size.toFixed()) misses.push(`${amount.toFixed()} at ${market.markPx} sent ${wireSize}`);
			}
		}
		expect(misses.length, misses.slice(0, 3).join("; ")).toBe(0);
	});

	it("shows the size the wire sends", () => {
		const { wireSize, estimatedReceive } = swap(JEFF_USDC, "52.91", true);
		expect(estimatedReceive).toBe(Number(wireSize));
	});
});

describe("swap sell sizing", () => {
	it("sells whole lots and quotes the receive for the lots it sells", () => {
		const { wireSize, estimatedReceive } = swap(HFUN_USDC, "1.239", false);
		expect(wireSize).toBe("1.23");
		expect(estimatedReceive).toBe(13.17822);
	});
});
