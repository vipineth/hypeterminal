type Bar = {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
};

type SymbolInfo = {
	name: string;
	ticker: string;
	description: string;
	type: string;
	session: string;
	timezone: string;
	exchange: string;
	minmov: number;
	pricescale: number;
	has_intraday: boolean;
	has_daily: boolean;
	has_weekly_and_monthly: boolean;
	supported_resolutions: string[];
	volume_precision: number;
	data_status: string;
};

type LibrarySymbolInfo = SymbolInfo & {
	full_name: string;
	listed_exchange: string;
	format: string;
};

type SubscriberCallback = (bar: Bar) => void;

const supportedResolutions = ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"];

const symbolsData: Record<string, SymbolInfo> = {
	"AAVE/USDC": {
		name: "AAVE/USDC",
		ticker: "AAVE/USDC",
		description: "Aave / USD Coin",
		type: "crypto",
		session: "24x7",
		timezone: "Etc/UTC",
		exchange: "HyperTerminal",
		minmov: 1,
		pricescale: 100,
		has_intraday: true,
		has_daily: true,
		has_weekly_and_monthly: true,
		supported_resolutions: supportedResolutions,
		volume_precision: 2,
		data_status: "streaming",
	},
	"BTC/USDC": {
		name: "BTC/USDC",
		ticker: "BTC/USDC",
		description: "Bitcoin / USD Coin",
		type: "crypto",
		session: "24x7",
		timezone: "Etc/UTC",
		exchange: "HyperTerminal",
		minmov: 1,
		pricescale: 100,
		has_intraday: true,
		has_daily: true,
		has_weekly_and_monthly: true,
		supported_resolutions: supportedResolutions,
		volume_precision: 2,
		data_status: "streaming",
	},
	"ETH/USDC": {
		name: "ETH/USDC",
		ticker: "ETH/USDC",
		description: "Ethereum / USD Coin",
		type: "crypto",
		session: "24x7",
		timezone: "Etc/UTC",
		exchange: "HyperTerminal",
		minmov: 1,
		pricescale: 100,
		has_intraday: true,
		has_daily: true,
		has_weekly_and_monthly: true,
		supported_resolutions: supportedResolutions,
		volume_precision: 2,
		data_status: "streaming",
	},
	"SOL/USDC": {
		name: "SOL/USDC",
		ticker: "SOL/USDC",
		description: "Solana / USD Coin",
		type: "crypto",
		session: "24x7",
		timezone: "Etc/UTC",
		exchange: "HyperTerminal",
		minmov: 1,
		pricescale: 100,
		has_intraday: true,
		has_daily: true,
		has_weekly_and_monthly: true,
		supported_resolutions: supportedResolutions,
		volume_precision: 2,
		data_status: "streaming",
	},
};

const basePrices: Record<string, number> = {
	"AAVE/USDC": 102.45,
	"BTC/USDC": 43521.3,
	"ETH/USDC": 2341.8,
	"SOL/USDC": 98.72,
};

function getResolutionMs(resolution: string): number {
	switch (resolution) {
		case "1":
			return 60 * 1000;
		case "5":
			return 5 * 60 * 1000;
		case "15":
			return 15 * 60 * 1000;
		case "30":
			return 30 * 60 * 1000;
		case "60":
			return 60 * 60 * 1000;
		case "240":
			return 4 * 60 * 60 * 1000;
		case "1D":
			return 24 * 60 * 60 * 1000;
		case "1W":
			return 7 * 24 * 60 * 60 * 1000;
		case "1M":
			return 30 * 24 * 60 * 60 * 1000;
		default:
			return 60 * 1000;
	}
}

const lastBarCache: Map<string, Bar> = new Map();

function generateHistoricalBars(
	symbol: string,
	resolution: string,
	from: number,
	to: number,
): Bar[] {
	const bars: Bar[] = [];
	const basePrice = basePrices[symbol] || 100;
	const resolutionMs = getResolutionMs(resolution);

	const fromMs = from * 1000;
	const now = Date.now();
	const currentBarTime = Math.floor(now / resolutionMs) * resolutionMs;
	const toMs = Math.min(to * 1000, currentBarTime);
	
	let currentTime = Math.floor(fromMs / resolutionMs) * resolutionMs;
	let lastClose = basePrice * (0.7 + Math.random() * 0.2);

	while (currentTime <= toMs) {
		const volatility = 0.015;
		const longTrend = Math.sin(currentTime / (7 * 24 * 60 * 60 * 1000)) * 0.005;
		const shortTrend = Math.sin(currentTime / (4 * 60 * 60 * 1000)) * 0.003;
		const change = (Math.random() - 0.5) * 2 * volatility + longTrend + shortTrend;

		const open = lastClose;
		const close = open * (1 + change);
		const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
		const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
		const volume = Math.random() * 800000 + 200000;

		const bar: Bar = {
			time: currentTime,
			open: Number(open.toFixed(2)),
			high: Number(high.toFixed(2)),
			low: Number(low.toFixed(2)),
			close: Number(close.toFixed(2)),
			volume: Number(volume.toFixed(2)),
		};
		
		bars.push(bar);
		lastClose = close;
		currentTime += resolutionMs;
	}

	if (bars.length > 0) {
		const cacheKey = `${symbol}_${resolution}`;
		lastBarCache.set(cacheKey, bars[bars.length - 1]);
	}

	return bars;
}

