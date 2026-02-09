export const WS_RELIABILITY_LIMITS = {
	reconnect: {
		baseDelayMs: 250,
		maxDelayMs: 5_000,
		maxAttemptsBeforeCooldown: 20,
		cooldownMs: 30_000,
	},
	subscriptions: {
		maxTrackedKeys: 800,
	},
	payload: {
		defaultMaxBytes: 256 * 1024,
		perMethodMaxBytes: {
			l2Book: 1024 * 1024,
			allMids: 512 * 1024,
			allDexsAssetCtxs: 512 * 1024,
			assetCtxs: 512 * 1024,
			trades: 384 * 1024,
		},
	},
	cache: {
		maxChartLastBarEntries: 256,
	},
} as const;

export function getReconnectDelayMs(attempt: number): number {
	const exponent = Math.max(0, attempt - 1);
	const baseDelay = Math.min(
		WS_RELIABILITY_LIMITS.reconnect.baseDelayMs * 2 ** exponent,
		WS_RELIABILITY_LIMITS.reconnect.maxDelayMs,
	);
	const jitter = baseDelay * 0.2 * Math.random();
	return Math.round(baseDelay + jitter);
}

export function getPayloadLimitBytesForSubscriptionKey(key: string): number {
	try {
		const parsed = JSON.parse(key) as unknown;
		if (!Array.isArray(parsed)) {
			return WS_RELIABILITY_LIMITS.payload.defaultMaxBytes;
		}

		const method = parsed[2];
		if (typeof method !== "string") {
			return WS_RELIABILITY_LIMITS.payload.defaultMaxBytes;
		}

		return (
			WS_RELIABILITY_LIMITS.payload.perMethodMaxBytes[
				method as keyof typeof WS_RELIABILITY_LIMITS.payload.perMethodMaxBytes
			] ?? WS_RELIABILITY_LIMITS.payload.defaultMaxBytes
		);
	} catch {
		return WS_RELIABILITY_LIMITS.payload.defaultMaxBytes;
	}
}
