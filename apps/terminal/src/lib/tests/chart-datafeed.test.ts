import { describe, expect, it, vi } from "vitest";
import type { Bar, LibrarySymbolInfo, ResolutionString } from "@/types/charting_library";

const SYMBOL_INFO = {
	name: "ETH/USD",
	ticker: "ETH",
} as LibrarySymbolInfo;

const RESOLUTION = "1" as ResolutionString;

const LISTENER_GUID = "test-listener";

const LIVE_BAR: Bar = { time: 1_000_000, open: 100, high: 110, low: 90, close: 105, volume: 500 };
const DIFFERENT_BAR: Bar = { time: 999_000, open: 95, high: 105, low: 85, close: 100, volume: 300 };

function makeStore(opts: { streamLastBar?: Bar; cachedBar?: Bar; invokeTick?: boolean } = {}) {
	const { streamLastBar, cachedBar, invokeTick = false } = opts;

	const streams: Record<string, { lastBar?: Bar }> = {
		"ETH:1m": streamLastBar ? { lastBar: streamLastBar } : {},
	};

	return {
		getState: () => ({
			streams,
			lastBarCache: {} as Record<string, Bar>,
			subscribe: vi.fn(
				(
					_key: string,
					_coin: string,
					_interval: unknown,
					_listenerId: string,
					onTick: (bar: Bar) => void,
					_onReset: () => void,
				) => {
					if (invokeTick && streamLastBar) {
						onTick(streamLastBar);
					}
				},
			),
			unsubscribe: vi.fn(),
			setLastBar: vi.fn(),
			getLastBar: vi.fn(() => cachedBar),
		}),
	};
}

vi.mock("@/lib/chart/store", () => ({
	getCandleStore: vi.fn(),
	streamKey: (coin: string, interval: string) => `${coin}:${interval}`,
}));

vi.mock("@/lib/hyperliquid", () => ({
	getInfoClient: vi.fn(() => ({})),
}));

vi.mock("@/lib/chart/resolution", () => ({
	resolutionToInterval: vi.fn(() => "1m"),
}));

vi.mock("@/lib/chart/symbol", () => ({
	coinFromSymbolName: vi.fn((name: string) => name),
	inferPriceScaleFromMids: vi.fn(() => 100),
	symbolFromCoin: vi.fn((coin: string) => coin),
}));

describe("datafeed subscribeBars – last-bar replay deduplication", () => {
	it("calls onTick exactly once when stream replay and cache have the same bar", async () => {
		const { getCandleStore } = await import("@/lib/chart/store");
		const store = makeStore({ streamLastBar: LIVE_BAR, cachedBar: LIVE_BAR, invokeTick: true });
		vi.mocked(getCandleStore).mockReturnValue(store as unknown as ReturnType<typeof getCandleStore>);

		const { createDatafeed } = await import("@/components/trade/chart/datafeed");
		const datafeed = createDatafeed();
		const onTick = vi.fn();

		datafeed.subscribeBars(SYMBOL_INFO, RESOLUTION, onTick, LISTENER_GUID, vi.fn());

		expect(onTick).toHaveBeenCalledTimes(1);
		expect(onTick).toHaveBeenCalledWith(LIVE_BAR);
	});

	it("calls onTick once for the cached bar when the live stream has no replay", async () => {
		const { getCandleStore } = await import("@/lib/chart/store");
		const store = makeStore({ cachedBar: LIVE_BAR, invokeTick: false });
		vi.mocked(getCandleStore).mockReturnValue(store as unknown as ReturnType<typeof getCandleStore>);

		const { createDatafeed } = await import("@/components/trade/chart/datafeed");
		const datafeed = createDatafeed();
		const onTick = vi.fn();

		datafeed.subscribeBars(SYMBOL_INFO, RESOLUTION, onTick, LISTENER_GUID, vi.fn());

		expect(onTick).toHaveBeenCalledTimes(1);
		expect(onTick).toHaveBeenCalledWith(LIVE_BAR);
	});

	it("calls onTick twice when stream bar differs from cached bar", async () => {
		const { getCandleStore } = await import("@/lib/chart/store");
		const store = makeStore({ streamLastBar: LIVE_BAR, cachedBar: DIFFERENT_BAR, invokeTick: true });
		vi.mocked(getCandleStore).mockReturnValue(store as unknown as ReturnType<typeof getCandleStore>);

		const { createDatafeed } = await import("@/components/trade/chart/datafeed");
		const datafeed = createDatafeed();
		const onTick = vi.fn();

		datafeed.subscribeBars(SYMBOL_INFO, RESOLUTION, onTick, LISTENER_GUID, vi.fn());

		expect(onTick).toHaveBeenCalledTimes(2);
	});
});
