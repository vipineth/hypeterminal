import { useRef, useSyncExternalStore } from "react";
import { RingBuffer, type RingBufferOptions } from "./ring-buffer";

type RingBufferStore<T> = {
	getSnapshot: () => T[];
	subscribe: (callback: () => void) => () => void;
	add: (items: T[]) => void;
	clear: () => void;
};

function createRingBufferStore<T>(options: RingBufferOptions<T>): RingBufferStore<T> {
	const buffer = new RingBuffer(options);
	const listeners = new Set<() => void>();
	let snapshot = buffer.getItems();

	const notify = () => {
		snapshot = buffer.getItems();
		for (const listener of listeners) {
			listener();
		}
	};

	return {
		getSnapshot: () => snapshot,
		subscribe: (callback) => {
			listeners.add(callback);
			return () => listeners.delete(callback);
		},
		add: (items) => {
			const changed = buffer.add(items);
			if (changed) notify();
		},
		clear: () => {
			buffer.clear();
			notify();
		},
	};
}

export function useRingBuffer<T>(options: RingBufferOptions<T>) {
	const storeRef = useRef<RingBufferStore<T> | null>(null);

	if (!storeRef.current) {
		storeRef.current = createRingBufferStore(options);
	}

	const store = storeRef.current;
	const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

	return {
		items,
		add: store.add,
		clear: store.clear,
	};
}
