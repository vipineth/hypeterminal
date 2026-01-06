import { Wallet } from "lucide-react";
import type { Connector } from "wagmi";
import { CoinbaseIcon, MetaMaskIcon, RabbyIcon, WalletConnectIcon } from "@/components/icons";

export interface WalletInfo {
	icon: React.ComponentType<{ className?: string }>;
	description: string;
	popular?: boolean;
	priority?: number;
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
		icon: Wallet,
		description: "Use your browser's built-in wallet",
		popular: false,
		priority: 10,
	},
	Injected: {
		icon: Wallet,
		description: "Use your browser's built-in wallet",
		popular: false,
		priority: 10,
	},
	"Browser Wallet": {
		icon: Wallet,
		description: "Use your browser's built-in wallet",
		popular: false,
		priority: 10,
	},
};

const DEFAULT_WALLET_INFO: WalletInfo = {
	icon: Wallet,
	description: "Connect using this wallet",
	popular: false,
	priority: 99,
};

export function getWalletInfo(connector: Connector): WalletInfo {
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
