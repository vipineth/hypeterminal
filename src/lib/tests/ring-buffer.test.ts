import { describe, expect, it } from "vitest";
import { RingBuffer } from "@/lib/circular-buffer";

type TwapHistoryItem = {
	twapId?: number;
	time: number;
	state: { coin: string };
	status: { status: string };
};

describe("ring buffer", () => {
	it("replaces TWAP history entries with newer updates for the same twap id", () => {
		const buffer = new RingBuffer<TwapHistoryItem>({
			maxSize: 200,
			getKey: (item) => (item.twapId != null ? String(item.twapId) : `${item.time}-${item.state.coin}`),
			compare: (a, b) => b.time - a.time,
			shouldReplace: (existing, incoming) => incoming.time >= existing.time,
		});

		const activated: TwapHistoryItem = {
			twapId: 42,
			time: 1000,
			state: { coin: "BTC" },
			status: { status: "activated" },
		};
		const finished: TwapHistoryItem = {
			twapId: 42,
			time: 2000,
			state: { coin: "BTC" },
			status: { status: "finished" },
		};

		expect(buffer.add([activated])).toBe(true);
		expect(buffer.add([finished])).toBe(true);
		expect(buffer.getItems()).toEqual([finished]);
	});

	it("does not replace TWAP history entries with older updates", () => {
		const buffer = new RingBuffer<TwapHistoryItem>({
			maxSize: 200,
			getKey: (item) => (item.twapId != null ? String(item.twapId) : `${item.time}-${item.state.coin}`),
			compare: (a, b) => b.time - a.time,
			shouldReplace: (existing, incoming) => incoming.time >= existing.time,
		});

		const finished: TwapHistoryItem = {
			twapId: 42,
			time: 2000,
			state: { coin: "BTC" },
			status: { status: "finished" },
		};
		const olderActivated: TwapHistoryItem = {
			twapId: 42,
			time: 1000,
			state: { coin: "BTC" },
			status: { status: "activated" },
		};

		expect(buffer.add([finished])).toBe(true);
		expect(buffer.add([olderActivated])).toBe(false);
		expect(buffer.getItems()).toEqual([finished]);
	});
});
