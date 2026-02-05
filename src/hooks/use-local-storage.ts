import { type SetStateAction, useState } from "react";
import type { output, ZodType } from "zod/v4";

const IS_SERVER = typeof window === "undefined";

function read<S extends ZodType>(key: string, schema: S, defaultValue: output<S>): output<S> {
	if (IS_SERVER) return defaultValue;
	try {
		const raw = window.localStorage.getItem(key);
		if (raw === null) return defaultValue;
		const result = schema.safeParse(JSON.parse(raw));
		return result.success ? result.data : defaultValue;
	} catch {
		return defaultValue;
	}
}

export function useLocalStorage<S extends ZodType>(
	key: string,
	schema: S,
	defaultValue: output<S>,
	persist = true,
): [output<S>, (action: SetStateAction<output<S>>) => void] {
	const [value, setValue] = useState(() => (persist ? read(key, schema, defaultValue) : defaultValue));

	function set(action: SetStateAction<output<S>>) {
		const current = persist ? read(key, schema, defaultValue) : value;
		const next = action instanceof Function ? action(current) : action;
		if (persist) window.localStorage.setItem(key, JSON.stringify(next));
		setValue(next);
	}

	return [value, set];
}
