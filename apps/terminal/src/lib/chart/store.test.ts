import { installFakeBrowser, removeFakeBrowser, server } from "@hypeterminal/hl-react/testing/fake-socket-feed";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(removeFakeBrowser);

const drain = () => vi.advanceTimersByTimeAsync(0);
const candleSub = { type: "candle", coin: "SOL", interval: "1m" };

async function mountChart() {
	installFakeBrowser();
	const { createCandleStore } = await import("./store");
	const chart = createCandleStore();
	const onTick = vi.fn();
	const unsubscribeLikeTradingView = () => chart.getState().unsubscribe("SOL:1m", "chart");
	chart.getState().subscribe("SOL:1m", "SOL", "1m", "chart", onTick, unsubscribeLikeTradingView);
	await drain();
	server().open();
	await drain();
	return { chart, onTick };
}

async function expectResumes(chart: Awaited<ReturnType<typeof mountChart>>["chart"], onTick: ReturnType<typeof vi.fn>) {
	await vi.advanceTimersByTimeAsync(1_000);
	expect(server().awaitingAck).toContainEqual(candleSub);
	server().ack();
	await drain();
	server().pushCandle({ t: 120_000, c: "81" });
	expect(onTick).toHaveBeenLastCalledWith(expect.objectContaining({ time: 120_000, close: 81 }));
	expect(chart.getState().streams["SOL:1m"]?.status).toBe("active");
	chart.getState().unsubscribe("SOL:1m", "chart");
}

describe("candle store", () => {
	it("resubscribes and resumes candles after the server refuses a resubscribe", async () => {
		const { chart, onTick } = await mountChart();
		server().ack();
		await drain();
		server().pushCandle({ t: 60_000, c: "80" });
		expect(onTick).toHaveBeenLastCalledWith(expect.objectContaining({ time: 60_000, close: 80 }));

		server().drop();
		await vi.advanceTimersByTimeAsync(1_000);
		server().open();
		await drain();
		expect(server().awaitingAck).toContainEqual(candleSub);
		server().refuse();

		await expectResumes(chart, onTick);
	});

	it("retries and streams candles after the server refuses the first subscribe", async () => {
		const { chart, onTick } = await mountChart();
		expect(server().awaitingAck).toContainEqual(candleSub);
		server().refuse();

		await expectResumes(chart, onTick);
	});
});
