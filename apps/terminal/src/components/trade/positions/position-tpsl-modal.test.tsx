import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PositionTpSlModal } from "@/components/trade/positions/position-tpsl-modal";

const typedOverPrefill = vi.hoisted(() => new Map<string, string>());
const exchange = vi.hoisted(() => ({ placeOrder: vi.fn() }));
const confirm = vi.hoisted(() => ({ onClick: null as null | (() => Promise<void>), disabled: true }));

vi.mock("react", async (importOriginal) => {
	const react = await importOriginal<typeof import("react")>();
	function useState<S>(initial: S | (() => S)) {
		const typed = typeof initial === "string" ? typedOverPrefill.get(initial) : undefined;
		return react.useState(typed ?? initial);
	}
	return { ...react, useState };
});

vi.mock("@hypeterminal/ui", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/ui")>()),
	ModalPopup: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@/components/trade/components/trading-action-button", () => ({
	TradingActionButton: (props: { onClick: () => Promise<void>; disabled: boolean }) => {
		confirm.onClick = props.onClick;
		confirm.disabled = props.disabled;
		return null;
	},
}));

vi.mock("@/components/trade/components/asset-display", () => ({
	AssetDisplay: () => null,
}));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useExchange: () => ({ mutateAsync: exchange.placeOrder, isPending: false }),
}));

const SOL_SHORT = {
	coin: "SOL",
	assetId: 5,
	isLong: false,
	size: 1,
	entryPx: 80.276,
	markPx: 80.276,
	unrealizedPnl: 0,
	roe: 0,
	szDecimals: 2,
	existingTpPrice: 70,
	existingSlPrice: 90,
};

async function pressConfirm() {
	renderToString(<PositionTpSlModal open onOpenChange={() => {}} position={SOL_SHORT} />);
	expect(confirm.disabled).toBe(false);
	await confirm.onClick?.();
}

describe("position tp/sl modal", () => {
	beforeEach(() => {
		typedOverPrefill.clear();
		confirm.onClick = null;
		confirm.disabled = true;
		exchange.placeOrder.mockReset();
		exchange.placeOrder.mockResolvedValue({
			response: { data: { statuses: ["waitingForTrigger", "waitingForTrigger"] } },
		});
	});

	it("sends a short's tp and sl from the typed strings a number cannot hold", async () => {
		typedOverPrefill.set("70.0000", "74.999999999999999");
		typedOverPrefill.set("90.0000", "84.999999999999999");
		await pressConfirm();
		expect(exchange.placeOrder.mock.calls).toEqual([
			[
				{
					orders: [
						{
							a: 5,
							b: true,
							p: "74.999",
							s: "0",
							r: true,
							t: { trigger: { isMarket: true, triggerPx: "74.999", tpsl: "tp" } },
						},
						{
							a: 5,
							b: true,
							p: "84.999",
							s: "0",
							r: true,
							t: { trigger: { isMarket: true, triggerPx: "85", tpsl: "sl" } },
						},
					],
					grouping: "positionTpsl",
				},
			],
		]);
	});
});
