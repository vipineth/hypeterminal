import { useMemo } from "react";

function stableValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(stableValue);
	}
	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, v]) => v !== undefined)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => [k, stableValue(v)]);
		return Object.fromEntries(entries);
	}
	return value;
}

export function useStableParams(params: unknown): string {
	return useMemo(() => JSON.stringify(stableValue(params ?? {})), [params]);
}
