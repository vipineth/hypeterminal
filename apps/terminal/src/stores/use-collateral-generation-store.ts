import { create } from "zustand";

interface CollateralGenerationStore {
	generation: number;
}

const useCollateralGenerationStore = create<CollateralGenerationStore>(() => ({ generation: 0 }));

export function useCollateralGeneration() {
	return useCollateralGenerationStore((s) => s.generation);
}

export function bumpCollateralGeneration() {
	useCollateralGenerationStore.setState((s) => ({ generation: s.generation + 1 }));
}
