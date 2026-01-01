import type {
	AllMidsResponse,
	CandleSnapshotParameters,
	CandleSnapshotResponse,
	CandleWsEvent,
	MetaResponse,
	WebSocketSubscription,
} from "@nktkas/hyperliquid";
import { getInfoClient, getSubscriptionClient } from "@/lib/hyperliquid";
import { META_CACHE_TTL_MS, readCachedMeta, writeCachedMeta } from "@/lib/hyperliquid/meta-cache";
import type {
	Bar,
	DatafeedConfiguration,
	DatafeedErrorCallback,
	HistoryCallback,
	IBasicDataFeed,
	LibrarySymbolInfo,
	OnReadyCallback,
	PeriodParams,
	ResolutionString,
	ResolveCallback,
	SearchSymbolResultItem,
	SearchSymbolsCallback,
	ServerTimeCallback,
	SubscribeBarsCallback,
} from "@/types/charting_library";
import {
	ALL_MIDS_TTL_MS,
	DEFAULT_PRICESCALE,
	EXCHANGE,
	QUOTE_ASSET,
	SESSION_24X7,
	SUPPORTED_RESOLUTIONS,
	TIMEZONE,
} from "./constants";

type CandleInterval = CandleSnapshotParameters["interval"];

let metaCache: { value: MetaResponse; fetchedAt: number } | undefined;
let metaPromise: Promise<MetaResponse> | undefined;

async function getMeta(): Promise<MetaResponse> {
	const now = Date.now();
	if (!metaCache) {
		const cached = readCachedMeta();
		if (cached) metaCache = { value: cached.value, fetchedAt: cached.updatedAt };
	}

	if (metaCache && now - metaCache.fetchedAt < META_CACHE_TTL_MS) return metaCache.value;
	if (metaPromise) return metaPromise;

	metaPromise = getInfoClient()
		.meta()
		.then((meta) => {
			metaCache = { value: meta, fetchedAt: Date.now() };
			writeCachedMeta(meta);
			return meta;
		})
		.finally(() => {
			metaPromise = undefined;
		});

	return metaPromise;
}

let allMidsCache: { value: AllMidsResponse; fetchedAt: number } | undefined;
let allMidsPromise: Promise<AllMidsResponse> | undefined;

async function getAllMids(): Promise<AllMidsResponse> {
	const now = Date.now();
	if (allMidsCache && now - allMidsCache.fetchedAt < ALL_MIDS_TTL_MS) return allMidsCache.value;
	if (allMidsPromise) return allMidsPromise;

	allMidsPromise = getInfoClient()
		.allMids()
		.then((mids) => {
			allMidsCache = { value: mids, fetchedAt: Date.now() };
			return mids;
		})
		.finally(() => {
			allMidsPromise = undefined;
		});

	return allMidsPromise;
}

function normalizeSymbolName(symbolName: string): string {
	const trimmed = symbolName.trim();
	const withoutExchange = trimmed.includes(":") ? (trimmed.split(":").pop() ?? trimmed) : trimmed;
	return withoutExchange.trim();
}

function coinFromSymbolName(symbolName: string): string {
	const normalized = normalizeSymbolName(symbolName);
	return normalized.split(/[/-]/)[0] ?? normalized;
}

function symbolFromCoin(coin: string): string {
	return `${coin}/${QUOTE_ASSET}`;
}

function resolutionToInterval(resolution: ResolutionString): CandleInterval | undefined {
	const r = resolution as unknown as string;

	switch (r) {
		case "1":
			return "1m";
		case "3":
			return "3m";
		case "5":
			return "5m";
		case "15":
			return "15m";
		case "30":
			return "30m";
		case "60":
			return "1h";
		case "120":
			return "2h";
		case "240":
			return "4h";
		case "480":
			return "8h";
		case "720":
			return "12h";
		case "D":
		case "1D":
			return "1d";
		case "3D":
			return "3d";
		case "W":
		case "1W":
			return "1w";
		case "M":
		case "1M":
			return "1M";
		default:
			return undefined;
	}
}

function parseDecimal(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

function candleSnapshotToBar(candle: CandleSnapshotResponse[number]): Bar | null {
	const open = parseDecimal(candle.o);
	const high = parseDecimal(candle.h);
	const low = parseDecimal(candle.l);
	const close = parseDecimal(candle.c);
	const volume = parseDecimal(candle.v);

	if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
		return null;
	}

	return {
		time: candle.t,
		open,
		high,
		low,
		close,
		volume: Number.isFinite(volume) ? volume : undefined,
	};
}

function candleEventToBar(event: CandleWsEvent): Bar | null {
	const open = parseDecimal(event.o);
	const high = parseDecimal(event.h);
	const low = parseDecimal(event.l);
	const close = parseDecimal(event.c);
	const volume = parseDecimal(event.v);

	if (!Number.isFinite(open) || !Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close)) {
		return null;
	}

	return {
		time: event.t,
		open,
		high,
		low,
		close,
		volume: Number.isFinite(volume) ? volume : undefined,
	};
}

