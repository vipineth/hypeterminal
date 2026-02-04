import { FlaskIcon, WalletIcon } from "@phosphor-icons/react";
import type { Address } from "viem";
import type { Connector } from "wagmi";
import { CoinbaseIcon } from "@/components/icons/coinbase-icon";
import { MetaMaskIcon } from "@/components/icons/metamask-icon";
import { RabbyIcon } from "@/components/icons/rabby-icon";
import { WalletConnectIcon } from "@/components/icons/walletconnect-icon";

export interface WalletInfo {
	icon: React.ComponentType<{ className?: string }>;
	description: string;
	popular?: boolean;
	priority?: number;
}

export interface MockWalletConfig {
	name: string;
	address: Address;
	icon?: React.ComponentType<{ className?: string }>;
}

export const WALLET_INFO: Record<string, WalletInfo> = {
	"io.rabby": {
		icon: RabbyIcon,
		description: "Multi-chain wallet with pre-sign checks",
		popular: true,
		priority: 1,
	},
	"Rabby Wallet": {
		icon: RabbyIcon,
		description: "Multi-chain wallet with pre-sign checks",
		popular: true,
		priority: 1,
	},
	Rabby: {
		icon: RabbyIcon,
		description: "Multi-chain wallet with pre-sign checks",
		popular: true,
		priority: 1,
	},
	metaMask: {
		icon: MetaMaskIcon,
		description: "The most popular crypto wallet",
		popular: true,
		priority: 2,
	},
	MetaMask: {
		icon: MetaMaskIcon,
		description: "The most popular crypto wallet",
		popular: true,
		priority: 2,
	},
	coinbaseWallet: {
		icon: CoinbaseIcon,
		description: "Easy to use mobile & browser wallet",
		popular: true,
		priority: 3,
	},
	"Coinbase Wallet": {
		icon: CoinbaseIcon,
		description: "Easy to use mobile & browser wallet",
		popular: true,
		priority: 3,
	},
	walletConnect: {
		icon: WalletConnectIcon,
		description: "Scan QR code with your mobile wallet",
		popular: true,
		priority: 4,
	},
	WalletConnect: {
		icon: WalletConnectIcon,
		description: "Scan QR code with your mobile wallet",
		popular: true,
		priority: 4,
	},
	injected: {
		icon: WalletIcon,
		description: "Use your browser's built-in wallet",
		popular: false,
		priority: 10,
	},
	Injected: {
		icon: WalletIcon,
		description: "Use your browser's built-in wallet",
		popular: false,
		priority: 10,
	},
	"Browser Wallet": {
		icon: WalletIcon,
		description: "Use your browser's built-in wallet",
		popular: false,
		priority: 10,
	},
	mock: {
		icon: FlaskIcon,
		description: "Mock wallet for testing",
		popular: false,
		priority: 0,
	},
	Mock: {
		icon: FlaskIcon,
		description: "Mock wallet for testing",
		popular: false,
		priority: 0,
	},
};

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

export function getMockWalletConfig(name: string): MockWalletConfig | undefined {
	return mockWalletRegistry.get(name);
}

export function isMockConnector(connector: Connector): boolean {
	return connector.id === "mock" || connector.type === "mock";
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

const LAST_WALLET_KEY = "hypeterminal:last-wallet";

export function getLastUsedWallet(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(LAST_WALLET_KEY);
}

export function setLastUsedWallet(connectorId: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(LAST_WALLET_KEY, connectorId);
}
