import { create } from "zustand";
import type { AccountMode, Seen } from "@/domain/trade/account-mode";

interface CollateralGenerationStore {
	generation: number;
}

const useCollateralGenerationStore = create<CollateralGenerationStore>(() => ({ generation: 0 }));

const seenAt = new WeakMap<object, Seen>();

export function useCollateralGeneration() {
	return useCollateralGenerationStore((s) => s.generation);
}

export function bumpCollateralGeneration() {
	useCollateralGenerationStore.setState((s) => ({ generation: s.generation + 1 }));
}

export function firstSeen(snapshot: object, generation: number, mode: AccountMode | null): Seen {
	const seen = seenAt.get(snapshot);
	if (seen) return seen;
	const stamp = { generation, mode };
	seenAt.set(snapshot, stamp);
	return stamp;
}
