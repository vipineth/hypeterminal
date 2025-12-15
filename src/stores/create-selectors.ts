import type { StoreApi, UseBoundStore } from "zustand";

export type WithSelectors<S> = S extends UseBoundStore<StoreApi<infer TState>>
	? S & { use: { [K in keyof TState]: () => TState[K] } }
	: never;

export function createSelectors<TState extends object, S extends UseBoundStore<StoreApi<TState>>>(
	store: S,
): WithSelectors<S> {
	const storeWithSelectors = store as WithSelectors<S>;
	storeWithSelectors.use = {} as WithSelectors<S>["use"];

	for (const key of Object.keys(store.getState()) as Array<keyof TState>) {
		storeWithSelectors.use[key] = () => store((state) => state[key]);
	}

	return storeWithSelectors;
}
