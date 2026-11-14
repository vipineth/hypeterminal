import { readFileSync } from "node:fs";
import { serializeKey, subscriptionKeys } from "@hypeterminal/hl-react";
import { createHyperliquidConfig } from "@hypeterminal/hl-react/create-config";
import { createHyperliquidStore, type HyperliquidStore } from "@hypeterminal/hl-react/store";
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpotSwapModal } from "@/components/trade/components/spot-swap-modal";
import { TradingActionButton } from "@/components/trade/components/trading-action-button";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import type { SubmitPlanInput } from "@/hooks/trade/use-submit-plan";
import { bumpCollateralGeneration, trackCollateralReceipts } from "@/stores/use-collateral-generation-store";
import { clearinghouse } from "@/test/account-fixture";
import { mountHooks } from "@/test/hook-instance";

const net = vi.hoisted(() => ({
	address: "0x00000000000000000000000000000000000000a1" as `0x${string}`,
	store: null as unknown as HyperliquidStore,
	agentReady: false,
	plans: [] as unknown[],
	hypeUsdc: null as unknown,
}));

vi.mock("wagmi", () => ({ useConnection: () => ({ address: net.address, isConnected: true }) }));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useSubscription: (method: string, params: object) => {
		const entry = net.store.getState().subscriptions[serializeKey(subscriptionKeys.method(method, params))];
		return { data: entry?.data, status: entry?.status ?? "idle", error: entry?.error, isStale: entry?.isStale ?? false };
	},
}));

vi.mock("@/lib/hyperliquid/hooks/useMarketsInfo", () => ({
	useMarketsInfo: () => ({ spotMarkets: [net.hypeUsdc] }),
}));

vi.mock("@/stores/use-collateral-generation-store", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/stores/use-collateral-generation-store")>();
	return { ...original, useCollateralGeneration: () => original.getCollateralGeneration() };
});

vi.mock("@/stores/use-global-modal-store", () => ({
	useSwapModalOpen: () => true,
	useSwapModalFromToken: () => "USDC",
	useSwapModalToToken: () => "HYPE",
	useSwapModalActions: () => ({ close: () => {} }),
}));

vi.mock("@/hooks/trade/use-submit-plan", () => ({
	useSubmitPlan: () => ({
		isSubmitting: false,
		submitPlan: async (plan: SubmitPlanInput) => {
			net.plans.push(plan);
			return { ok: true };
		},
	}),
}));

vi.mock("@/hooks/ui/use-auto-close-success", () => ({
	useAutoCloseSuccess: () => ({ showSuccess: false, trigger: () => {} }),
}));

vi.mock("../../../../../../packages/hl-react/src/signing/use-agent-status", () => ({
	useAgentStatus: () => ({
		isReady: net.agentReady,
		isLoading: false,
		signaturesRequired: net.agentReady ? 0 : 1,
	}),
}));

vi.mock("../../../../../../packages/hl-react/src/signing/use-agent-registration", () => ({
	useAgentRegistration: () => ({ register: () => new Promise(() => {}), status: "idle", error: null }),
}));

const model = parseMarkets(
	JSON.parse(readFileSync(new URL("../../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8")) as MetaPayloads,
);
const hypeUsdc = model.byName.get("@107");
net.hypeUsdc = { ...hypeUsdc, markPx: "100" };

function receive(method: string, data: unknown) {
	const key = serializeKey(subscriptionKeys.method(method, { user: net.address }));
	if (!net.store.getState().subscriptions[key]) {
		net.store.getState().acquireSubscription(key, () => new Promise(() => {}));
	}
	net.store.getState().setSubscriptionData(key, data);
}

function receiveSpot(usdc: string) {
	receive("spotState", {
		spotState: {
			balances: [{ coin: "USDC", token: 0, total: usdc, hold: "0.0", entryNtl: "0.0" }],
			tokenToAvailableAfterMaintenance: [[0, usdc]],
		},
	});
}

function loadUnified(usdc: string) {
	receive("webData3", { userState: { abstraction: "unifiedAccount" } });
	receiveSpot(usdc);
	receive("allDexsClearinghouseState", { clearinghouseStates: [["", clearinghouse("0.0")]] });
}

type Node = ReactElement<Record<string, unknown> & { children?: ReactNode }>;

function find(node: unknown, match: (node: Node) => boolean): Node | undefined {
	if (!node || typeof node !== "object") return undefined;
	if (Array.isArray(node)) {
		for (const child of node) {
			const found = find(child, match);
			if (found) return found;
		}
		return undefined;
	}
	const element = node as Node;
	if (element.props && match(element)) return element;
	return find(element.props?.children, match) ?? find(element.props?.tokenSelector, match);
}

interface ButtonProps {
	onClick: () => void | Promise<void>;
	disabled?: boolean;
	children: ReactNode;
}

function mountSwap() {
	const content = SpotSwapModal() as Node;
	const Content = content.type as (props: unknown) => ReactNode;
	const render = mountHooks(() => Content(content.props));
	return {
		setAmount(value: string) {
			const panel = find(render(), (node) => node.props.editable === true);
			if (!panel) throw new Error("no editable amount");
			(panel.props.onAmountChange as (value: string) => void)(value);
		},
		button(): ButtonProps {
			const found = find(render(), (node) => node.type === TradingActionButton);
			if (!found) throw new Error("no trading action button");
			return found.props as unknown as ButtonProps;
		},
	};
}

function mountButton() {
	let props: ButtonProps;
	const render = mountHooks(() => TradingActionButton(props) as Node);
	return {
		render(next: ButtonProps) {
			props = next;
			return find(render(), (node) => typeof node.props.onClick === "function") as Node;
		},
	};
}

async function flush() {
	for (let i = 0; i < 5; i++) await Promise.resolve();
}

let untrack: () => void;

beforeEach(() => {
	net.store = createHyperliquidStore(createHyperliquidConfig());
	untrack = trackCollateralReceipts(net.store);
	net.agentReady = false;
	net.plans = [];
});

afterEach(() => untrack());

describe("a swap queued behind Enable Trading", () => {
	it("does not run when the collateral gate is pending once trading is enabled", async () => {
		loadUnified("100.0");
		const swap = mountSwap();
		swap.setAmount("50");
		const button = mountButton();
		expect(swap.button().disabled).toBe(false);

		(button.render(swap.button()).props.onClick as () => void)();
		bumpCollateralGeneration();
		expect(swap.button().disabled).toBe(true);

		net.agentReady = true;
		button.render(swap.button());
		await flush();
		expect(net.plans).toHaveLength(0);
	});

	it("runs the swap as it stands when trading is enabled, not as it was clicked", async () => {
		loadUnified("100.0");
		const swap = mountSwap();
		swap.setAmount("50");
		const button = mountButton();

		(button.render(swap.button()).props.onClick as () => void)();
		swap.setAmount("10");
		bumpCollateralGeneration();
		loadUnified("40.0");
		expect(swap.button().disabled).toBe(false);

		net.agentReady = true;
		button.render(swap.button());
		await flush();
		expect(net.plans).toHaveLength(1);
		expect(net.plans[0]).toMatchObject({ orders: [{ s: "0.1" }] });
	});
});
