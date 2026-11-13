import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PositionTpSlModal } from "@/components/trade/positions/position-tpsl-modal";

const typedOverPrefill = vi.hoisted(() => new Map<string, string>());
const exchange = vi.hoisted(() => ({ placeOrder: vi.fn() }));
const confirm = vi.hoisted(() => ({ onClick: null as null | (() => Promise<void>), disabled: true }));
const liveMark = vi.hoisted(() => ({
	markPx: undefined as string | undefined,
	status: "active",
	isStale: false,
	subscribed: [] as unknown[][],
}));
const feed = vi.hoisted(() => ({
	useSubscription: () => ({ data: liveMark.markPx ? { ctx: { markPx: liveMark.markPx } } : undefined, ...liveMark }),
}));

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
	useSubscription: (method: string, params: unknown) => {
		liveMark.subscribed.push([method, params]);
		return feed.useSubscription();
	},
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

const NVDA_LONG = {
	...SOL_SHORT,
	coin: "xyz:NVDA",
	assetId: 110000,
	isLong: true,
	entryPx: 180,
	markPx: 180,
	existingTpPrice: 200,
	existingSlPrice: 170,
};

function render(position = SOL_SHORT): string {
	return renderToString(<PositionTpSlModal open onOpenChange={() => {}} position={position} />);
}

async function pressConfirm() {
	render();
	expect(confirm.disabled).toBe(false);
	await confirm.onClick?.();
}

describe("position tp/sl modal", () => {
	beforeEach(() => {
		typedOverPrefill.clear();
		confirm.onClick = null;
		confirm.disabled = true;
		liveMark.markPx = "80.276";
		liveMark.status = "active";
		liveMark.isStale = false;
		liveMark.subscribed = [];
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

	it("blocks a stop the live mark has crossed since the row was clicked", () => {
		liveMark.markPx = "95";
		render();
		expect(confirm.disabled).toBe(true);
	});

	it("blocks confirm and says why while the live mark is unknown", () => {
		liveMark.markPx = undefined;
		const html = render();
		expect(confirm.disabled).toBe(true);
		expect(html).toContain("Waiting for live mark price");
	});

	it("blocks confirm and says why when the mark feed has gone quiet", () => {
		liveMark.isStale = true;
		const html = render();
		expect(confirm.disabled).toBe(true);
		expect(html).toContain("Waiting for live mark price");
	});

	it("blocks confirm and says why when the mark feed has failed", () => {
		liveMark.status = "error";
		const html = render();
		expect(confirm.disabled).toBe(true);
		expect(html).toContain("Waiting for live mark price");
	});

	it("blocks confirm on the last mark while the feed resubscribes", () => {
		liveMark.status = "subscribing";
		render();
		expect(confirm.disabled).toBe(true);
	});

	it("says a trigger is needed when both fields are empty", () => {
		typedOverPrefill.set("70.0000", "");
		typedOverPrefill.set("90.0000", "");
		const html = render();
		expect(confirm.disabled).toBe(true);
		expect(html).toContain("Enter TP or SL price");
	});

	it("reads the live mark of a builder market under its prefixed name", () => {
		liveMark.markPx = "180";
		render(NVDA_LONG);
		expect(liveMark.subscribed).toContainEqual(["activeAssetCtx", { coin: "xyz:NVDA" }]);
	});

	it("tells a short which way its crossed stop and take profit must move", () => {
		liveMark.markPx = "95";
		expect(render()).toContain("SL must be above mark");
		liveMark.markPx = "65";
		expect(render()).toContain("TP must be below mark");
	});

	it("tells a long which way its crossed stop and take profit must move", () => {
		liveMark.markPx = "165";
		expect(render(NVDA_LONG)).toContain("SL must be below mark");
		liveMark.markPx = "205";
		expect(render(NVDA_LONG)).toContain("TP must be above mark");
	});

	it("calls a stop that rounds to zero invalid instead of crossed", () => {
		liveMark.markPx = "180";
		typedOverPrefill.set("170.0000", "0.00001");
		const html = render(NVDA_LONG);
		expect(confirm.disabled).toBe(true);
		expect(html).toContain("Enter a valid SL price");
		expect(html).not.toContain("SL must be below mark");
	});
});
