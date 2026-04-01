import { useRef, useSyncExternalStore } from "react";
import type { Address, Hex } from "viem";
import { z } from "zod";
import type { AgentWallet, HyperliquidEnv } from "./types";

const privateKeySchema = z
	.string()
	.regex(/^0x[0-9a-fA-F]{64}$/)
	.transform((v) => v.toLowerCase() as Hex);

const publicKeySchema = z
	.string()
	.regex(/^0x[0-9a-fA-F]{40}$/)
	.transform((v) => v.toLowerCase() as Address);

const agentWalletSchema = z.object({
	privateKey: privateKeySchema,
	publicKey: publicKeySchema,
});

function getStorageKey(env: HyperliquidEnv, userAddress: string): string {
	return `hyperliquid_agent_${env}_${userAddress.toLowerCase()}`;
}

export function readAgentFromStorage(env: HyperliquidEnv, userAddress: string): AgentWallet | null {
	if (typeof window === "undefined") return null;

	try {
		const key = getStorageKey(env, userAddress);
		const raw = localStorage.getItem(key);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		return agentWalletSchema.parse(parsed);
	} catch {
		return null;
	}
}

export function writeAgentToStorage(
	env: HyperliquidEnv,
	userAddress: string,
	privateKey: string,
	publicKey: string,
): void {
	if (typeof window === "undefined") return;

	try {
		const key = getStorageKey(env, userAddress);
		const data: AgentWallet = {
			privateKey: privateKeySchema.parse(privateKey),
			publicKey: publicKeySchema.parse(publicKey),
		};
		localStorage.setItem(key, JSON.stringify(data));
		window.dispatchEvent(new StorageEvent("storage", { key }));
	} catch {
		// Silent fail for storage errors
	}
}

export function removeAgentFromStorage(env: HyperliquidEnv, userAddress: string): void {
	if (typeof window === "undefined") return;

	const key = getStorageKey(env, userAddress);
	localStorage.removeItem(key);
	window.dispatchEvent(new StorageEvent("storage", { key }));
}

function subscribeToStorage(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	const handleStorage = () => callback();
	window.addEventListener("storage", handleStorage);
	return () => window.removeEventListener("storage", handleStorage);
}

export function useAgentWalletStorage(env: HyperliquidEnv, userAddress: string | undefined): AgentWallet | null {
	const cacheRef = useRef<{ raw: string | null; parsed: AgentWallet | null }>({ raw: null, parsed: null });

	function getSnapshot(): string | null {
		if (!userAddress) return null;
		const data = readAgentFromStorage(env, userAddress);
		return data ? JSON.stringify(data) : null;
	}

	const raw = useSyncExternalStore(subscribeToStorage, getSnapshot, () => null);

	if (raw !== cacheRef.current.raw) {
		cacheRef.current = { raw, parsed: raw ? (JSON.parse(raw) as AgentWallet) : null };
	}

	return cacheRef.current.parsed;
}

export function useAgentWalletActions() {
	function setAgent(env: HyperliquidEnv, userAddress: string, privateKey: string, publicKey: string) {
		writeAgentToStorage(env, userAddress, privateKey, publicKey);
	}

	function clearAgent(env: HyperliquidEnv, userAddress: string) {
		removeAgentFromStorage(env, userAddress);
	}

	return { setAgent, clearAgent };
}
