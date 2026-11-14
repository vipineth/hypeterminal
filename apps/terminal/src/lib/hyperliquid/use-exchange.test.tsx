import { serializeKey, subscriptionKeys } from "@hypeterminal/hl-react";
import { createHyperliquidConfig } from "@hypeterminal/hl-react/create-config";
import { createHyperliquidStore, type HyperliquidStore } from "@hypeterminal/hl-react/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type ExchangeMethod, useExchange } from "@/lib/hyperliquid";
import {
	getCollateralGeneration,
	isCurrentSnapshot,
	trackCollateralReceipts,
} from "@/stores/use-collateral-generation-store";

const USER = "0x00000000000000000000000000000000000000a1";

vi.mock("@hypeterminal/hl-react/hooks/useClients", () => {
	const reject = async () => {
		throw new Error("Insufficient balance for withdrawal");
	};
	const client = new Proxy({}, { get: () => reject });
	return { useHyperliquidClients: () => ({ trading: client, user: client }) };
});

vi.mock("@hypeterminal/hl-react/provider", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/hl-react/provider")>()),
	useHyperliquid: () => ({ builderConfig: undefined, clientKey: USER }),
}));

let store: HyperliquidStore;
let untrack: () => void;

beforeEach(() => {
	store = createHyperliquidStore(createHyperliquidConfig());
	untrack = trackCollateralReceipts(store);
});

afterEach(() => untrack());

function receiveSpot(usdc: string) {
	const key = serializeKey(subscriptionKeys.method("spotState", { user: USER }));
	if (!store.getState().subscriptions[key]) store.getState().acquireSubscription(key, () => new Promise(() => {}));
	const snapshot = {
		spotState: { balances: [{ coin: "USDC", token: 0, total: usdc, hold: "0.0", entryNtl: "0.0" }] },
	};
	store.getState().setSubscriptionData(key, snapshot);
	return snapshot;
}

function counts(snapshot: object) {
	return isCurrentSnapshot(snapshot, getCollateralGeneration());
}

interface Props {
	method: ExchangeMethod;
	onMutation: (mutate: (params: unknown) => Promise<unknown>) => void;
}

function Capture({ method, onMutation }: Props) {
	const mutation = useExchange(method);
	onMutation(mutation.mutateAsync as (params: unknown) => Promise<unknown>);
	return null;
}

function mutationFor(method: ExchangeMethod) {
	const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
	let mutate: (params: unknown) => Promise<unknown> = async () => {};
	renderToString(
		<QueryClientProvider client={client}>
			<Capture method={method} onMutation={(next) => (mutate = next)} />
		</QueryClientProvider>,
	);
	return mutate;
}

describe("a rejected collateral spend", () => {
	it.each<ExchangeMethod>(["spotSend", "sendAsset", "withdraw3", "usdClassTransfer", "usdSend"])(
		"stops counting balances received before a rejected %s until the next push",
		async (method) => {
			const before = receiveSpot("100.0");
			expect(counts(before)).toBe(true);

			await expect(mutationFor(method)({ destination: USER, amount: "50" })).rejects.toThrow("Insufficient balance");
			expect(counts(before)).toBe(false);

			expect(counts(receiveSpot("100.0"))).toBe(true);
		},
	);

	it("keeps counting balances when a cancel is rejected", async () => {
		const before = receiveSpot("100.0");

		await expect(mutationFor("cancel")({ cancels: [] })).rejects.toThrow();
		expect(counts(before)).toBe(true);
	});
});