function inferDecimalPlaces(value: string): number {
	const match = value.match(/\.(\d+)/);
	if (!match) return 0;
	return match[1]?.replace(/0+$/, "").length ?? 0;
}

function priceScaleFromMid(mid: string): number {
	const decimals = inferDecimalPlaces(mid);
	const digits = Math.min(Math.max(decimals, 2), 8);
	return 10 ** digits;
}

async function inferPriceScale(coin: string): Promise<number> {
	try {
		const mids = await getAllMids();
		const mid = mids[coin];
		if (typeof mid === "string" && mid.length > 0) {
			return priceScaleFromMid(mid);
		}
	} catch (error) {
		console.warn("Failed to infer pricescale from allMids:", error);
	}

	return DEFAULT_PRICESCALE;
}

async function isKnownCoin(coin: string): Promise<boolean> {
	try {
		const meta = await getMeta();
		return meta.universe.some((asset) => asset.name === coin && !(asset.isDelisted ?? false));
	} catch {
		return true;
	}
}

async function searchCoins(query: string): Promise<string[]> {
	const meta = await getMeta();
	const q = query.trim().toLowerCase();
	return meta.universe
		.filter((asset) => !(asset.isDelisted ?? false))
		.map((asset) => asset.name)
		.filter((coin) => (q.length === 0 ? true : coin.toLowerCase().includes(q)));
}

function cacheKey(symbol: LibrarySymbolInfo, resolution: ResolutionString): string {
	return `${symbol.ticker ?? symbol.name}:${resolution as unknown as string}`;
}

