import { t } from "@lingui/core/macro";
import type { AllMidsResponse, MetaResponse } from "@nktkas/hyperliquid";
import { candleSnapshotToBar, filterAndSortBars } from "@/lib/chart/candle";
import { resolutionToInterval } from "@/lib/chart/resolution";
import { getCandleStore, streamKey } from "@/lib/chart/store";
import { coinFromSymbolName, inferPriceScaleFromMids, symbolFromCoin } from "@/lib/chart/symbol";
import { getDexFromName, getInfoClient, getMarketKindFromName } from "@/lib/hyperliquid";
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
	ServerTimeCallback,
	SubscribeBarsCallback,
} from "@/types/charting_library";
import {
	ALL_MIDS_TTL_MS,
	CHART_DATAFEED_CONFIG,
	DEFAULT_PRICESCALE,
	EXCHANGE,
	SESSION_24X7,
	SUPPORTED_RESOLUTIONS,
	TIMEZONE,
} from "./constants";

let metaCache: { value: MetaResponse; fetchedAt: number } | undefined;
let metaPromise: Promise<MetaResponse> | undefined;

async function getMeta(): Promise<MetaResponse> {
	if (metaCache) return metaCache.value;
	if (metaPromise) return metaPromise;

	metaPromise = getInfoClient()
		.meta()
		.then((meta) => {
			metaCache = { value: meta, fetchedAt: Date.now() };
			return meta;
		})
		.finally(() => {
			metaPromise = undefined;
		});

	return metaPromise;
}

const allMidsCache = new Map<string, { value: AllMidsResponse; fetchedAt: number }>();
const allMidsPromise = new Map<string, Promise<AllMidsResponse>>();

async function getAllMids(dex?: string): Promise<AllMidsResponse> {
	const cacheKey = dex ?? "";
	const now = Date.now();
	const cached = allMidsCache.get(cacheKey);
	if (cached && now - cached.fetchedAt < ALL_MIDS_TTL_MS) return cached.value;

	const pending = allMidsPromise.get(cacheKey);
	if (pending) return pending;

	const request = getInfoClient()
		.allMids(dex ? { dex } : undefined)
		.then((mids) => {
			allMidsCache.set(cacheKey, { value: mids, fetchedAt: Date.now() });
			return mids;
		})
		.finally(() => {
			allMidsPromise.delete(cacheKey);
		});

	allMidsPromise.set(cacheKey, request);
	return request;
}

async function isKnownCoin(coin: string): Promise<boolean> {
	// Spot (@id) and HIP-3 builder (dex:coin) names are self-identifying; only perp needs a meta lookup.
	if (getMarketKindFromName(coin) !== "perp") return true;

	try {
		const meta = await getMeta();
		return meta.universe.some((asset) => asset.name === coin && !(asset.isDelisted ?? false));
	} catch {
		return true;
	}
}

async function inferPriceScale(coin: string): Promise<number> {
	try {
		const mids = await getAllMids(getDexFromName(coin));
		return inferPriceScaleFromMids(coin, mids);
	} catch {
		return DEFAULT_PRICESCALE;
	}
}

function cacheKey(symbol: LibrarySymbolInfo, resolution: ResolutionString): string {
	return `${symbol.ticker ?? symbol.name}:${resolution as string}`;
}

function isSameBar(a: Bar | undefined, b: Bar | undefined): boolean {
	if (!a || !b) return false;
	return (
		a.time === b.time &&
		a.open === b.open &&
		a.high === b.high &&
		a.low === b.low &&
		a.close === b.close &&
		a.volume === b.volume
	);
}

const configuration: DatafeedConfiguration = {
	exchanges: [{ value: EXCHANGE, name: EXCHANGE, desc: EXCHANGE }],
	supported_resolutions: SUPPORTED_RESOLUTIONS,
	supports_marks: false,
	supports_time: true,
	supports_timescale_marks: false,
};

export function createDatafeed(): IBasicDataFeed {
	const store = getCandleStore();
	const listenerToStream = new Map<string, string>();

	return {
		onReady: (callback: OnReadyCallback) => {
			setTimeout(() => callback(configuration), 0);
		},

		searchSymbols: () => {},

		resolveSymbol: (symbolName: string, onResolve: ResolveCallback, onError: DatafeedErrorCallback, extension) => {
			void extension;

			void (async () => {
				const coin = coinFromSymbolName(symbolName);
				const displayName = symbolFromCoin(coin);

				if (!(await isKnownCoin(coin))) {
					onError(t`Unknown symbol: ${symbolName}`);
					return;
				}

				const pricescale = await inferPriceScale(coin);

				const symbolInfo: LibrarySymbolInfo = {
					name: displayName,
					ticker: coin,
					description: displayName,
					type: CHART_DATAFEED_CONFIG.SYMBOL_TYPE,
					session: SESSION_24X7,
					timezone: TIMEZONE,
					exchange: EXCHANGE,
					listed_exchange: EXCHANGE,
					format: CHART_DATAFEED_CONFIG.FORMAT,
					pricescale,
					minmov: CHART_DATAFEED_CONFIG.MIN_MOVEMENT,
					has_intraday: true,
					supported_resolutions: SUPPORTED_RESOLUTIONS,
					volume_precision: CHART_DATAFEED_CONFIG.VOLUME_PRECISION,
					data_status: CHART_DATAFEED_CONFIG.DATA_STATUS,
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
					onError(t`Unsupported resolution: ${String(resolution)}`);
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

				const bars = filterAndSortBars(candles.map(candleSnapshotToBar), fromMs, toMs);

				if (bars.length === 0) {
					onResult([], { noData: true });
					return;
				}

				const key = cacheKey(symbolInfo, resolution);
				const lastBar = bars[bars.length - 1];
				store.getState().setLastBar(key, lastBar);

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
			if (!interval) return;

			const existingStreamKey = listenerToStream.get(listenerGuid);
			if (existingStreamKey) {
				store.getState().unsubscribe(existingStreamKey, listenerGuid);
			}

			const coin = coinFromSymbolName(symbolInfo.ticker ?? symbolInfo.name);
			const symbolCacheKey = cacheKey(symbolInfo, resolution);
			const key = streamKey(coin, interval);

			listenerToStream.set(listenerGuid, key);

			const wrappedOnTick = (bar: Bar) => {
				store.getState().setLastBar(symbolCacheKey, bar);
				onTick(bar);
			};

			store.getState().subscribe(key, coin, interval, listenerGuid, wrappedOnTick, onResetCacheNeededCallback);

			const cached = store.getState().getLastBar(symbolCacheKey);
			const streamLastBar = store.getState().streams[key]?.lastBar;
			if (cached && !isSameBar(cached, streamLastBar)) {
				onTick(cached);
			}
		},

		unsubscribeBars: (listenerGuid: string) => {
			const key = listenerToStream.get(listenerGuid);
			if (key) {
				store.getState().unsubscribe(key, listenerGuid);
				listenerToStream.delete(listenerGuid);
			}
		},

		getServerTime: (callback: ServerTimeCallback) => {
			callback(Math.floor(Date.now() / 1000));
		},
	};
}
