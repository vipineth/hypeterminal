import { serializeKey, subscriptionKeys } from "@hypeterminal/hl-react";
import type { HyperliquidStore } from "@hypeterminal/hl-react/store";
import type { WebData3WsEvent } from "@nktkas/hyperliquid";
import { create } from "zustand";
import { parseAccountMode } from "@/domain/trade/account-mode";

interface CollateralGenerationStore {
	generation: number;
}

const useCollateralGenerationStore = create<CollateralGenerationStore>(() => ({ generation: 0 }));

const receivedAt = new WeakMap<object, number>();

const WEB_DATA3_KEY_PREFIX = serializeKey(subscriptionKeys.method("webData3")).slice(0, -"{}]".length);

export function useCollateralGeneration() {
	return useCollateralGenerationStore((s) => s.generation);
}

export function getCollateralGeneration() {
	return useCollateralGenerationStore.getState().generation;
}

export function bumpCollateralGeneration() {
	useCollateralGenerationStore.setState((s) => ({ generation: s.generation + 1 }));
}

export function isCurrentSnapshot(snapshot: unknown, generation: number): boolean {
	return typeof snapshot === "object" && snapshot !== null && receivedAt.get(snapshot) === generation;
}

function accountModeOf(key: string, data: object): string | null {
	if (!key.startsWith(WEB_DATA3_KEY_PREFIX)) return null;
	const { abstraction, dexAbstractionEnabled } = (data as WebData3WsEvent).userState;
	return JSON.stringify(parseAccountMode(abstraction, dexAbstractionEnabled));
}

export function trackCollateralReceipts(store: HyperliquidStore): () => void {
	const modes = new Map<string, string>();
	return store.subscribe((state, previous) => {
		if (state.subscriptions === previous.subscriptions) return;
		for (const key of modes.keys()) {
			if (!state.subscriptions[key]) {
				modes.delete(key);
				bumpCollateralGeneration();
			}
		}
		for (const [key, entry] of Object.entries(state.subscriptions)) {
			const { data } = entry;
			if (typeof data !== "object" || data === null || data === previous.subscriptions[key]?.data) continue;
			const mode = accountModeOf(key, data);
			if (mode !== null && modes.get(key) !== mode) {
				modes.set(key, mode);
				bumpCollateralGeneration();
			}
			receivedAt.set(data, getCollateralGeneration());
		}
	});
}
