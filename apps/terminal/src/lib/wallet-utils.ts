import { t } from "@lingui/core/macro";
import { FlaskIcon, WalletIcon } from "@phosphor-icons/react";
import type { Address } from "viem";
import type {} from "viem/window";
import type { Connector } from "wagmi";
import { RECENT_WALLETS_LIMIT, STORAGE_KEYS } from "@/config/app";
import { WALLET_INFO, type WalletInfo } from "@/config/wallets";

export type { WalletInfo } from "@/config/wallets";

export interface MockWalletConfig {
	name: string;
	address: Address;
	icon?: React.ComponentType<{ className?: string }>;
}

const DEFAULT_WALLET_INFO: WalletInfo = {
	icon: WalletIcon,
	description: "Connect using this wallet",
	popular: false,
	priority: 99,
};

const mockWalletRegistry = new Map<string, MockWalletConfig>();

export function registerMockWallet(config: MockWalletConfig): void {
	mockWalletRegistry.set(config.name, config);
}

export function isMockConnector(connector: Connector): boolean {
	return connector.id === "mock" || connector.type === "mock";
}

export function isWalletConnectConnector(connector: Connector): boolean {
	return connector.id === "walletConnect" || connector.type === "walletConnect";
}

function getMockWalletInfo(connector: Connector): WalletInfo {
	const config = mockWalletRegistry.get(connector.name);
	const address = config?.address;
	return {
		icon: FlaskIcon,
		description: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Mock wallet for testing",
		popular: false,
		priority: 0,
	};
}

export function getWalletInfo(connector: Connector): WalletInfo {
	if (isMockConnector(connector)) {
		return getMockWalletInfo(connector);
	}
	const info = WALLET_INFO[connector.id] || WALLET_INFO[connector.name];
	if (info) return info;
	return DEFAULT_WALLET_INFO;
}

export function getRecentWallets(): string[] {
	if (typeof window === "undefined") return [];
	const raw = localStorage.getItem(STORAGE_KEYS.RECENT_WALLETS);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((id): id is string => typeof id === "string").slice(0, RECENT_WALLETS_LIMIT);
	} catch {
		return [];
	}
}

export function addRecentWallet(connectorId: string): void {
	if (typeof window === "undefined") return;
	const existing = getRecentWallets().filter((id) => id !== connectorId);
	const next = [connectorId, ...existing].slice(0, RECENT_WALLETS_LIMIT);
	localStorage.setItem(STORAGE_KEYS.RECENT_WALLETS, JSON.stringify(next));
}

export function splitWalletConnectors(connectors: readonly Connector[]): {
	mockConnectors: Connector[];
	regularConnectors: Connector[];
} {
	const mockConnectors: Connector[] = [];
	const regularConnectors: Connector[] = [];
	for (const connector of connectors) {
		if (isMockConnector(connector)) mockConnectors.push(connector);
		else regularConnectors.push(connector);
	}
	return { mockConnectors, regularConnectors };
}

export function sortWalletConnectors(connectors: readonly Connector[], recentWallets: readonly string[]): Connector[] {
	function recentRank(connectorId: string) {
		const index = recentWallets.indexOf(connectorId);
		return index === -1 ? Number.POSITIVE_INFINITY : index;
	}

	return [...connectors].sort((a, b) => {
		const rankA = recentRank(a.id);
		const rankB = recentRank(b.id);
		if (rankA !== rankB) return rankA - rankB;
		const priorityA = getWalletInfo(a).priority ?? 50;
		const priorityB = getWalletInfo(b).priority ?? 50;
		if (priorityA !== priorityB) return priorityA - priorityB;
		return a.name.localeCompare(b.name);
	});
}

function hasInjectedProvider(): boolean {
	return typeof window !== "undefined" && window.ethereum != null;
}

export function getWalletConnectorGroups(connectors: readonly Connector[], recentWallets: readonly string[]) {
	const { mockConnectors, regularConnectors } = splitWalletConnectors(connectors);
	const availableConnectors = regularConnectors.filter(
		(connector) => connector.id !== "injected" || hasInjectedProvider(),
	);
	return {
		mockConnectors,
		popular: sortWalletConnectors(
			availableConnectors.filter((connector) => getWalletInfo(connector).popular),
			recentWallets,
		),
		other: sortWalletConnectors(
			availableConnectors.filter((connector) => !getWalletInfo(connector).popular),
			recentWallets,
		),
	};
}

export function getWalletConnectErrorMessage(error: Error): string {
	let current: unknown = error;
	while (current instanceof Error) {
		if (current.name === "ProviderNotFoundError") {
			return t`No browser wallet found. Use WalletConnect or open this page in your wallet app's browser.`;
		}
		if (current.name === "UserRejectedRequestError" || (current as { code?: unknown }).code === 4001) {
			return t`Connection request was rejected in your wallet.`;
		}
		current = current.cause;
	}
	return "shortMessage" in error && typeof error.shortMessage === "string" ? error.shortMessage : error.message;
}

type ConnectorMessage = { type?: string; data?: unknown };
type ConnectorMessageHandler = (message: ConnectorMessage) => void;
type ConnectorEmitter = {
	on(eventName: "message", handler: ConnectorMessageHandler): void;
	off(eventName: "message", handler: ConnectorMessageHandler): void;
};

export function subscribeWalletConnectUri(connector: Connector, onUri: (uri: string) => void): () => void {
	if (!isWalletConnectConnector(connector)) return () => {};
	const emitter = (connector as Connector & { emitter?: ConnectorEmitter }).emitter;
	if (!emitter) return () => {};

	function handleMessage(message: ConnectorMessage) {
		if (message.type === "display_uri" && typeof message.data === "string") {
			onUri(message.data);
		}
	}

	emitter.on("message", handleMessage);
	return () => emitter.off("message", handleMessage);
}