export function createDatafeed(): IBasicDataFeed {
	const lastBarCache = new Map<string, Bar>();
	const listenerToStreamKey = new Map<string, string>();

	type CandleListener = {
		onTick: SubscribeBarsCallback;
		onResetCacheNeededCallback: () => void;
		symbolCacheKey: string;
	};

	type CandleStream = {
		subscriptionPromise: Promise<WebSocketSubscription>;
		listeners: Map<string, CandleListener>;
		lastBar?: Bar;
	};

	const candleStreams = new Map<string, CandleStream>();

	function streamKeyFor(coin: string, interval: CandleInterval): string {
		return `${coin}:${interval}`;
	}

	function removeListener(listenerGuid: string): void {
		const streamKey = listenerToStreamKey.get(listenerGuid);
		if (!streamKey) return;

		const stream = candleStreams.get(streamKey);
		listenerToStreamKey.delete(listenerGuid);

		if (!stream) return;

		stream.listeners.delete(listenerGuid);

		if (stream.listeners.size === 0) {
			candleStreams.delete(streamKey);
			stream.subscriptionPromise.then((sub) => sub.unsubscribe()).catch(() => {});
		}
	}

	function getOrCreateStream(coin: string, interval: CandleInterval): CandleStream {
		const streamKey = streamKeyFor(coin, interval);
		const existing = candleStreams.get(streamKey);
		if (existing) return existing;

		const stream: CandleStream = {
			subscriptionPromise: Promise.resolve({
				unsubscribe: async () => {},
				failureSignal: new AbortController().signal,
			}),
			listeners: new Map<string, CandleListener>(),
			lastBar: undefined,
		};

		const subscriptionPromise = getSubscriptionClient().candle({ coin, interval }, (event) => {
			const bar = candleEventToBar(event);
			if (!bar) return;

			const current = candleStreams.get(streamKey);
			if (!current) return;

			current.lastBar = bar;

			for (const listener of current.listeners.values()) {
				lastBarCache.set(listener.symbolCacheKey, bar);
				listener.onTick(bar);
			}
		});

		stream.subscriptionPromise = subscriptionPromise;
		candleStreams.set(streamKey, stream);

		subscriptionPromise
			.then((sub) => {
				sub.failureSignal.addEventListener(
					"abort",
					() => {
						const current = candleStreams.get(streamKey);
						if (!current) return;
						console.warn("Candle subscription aborted:", sub.failureSignal.reason);
						for (const listener of current.listeners.values()) {
							listener.onResetCacheNeededCallback();
						}
					},
					{ once: true },
				);
			})
			.catch((error) => {
				const current = candleStreams.get(streamKey);
				if (!current) return;

				console.error("Candle subscription failed:", error);

				for (const [listenerGuid, listener] of current.listeners.entries()) {
					listenerToStreamKey.delete(listenerGuid);
					listener.onResetCacheNeededCallback();
				}

				candleStreams.delete(streamKey);
			});

		return stream;
	}

	const configuration: DatafeedConfiguration = {
		exchanges: [{ value: EXCHANGE, name: EXCHANGE, desc: EXCHANGE }],
		supported_resolutions: SUPPORTED_RESOLUTIONS,
		supports_marks: false,
		supports_time: true,
		supports_timescale_marks: false,
		symbols_types: [{ name: "crypto", value: "crypto" }],
	};

	return {
		onReady: (callback: OnReadyCallback) => {
			setTimeout(() => callback(configuration), 0);
		},

		searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: SearchSymbolsCallback) => {
			void (async () => {
				if (exchange && exchange !== EXCHANGE) {
					onResult([]);
					return;
				}

				if (symbolType && symbolType !== "crypto") {
					onResult([]);
					return;
				}

				let coins: string[] = [];
				try {
					coins = await searchCoins(userInput);
				} catch (error) {
					console.warn("searchSymbols failed:", error);
				}

				const items: SearchSymbolResultItem[] = coins.slice(0, 50).map((coin) => {
					const symbol = symbolFromCoin(coin);
					return {
						symbol,
						ticker: symbol,
						description: `${coin} / ${QUOTE_ASSET}`,
						exchange: EXCHANGE,
						type: "crypto",
					};
				});

				onResult(items);
			})();
		},

		resolveSymbol: (symbolName: string, onResolve: ResolveCallback, onError: DatafeedErrorCallback, extension) => {
			void extension;

			void (async () => {
				const normalized = normalizeSymbolName(symbolName);
				const coin = coinFromSymbolName(normalized);
				const symbol = symbolFromCoin(coin);

				if (!(await isKnownCoin(coin))) {
					onError(`Unknown symbol: ${symbolName}`);
					return;
				}

				const pricescale = await inferPriceScale(coin);

				const symbolInfo: LibrarySymbolInfo = {
					name: symbol,
					ticker: symbol,
					description: `${coin} / ${QUOTE_ASSET}`,
					type: "crypto",
					session: SESSION_24X7,
					timezone: TIMEZONE,
					exchange: EXCHANGE,
					listed_exchange: EXCHANGE,
					format: "price",
					pricescale,
					minmov: 1,
					has_intraday: true,
					supported_resolutions: SUPPORTED_RESOLUTIONS,
					volume_precision: 2,
					data_status: "streaming",
				};

				onResolve(symbolInfo);
			})().catch((error) => {
				onError(error instanceof Error ? error.message : String(error));
			});
		},

		getBars: (
			symbolInfo: LibrarySymbolInfo,
			resolution: ResolutionString,
			periodParams: PeriodParams,
			onResult: HistoryCallback,
			onError: DatafeedErrorCallback,
		) => {
			void (async () => {
				const interval = resolutionToInterval(resolution);
				if (!interval) {
					onError(`Unsupported resolution: ${resolution as unknown as string}`);
					return;
				}

				const coin = coinFromSymbolName(symbolInfo.ticker ?? symbolInfo.name);
				const fromMs = Math.max(0, Math.floor(periodParams.from * 1000));
				const toMs = Math.max(0, Math.floor(periodParams.to * 1000));

				if (toMs <= fromMs) {
					onResult([], { noData: true });
					return;
				}

				const candles = await getInfoClient().candleSnapshot({
					coin,
					interval,
					startTime: fromMs,
					endTime: toMs,
				});

				const bars = candles
					.map(candleSnapshotToBar)
					.filter((bar): bar is Bar => !!bar)
					.filter((bar) => bar.time >= fromMs && bar.time < toMs)
					.sort((a, b) => a.time - b.time);

				if (bars.length === 0) {
					onResult([], { noData: true });
					return;
				}

				const key = cacheKey(symbolInfo, resolution);
				lastBarCache.set(key, bars[bars.length - 1]);

				onResult(bars, { noData: false });
			})().catch((error) => {
				onError(error instanceof Error ? error.message : String(error));
			});
		},

		subscribeBars: (
			symbolInfo: LibrarySymbolInfo,
			resolution: ResolutionString,
			onTick: SubscribeBarsCallback,
			listenerGuid: string,
			onResetCacheNeededCallback: () => void,
		) => {
			const interval = resolutionToInterval(resolution);
			if (!interval) {
				console.warn("subscribeBars unsupported resolution:", resolution);
				return;
			}

			removeListener(listenerGuid);

			const coin = coinFromSymbolName(symbolInfo.ticker ?? symbolInfo.name);
			const symbolCacheKey = cacheKey(symbolInfo, resolution);

			const streamKey = streamKeyFor(coin, interval);
			const stream = getOrCreateStream(coin, interval);

			stream.listeners.set(listenerGuid, { onTick, onResetCacheNeededCallback, symbolCacheKey });
			listenerToStreamKey.set(listenerGuid, streamKey);

			const cached = lastBarCache.get(symbolCacheKey) ?? stream.lastBar;
			if (cached) onTick(cached);
		},

		unsubscribeBars: (listenerGuid: string) => {
			removeListener(listenerGuid);
		},

		getServerTime: (callback: ServerTimeCallback) => {
			callback(Math.floor(Date.now() / 1000));
		},
	};
}
