import { installFakeBrowser, removeFakeBrowser, server } from "@hypeterminal/hl-react/testing/fake-socket-feed";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(removeFakeBrowser);

const drain = () => vi.advanceTimersByTimeAsync(0);

describe("candle store", () => {
	it("resubscribes and resumes candles after the server refuses a resubscribe", async () => {
		installFakeBrowser();
		const { createCandleStore } = await import("./store");
		const chart = createCandleStore();
		const onTick = vi.fn();
		chart.getState().subscribe("SOL:1m", "SOL", "1m", "chart", onTick, vi.fn());

		await drain();
		server().open();
		await drain();
		server().ack();
		await drain();
		server().pushCandle({ t: 60_000, c: "80" });
		expect(onTick).toHaveBeenLastCalledWith(expect.objectContaining({ time: 60_000, close: 80 }));

		server().drop();
		await vi.advanceTimersByTimeAsync(1_000);
		server().open();
		await drain();
		expect(server().awaitingAck).toContainEqual({ type: "candle", coin: "SOL", interval: "1m" });
		server().refuse();
		await vi.advanceTimersByTimeAsync(1_000);

		expect(server().awaitingAck).toContainEqual({ type: "candle", coin: "SOL", interval: "1m" });
		server().ack();
		await drain();
		server().pushCandle({ t: 120_000, c: "81" });
		expect(onTick).toHaveBeenLastCalledWith(expect.objectContaining({ time: 120_000, close: 81 }));
		expect(chart.getState().streams["SOL:1m"]?.status).toBe("active");

		chart.getState().unsubscribe("SOL:1m", "chart");
	});
});
