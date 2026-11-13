import { vi } from "vitest";

type Wire = { method: string; subscription?: Record<string, unknown> };

const sockets: FakeWebSocket[] = [];

export class FakeWebSocket extends EventTarget {
	static CONNECTING = 0;
	static OPEN = 1;
	static CLOSING = 2;
	static CLOSED = 3;
	readyState = FakeWebSocket.CONNECTING;
	binaryType = "blob";
	awaitingAck: Record<string, unknown>[] = [];
	subscribed = false;

	constructor(readonly url: string) {
		super();
		sockets.push(this);
	}

	send(raw: string) {
		const msg = JSON.parse(raw) as Wire;
		if (msg.method === "ping") this.deliver("pong", null);
		if (msg.method === "subscribe" && msg.subscription) this.awaitingAck.push(msg.subscription);
	}

	close() {
		if (this.readyState === FakeWebSocket.OPEN) this.readyState = FakeWebSocket.CLOSING;
	}

	open() {
		this.readyState = FakeWebSocket.OPEN;
		this.dispatchEvent(new Event("open"));
	}

	ack() {
		for (const subscription of this.awaitingAck.splice(0)) {
			this.subscribed = true;
			this.deliver("subscriptionResponse", { method: "subscribe", subscription });
		}
	}

	pushMark(markPx: string) {
		if (this.readyState !== FakeWebSocket.OPEN || !this.subscribed) throw new Error("server is not streaming");
		this.deliver("activeAssetCtx", { coin: "SOL", ctx: { markPx } });
	}

	drop() {
		this.readyState = FakeWebSocket.CLOSED;
		this.subscribed = false;
		this.dispatchEvent(Object.assign(new Event("close"), { code: 1006, reason: "", wasClean: false }));
	}

	private deliver(channel: string, data: unknown) {
		this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify({ channel, data }) }));
	}
}

export function server(): FakeWebSocket {
	const socket = sockets.at(-1);
	if (!socket) throw new Error("no socket opened");
	return socket;
}

const doc = Object.assign(new EventTarget(), { hidden: false });

export function setHidden(hidden: boolean) {
	doc.hidden = hidden;
	doc.dispatchEvent(new Event("visibilitychange"));
}

export async function mountMarkFeed() {
	const clients = await import("../clients");
	const { createHyperliquidConfig } = await import("../create-config");
	const { createHyperliquidStore } = await import("../store");
	const { serializeKey, subscriptionKeys } = await import("../query/keys");
	const store = createHyperliquidStore(
		createHyperliquidConfig({
			httpTransport: clients.getHttpTransport(false),
			wsTransport: clients.getWsTransport(false),
			ssr: false,
			triggerReconnect: clients.createWsReconnectTrigger(false),
			subscribeSocketClose: clients.createWsCloseSubscriber(false),
		}),
	);
	const params = { coin: "SOL" };
	const key = serializeKey(subscriptionKeys.method("activeAssetCtx", params));
	const mount = (pauseWhenHidden?: boolean) =>
		store
			.getState()
			.acquireSubscription(
				key,
				(onError) =>
					clients
						.getSubscriptionClient(false)
						.activeAssetCtx(params, (data) => store.getState().setSubscriptionData(key, data), { onError }),
				undefined,
				pauseWhenHidden,
			);
	mount();
	const feed = () => {
		const entry = store.getState().subscriptions[key];
		return {
			status: entry?.status,
			isStale: entry?.isStale,
			markPx: (entry?.data as { ctx: { markPx: string } } | undefined)?.ctx.markPx,
		};
	};
	return {
		feed,
		entry: () => store.getState().subscriptions[key],
		mount,
		release: () => store.getState().releaseSubscription(key),
	};
}

export async function connectAndPush(markPx: string) {
	await vi.advanceTimersByTimeAsync(0);
	server().open();
	await vi.advanceTimersByTimeAsync(0);
	server().ack();
	await vi.advanceTimersByTimeAsync(0);
	server().pushMark(markPx);
}

export function installFakeBrowser() {
	vi.resetModules();
	sockets.length = 0;
	doc.hidden = false;
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
	vi.setSystemTime(100_000);
	vi.stubGlobal("WebSocket", FakeWebSocket);
	vi.stubGlobal("document", doc);
	vi.stubGlobal("window", new EventTarget());
	vi.stubGlobal("navigator", { onLine: true });
}

export function removeFakeBrowser() {
	vi.useRealTimers();
	vi.unstubAllGlobals();
}
