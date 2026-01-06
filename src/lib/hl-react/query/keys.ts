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

const HEX_REGEX = /^0x[0-9a-f]+$/i;

function stableSubscriptionValue(value: unknown): unknown {
	if (typeof value === "string" && HEX_REGEX.test(value)) {
		return value.toLowerCase();
	}
	if (Array.isArray(value)) {
		return value.map(stableSubscriptionValue);
	}
	if (value && typeof value === "object") {
		const entries = Object.entries(value as Record<string, unknown>)
			.filter(([, v]) => v !== undefined)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([k, v]) => [k, stableSubscriptionValue(v)]);
		return Object.fromEntries(entries);
	}
	return value;
}

export function createKey(scope: string, method: string, params?: unknown) {
	return ["hl", scope, method, stableValue(params ?? {})] as const;
}

export const infoKeys = {
	method: <TParams>(method: string, params?: TParams) => createKey("info", method, params),
};

export const exchangeKeys = {
	method: <TParams>(method: string, params?: TParams) => createKey("exchange", method, params),
};

export const subscriptionKeys = {
	method: <TParams>(method: string, params?: TParams) =>
		["hl", "subscription", method, stableSubscriptionValue(params ?? {})] as const,
};

export const statusKeys = {
	http: () => ["hl", "status", "http"] as const,
};

export function serializeKey(key: readonly unknown[]): string {
	return JSON.stringify(key);
}
