export const WS_RELIABILITY_LIMITS = {
	reconnect: {
		baseDelayMs: 250,
		maxDelayMs: 5_000,
		maxAttemptsBeforeCooldown: 20,
		cooldownMs: 30_000,
	},
	sdkReconnect: {
		// The SDK's ReconnectingWebSocket handles its own backoff once the
		// store triggers a reconnect. These constants are the single source of
		// truth for that inner loop — imported by clients.ts and the test.
		baseDelayMs: 500,
		maxDelayMs: 30_000,
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
	staleness: {
		checkIntervalMs: 5_000,
		defaultThresholdMs: 30_000,
		perMethodThresholdMs: {
			l2Book: 20_000,
			trades: 20_000,
			allMids: 20_000,
			candle: 20_000,
			activeAssetCtx: 20_000,
			activeAssetData: 20_000,
			allDexsAssetCtxs: 20_000,
			spotAssetCtxs: 20_000,
			assetCtxs: 20_000,
			orderUpdates: 60_000,
			webData2: 60_000,
			webData3: 60_000,
			allDexsClearinghouseState: 60_000,
		},
	},
} as const;

const USER_STREAM_METHODS = new Set(["orderUpdates", "webData2", "webData3", "allDexsClearinghouseState"]);

// Union of methods we explicitly classify. Anything outside this list falls
// through to "market stream" behavior (pause-and-buffer on hidden). We emit a
// one-shot dev warning so new SDK methods don't silently land on that path.
const KNOWN_METHODS = new Set<string>([
	...USER_STREAM_METHODS,
	...Object.keys(WS_RELIABILITY_LIMITS.staleness.perMethodThresholdMs),
]);
const warnedUnknownMethods = new Set<string>();

// Subscription keys are stringified JSON arrays. `useSub` passes the same key
// to multiple helpers per render; cache the parse so we parse each key once.
// The store calls `forgetParsedKey` from `releaseSubscription` so the cache
// stays bounded by the number of live subscriptions across long sessions.
type ParsedKey = { method: string | undefined; params: unknown } | null;
const parsedKeyCache = new Map<string, ParsedKey>();

function parseKey(key: string): ParsedKey {
	const cached = parsedKeyCache.get(key);
	if (cached !== undefined) return cached;
	let value: ParsedKey = null;
	try {
		const parsed = JSON.parse(key) as unknown;
		if (Array.isArray(parsed)) {
			const method = typeof parsed[2] === "string" ? (parsed[2] as string) : undefined;
			value = { method, params: parsed[3] };
		}
	} catch {
		// leave value as null
	}
	parsedKeyCache.set(key, value);
	return value;
}

export function forgetParsedKey(key: string): void {
	parsedKeyCache.delete(key);
}

export function isUserStreamKey(key: string): boolean {
	const parsed = parseKey(key);
	if (!parsed) return false;
	const params = parsed.params;
	if (params && typeof params === "object" && !Array.isArray(params) && "user" in params) return true;
	if (parsed.method !== undefined) {
		if (USER_STREAM_METHODS.has(parsed.method)) return true;
		if (import.meta.env?.DEV && !KNOWN_METHODS.has(parsed.method) && !warnedUnknownMethods.has(parsed.method)) {
			warnedUnknownMethods.add(parsed.method);
			console.warn(
				`[hl-react] Unknown subscription method "${parsed.method}"; treating as market stream. ` +
					"If this is a user stream, add it to USER_STREAM_METHODS in reliability.ts.",
			);
		}
	}
	return false;
}

export function getReconnectDelayMs(attempt: number): number {
	const exponent = Math.max(0, attempt - 1);
	const baseDelay = Math.min(
		WS_RELIABILITY_LIMITS.reconnect.baseDelayMs * 2 ** exponent,
		WS_RELIABILITY_LIMITS.reconnect.maxDelayMs,
	);
	const jitter = baseDelay * 0.2 * Math.random();
	return Math.round(baseDelay + jitter);
}

// Exponential backoff fed into the SDK's reconnect loop. Declared here so the
// formula has one source of truth across clients.ts and tests.
export function getSdkReconnectionDelayMs(attempt: number): number {
	const { baseDelayMs, maxDelayMs } = WS_RELIABILITY_LIMITS.sdkReconnect;
	return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

export function getStalenessThresholdForKey(key: string): number {
	const parsed = parseKey(key);
	const fallback = WS_RELIABILITY_LIMITS.staleness.defaultThresholdMs;
	if (!parsed || parsed.method === undefined) return fallback;
	const table = WS_RELIABILITY_LIMITS.staleness.perMethodThresholdMs;
	return table[parsed.method as keyof typeof table] ?? fallback;
}

export function getPayloadLimitBytesForSubscriptionKey(key: string): number {
	const parsed = parseKey(key);
	const fallback = WS_RELIABILITY_LIMITS.payload.defaultMaxBytes;
	if (!parsed || parsed.method === undefined) return fallback;
	const table = WS_RELIABILITY_LIMITS.payload.perMethodMaxBytes;
	return table[parsed.method as keyof typeof table] ?? fallback;
}
