import { readFileSync } from "node:fs";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { PriceInput } from "@/components/ui/price-input";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";

const snapshot: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const bid = parseMarkets(snapshot).byName.get("@33");

function clickMid(props: React.ComponentProps<typeof PriceInput>) {
	const element = PriceInput(props) as React.ReactElement<{ onMaxClick?: () => void }>;
	element.props.onMaxClick?.();
}

describe("PriceInput mid", () => {
	it("writes a sub-cent spot mid at the spot precision", () => {
		const onMidClick = vi.fn();
		clickMid({ midPrice: 0.00000032, priceDecimals: bid?.priceDecimals, onMidClick });

		expect(bid?.pairName).toBe("BID/USDC");
		expect(onMidClick).toHaveBeenCalledWith("0.00000032");
	});
});
