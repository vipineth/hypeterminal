import * as React from "react";

type Effect = () => undefined | (() => void);

interface Internals {
	H: unknown;
}

const internals = (React as unknown as { __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: Internals })
	.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

const MAX_PASSES = 20;

export function mountHooks<T>(render: () => T): () => T {
	const slots: unknown[] = [];
	let index = 0;
	let dirty = false;
	let effects: Effect[] = [];

	const dispatcher = {
		useState<S>(initial: S | (() => S)) {
			const slot = index++;
			if (!(slot in slots)) slots[slot] = typeof initial === "function" ? (initial as () => S)() : initial;
			const setState = (next: S | ((previous: S) => S)) => {
				const value = typeof next === "function" ? (next as (previous: S) => S)(slots[slot] as S) : next;
				if (Object.is(value, slots[slot])) return;
				slots[slot] = value;
				dirty = true;
			};
			return [slots[slot], setState];
		},
		useRef<V>(initial: V) {
			const slot = index++;
			if (!(slot in slots)) slots[slot] = { current: initial };
			return slots[slot];
		},
		useEffect(effect: Effect, deps?: unknown[]) {
			const slot = index++;
			const previous = slots[slot] as unknown[] | undefined;
			if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous[i]))) {
				slots[slot] = deps ?? [];
				effects.push(effect);
			}
		},
		useMemo<V>(compute: () => V) {
			return compute();
		},
		useCallback<F>(callback: F) {
			return callback;
		},
	};

	return () => {
		for (let pass = 0; pass < MAX_PASSES; pass++) {
			index = 0;
			dirty = false;
			effects = [];
			const previous = internals.H;
			internals.H = dispatcher;
			let value: T;
			try {
				value = render();
			} finally {
				internals.H = previous;
			}
			for (const effect of effects) effect();
			if (!dirty) return value;
		}
		throw new Error("hooks kept updating state");
	};
}
