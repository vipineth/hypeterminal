// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

const TEST_BUILDER_CONFIG = { b: "0x0" as `0x${string}`, f: 0 };

vi.mock("@hypeterminal/hl-react/internal/websocket/chaos", () => ({
	registerChaosHarness: vi.fn(),
}));
vi.mock("@hypeterminal/hl-react/internal/websocket/debug", () => ({
	registerDebugSnapshot: vi.fn(),
	setDebugStore: vi.fn(),
}));
vi.mock("@hypeterminal/hl-react/clients", () => ({
	createWsReconnectTrigger: () => () => {},
	getHttpTransport: () => ({}),
	getInfoClient: () => ({}),
	getSubscriptionClient: () => ({}),
	getWsTransport: () => ({}),
	initializeClients: vi.fn(),
}));
vi.mock("@hypeterminal/hl-react/create-config", () => ({
	createHyperliquidConfig: () => ({
		httpTransport: {},
		wsTransport: {},
		ssr: false,
	}),
}));
vi.mock("@hypeterminal/hl-react/store", async () => {
	const { createStore } = await vi.importActual<typeof import("zustand")>("zustand");
	return {
		createHyperliquidStore: () => createStore(() => ({ config: {} })),
	};
});

describe("HyperliquidProvider userAddress prop", () => {
	it("sets clientKey to 'disconnected' when userAddress is undefined", async () => {
		const { HyperliquidProvider, useHyperliquid } = await import("@hypeterminal/hl-react/provider");

		let capturedKey: string | undefined;
		function Consumer() {
			const ctx = useHyperliquid();
			capturedKey = ctx.clientKey;
			return null;
		}

		const container = document.createElement("div");
		const root = createRoot(container);
		act(() => {
			root.render(
				<HyperliquidProvider env="Testnet" userAddress={undefined} builderConfig={TEST_BUILDER_CONFIG}>
					<Consumer />
				</HyperliquidProvider>,
			);
		});

		expect(capturedKey).toBe("disconnected");
		act(() => root.unmount());
	});

	it("sets clientKey to address when userAddress is provided", async () => {
		const { HyperliquidProvider, useHyperliquid } = await import("@hypeterminal/hl-react/provider");
		const testAddress = "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`;

		let capturedKey: string | undefined;
		function Consumer() {
			const ctx = useHyperliquid();
			capturedKey = ctx.clientKey;
			return null;
		}

		const container = document.createElement("div");
		const root = createRoot(container);
		act(() => {
			root.render(
				<HyperliquidProvider env="Testnet" userAddress={testAddress} builderConfig={TEST_BUILDER_CONFIG}>
					<Consumer />
				</HyperliquidProvider>,
			);
		});

		expect(capturedKey).toBe(testAddress);
		act(() => root.unmount());
	});
});
