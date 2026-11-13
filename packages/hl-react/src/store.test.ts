import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	connectAndPush,
	installFakeBrowser,
	mountMarkFeed,
	removeFakeBrowser,
	server,
	setHidden,
} from "./testing/fake-socket-feed";

beforeEach(installFakeBrowser);
afterEach(removeFakeBrowser);

describe("subscription freshness", () => {
	it("reports a feed not live from a socket drop until a frame arrives on the new socket", async () => {
		const { feed, release } = await mountMarkFeed();
		await connectAndPush("80.276");
		expect(feed()).toEqual({ status: "active", isStale: false, markPx: "80.276" });

		server().drop();
		await vi.advanceTimersByTimeAsync(0);
		expect(feed()).toEqual({ status: "active", isStale: true, markPx: "80.276" });

		await vi.advanceTimersByTimeAsync(1_000);
		server().open();
		await vi.advanceTimersByTimeAsync(0);
		server().ack();
		await vi.advanceTimersByTimeAsync(0);
		expect(feed()).toEqual({ status: "active", isStale: true, markPx: "80.276" });

		server().pushMark("95");
		expect(feed()).toEqual({ status: "active", isStale: false, markPx: "95" });
		release();
	});

	it("keeps an expired buffered frame stale when the tab comes back", async () => {
		const { feed, release } = await mountMarkFeed();
		await connectAndPush("80");
		setHidden(true);
		server().pushMark("80.276");

		await vi.advanceTimersByTimeAsync(25_001);
		expect(feed()).toEqual({ status: "active", isStale: true, markPx: "80" });

		setHidden(false);
		expect(feed()).toEqual({ status: "active", isStale: true, markPx: "80.276" });

		server().drop();
		await vi.advanceTimersByTimeAsync(1_000);
		await connectAndPush("95");
		expect(feed()).toEqual({ status: "active", isStale: false, markPx: "95" });
		release();
	});

	it("keeps an expired buffered frame stale when a hook that never pauses joins the key", async () => {
		const { feed, mount, release } = await mountMarkFeed();
		await connectAndPush("80");
		setHidden(true);
		server().pushMark("80.276");
		await vi.advanceTimersByTimeAsync(25_001);

		mount(false);
		expect(feed()).toEqual({ status: "active", isStale: true, markPx: "80.276" });
		release();
		release();
	});

	it("keeps a frame buffered while hidden live when it is still fresh", async () => {
		const { feed, release } = await mountMarkFeed();
		await connectAndPush("80");
		setHidden(true);
		await vi.advanceTimersByTimeAsync(5_000);
		server().pushMark("80.276");
		await vi.advanceTimersByTimeAsync(5_000);

		setHidden(false);
		expect(feed()).toEqual({ status: "active", isStale: false, markPx: "80.276" });
		release();
	});
});