const subscribers: Map<string, { callback: SubscriberCallback; interval: ReturnType<typeof setInterval> }> = new Map();

export function createDatafeed() {
	return {
		onReady: (callback: (config: object) => void) => {
			setTimeout(() => {
				callback({
					supports_search: true,
					supports_group_request: false,
					supports_marks: false,
					supports_timescale_marks: false,
					supports_time: true,
					exchanges: [{ value: "HyperTerminal", name: "HyperTerminal", desc: "HyperTerminal Exchange" }],
					symbols_types: [{ name: "crypto", value: "crypto" }],
					supported_resolutions: supportedResolutions,
				});
			}, 0);
		},

		searchSymbols: (
			userInput: string,
			_exchange: string,
			_symbolType: string,
			onResult: (symbols: object[]) => void,
		) => {
			const results = Object.keys(symbolsData)
				.filter((symbol) => symbol.toLowerCase().includes(userInput.toLowerCase()))
				.map((symbol) => ({
					symbol: symbol,
					full_name: symbol,
					description: symbolsData[symbol].description,
					exchange: "HyperTerminal",
					type: "crypto",
				}));
			onResult(results);
		},

		resolveSymbol: (
			symbolName: string,
			onResolve: (symbolInfo: LibrarySymbolInfo) => void,
			onError: (error: string) => void,
		) => {
			const symbolInfo = symbolsData[symbolName];
			if (symbolInfo) {
				setTimeout(() => {
					onResolve({
						...symbolInfo,
						full_name: symbolName,
						listed_exchange: "HyperTerminal",
						format: "price",
					});
				}, 0);
			} else {
				onError("Symbol not found");
			}
		},

		getBars: (
			symbolInfo: LibrarySymbolInfo,
			resolution: string,
			periodParams: { from: number; to: number; firstDataRequest: boolean },
			onResult: (bars: Bar[], meta: { noData: boolean }) => void,
			onError: (error: string) => void,
		) => {
			try {
				const bars = generateHistoricalBars(
					symbolInfo.name,
					resolution,
					periodParams.from,
					periodParams.to,
				);
				onResult(bars, { noData: bars.length === 0 });
			} catch (error) {
				onError(String(error));
			}
		},

		subscribeBars: (
			symbolInfo: LibrarySymbolInfo,
			resolution: string,
			onTick: SubscriberCallback,
			listenerGuid: string,
		) => {
			const resolutionMs = getResolutionMs(resolution);
			const cacheKey = `${symbolInfo.name}_${resolution}`;
			const cachedBar = lastBarCache.get(cacheKey);
			
			const now = Date.now();
			const currentBarTime = Math.floor(now / resolutionMs) * resolutionMs;
			
			let lastBar: Bar = cachedBar && cachedBar.time === currentBarTime
				? { ...cachedBar }
				: {
					time: currentBarTime,
					open: cachedBar?.close ?? basePrices[symbolInfo.name] ?? 100,
					high: cachedBar?.close ?? basePrices[symbolInfo.name] ?? 100,
					low: cachedBar?.close ?? basePrices[symbolInfo.name] ?? 100,
					close: cachedBar?.close ?? basePrices[symbolInfo.name] ?? 100,
					volume: Math.random() * 50000,
				};

			const interval = setInterval(() => {
				const currentTime = Date.now();
				const newBarTime = Math.floor(currentTime / resolutionMs) * resolutionMs;

				if (newBarTime > lastBar.time) {
					lastBar = {
						time: newBarTime,
						open: lastBar.close,
						high: lastBar.close,
						low: lastBar.close,
						close: lastBar.close,
						volume: 0,
					};
				}

				const volatility = 0.0006;
				const trend = Math.sin(currentTime / 20000) * 0.0001;
				const change = (Math.random() - 0.5) * 2 * volatility + trend;
				const newClose = lastBar.close * (1 + change);
				const tradeVolume = Math.random() * 3000 + 200;

				lastBar = {
					...lastBar,
					high: Math.max(lastBar.high, newClose),
					low: Math.min(lastBar.low, newClose),
					close: Number(newClose.toFixed(2)),
					volume: Number((lastBar.volume + tradeVolume).toFixed(2)),
				};

				lastBarCache.set(cacheKey, lastBar);
				onTick(lastBar);
			}, 500);

			subscribers.set(listenerGuid, { callback: onTick, interval });
		},

		unsubscribeBars: (listenerGuid: string) => {
			const subscriber = subscribers.get(listenerGuid);
			if (subscriber) {
				clearInterval(subscriber.interval);
				subscribers.delete(listenerGuid);
			}
		},

		getServerTime: (callback: (time: number) => void) => {
			callback(Math.floor(Date.now() / 1000));
		},
	};
}

