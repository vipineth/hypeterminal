import type * as React from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileTradeTicketBody } from "@/components/trade/mobile/mobile-trade-ticket-body";
import { TradeFormFields } from "@/components/trade/tradebox/trade-form-fields";
import { typeKeys } from "@/test/type-keys";

const PURR_USDC = vi.hoisted(() => ({
	kind: "spot",
	name: "PURR/USDC",
	pairName: "PURR/USDC",
	assetId: 10000,
	szDecimals: 0,
	markPx: "4.5342",
	tokensInfo: [
		{ name: "PURR", displayName: "PURR" },
		{ name: "USDC", displayName: "USDC" },
	],
}));

const form = vi.hoisted(() => ({ sizeMode: "quote", size: "", setSize: (_size: string) => {} }));
const rendered = vi.hoisted(() => ({ inputs: [] as React.ComponentProps<"input">[] }));

vi.mock("@base-ui/react/input", () => ({
	Input: (props: React.ComponentProps<"input">) => {
		rendered.inputs.push(props);
		return null;
	},
}));

vi.mock("@hypeterminal/ui", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/ui")>()),
	DrawerTitle: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/trade/components/wallet-modal", () => ({ WalletModal: () => null }));
vi.mock("@/components/trade/tradebox/margin-mode-modal", () => ({ MarginModeModal: () => null }));
vi.mock("@/components/trade/tradebox/trade-ticket-summary", () => ({ TradeTicketSummary: () => null }));
vi.mock("@/components/trade/mobile/mobile-ticket-advanced", () => ({ MobileTicketAdvanced: () => null }));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: "0x0000000000000000000000000000000000000001", isConnected: true }),
	useWalletClient: () => ({ data: {}, isLoading: false, error: null }),
	useSwitchChain: () => ({ isPending: false, mutate: () => {} }),
}));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useSelectedMarketInfo: () => ({ data: PURR_USDC }),
	useUserPositions: () => ({ getPosition: () => null }),
	useAgentStatus: () => ({ isReady: true, isLoading: false }),
	useAgentRegistration: () => ({ register: async () => {}, status: "ready" }),
	useExchange: () => ({ mutateAsync: async () => {}, isPending: false }),
}));

vi.mock("@/hooks/trade/use-fee-rates", () => ({
	useFeeRates: () => ({ takerRate: 0.0007, makerRate: 0.0004 }),
}));

vi.mock("@/hooks/trade/use-account-balances", () => ({
	useDefaultDexBalances: () => ({
		spotBalances: [{ coin: "USDC", token: 0, total: "1000", hold: "0", entryNtl: "0" }],
		spotAvailableAfterMaintenance: null,
	}),
}));

vi.mock("@/hooks/trade/use-asset-leverage", () => ({
	useAssetLeverage: () => ({ maxTradeSzs: null, availableToTrade: null }),
}));

vi.mock("@/stores/use-order-queue-store", () => ({
	useOrderQueueActions: () => ({ addOrder: () => "order-1", updateOrder: () => {}, removeOrder: () => {} }),
}));

vi.mock("@/stores/use-order-entry-store", () => ({
	useOrderSide: () => "buy",
	useOrderType: () => "market",
	useSizeMode: () => form.sizeMode,
	useReduceOnly: () => false,
	useOrderSize: () => form.size,
	useLimitPrice: () => "",
	useTriggerPrice: () => "",
	useScaleStart: () => "",
	useScaleEnd: () => "",
	useScaleLevels: () => 4,
	useTwapMinutes: () => null,
	useTwapRandomize: () => false,
	useTpSlEnabled: () => false,
	useTpPrice: () => "",
	useSlPrice: () => "",
	useTif: () => "Gtc",
	useOrderEntryActions: () => ({
		resetForm: () => {},
		setOrderType: () => {},
		setSizeMode: () => {},
		setSize: (size: string) => form.setSize(size),
		setLimitPrice: () => {},
		setTriggerPrice: () => {},
		setReduceOnly: () => {},
		setTpSlEnabled: () => {},
	}),
}));

const TICKETS = {
	desktop: () => (
		<TradeFormFields
			price={4.5342}
			positionSize={0}
			swapTargetToken={null}
			onSizeModeToggle={() => {}}
			onSizePercentApply={() => {}}
			onDepositClick={() => {}}
			onSwapClick={() => {}}
		/>
	),
	mobile: () => <MobileTradeTicketBody onSubmitted={() => {}} />,
};

function typeSize(ticket: () => React.ReactElement, keys: string[], initialValue = ""): string {
	return typeKeys(
		(value, commit) => {
			form.size = value;
			form.setSize = commit;
			rendered.inputs = [];
			renderToString(ticket());
			const sizeInputs = rendered.inputs.filter((input) => input.placeholder === "0.00");
			expect(sizeInputs).toHaveLength(1);
			return sizeInputs[0];
		},
		keys,
		initialValue,
	);
}

describe.each(Object.entries(TICKETS))("%s size input on a whole-lot market", (_name, ticket) => {
	beforeEach(() => {
		form.sizeMode = "quote";
	});

	it("keeps 27.21 typed as USDC", () => {
		expect(typeSize(ticket, [..."27.21"])).toBe("27.21");
	});

	it("lets a toggled 27.21 USDC be edited", () => {
		expect(typeSize(ticket, ["Backspace", "5"], "27.21")).toBe("27.25");
	});

	it("caps a base size at whole lots without dropping the point", () => {
		form.sizeMode = "base";
		expect(typeSize(ticket, [..."27.21"])).toBe("27.");
	});
});
