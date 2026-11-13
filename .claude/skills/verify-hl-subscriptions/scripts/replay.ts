import { dirname, join } from "node:path";

const [root, scenario] = process.argv.slice(2);
if (!root || !scenario) {
	console.error("usage: bun replay.ts <repo-root> <scenario>");
	process.exit(2);
}

type Timer = { id: number; at: number; fn: () => void; every?: number };
let now = 1_000_000;
let timerSeq = 0;
const timers = new Map<number, Timer>();
const realImmediate = setImmediate;
const g = globalThis as Record<string, unknown>;
g.setTimeout = (fn: () => void, ms = 0) => {
	const id = ++timerSeq;
	timers.set(id, { id, at: now + ms, fn });
	return id;
};
g.setInterval = (fn: () => void, ms: number) => {
	const id = ++timerSeq;
	timers.set(id, { id, at: now + ms, fn, every: ms });
	return id;
};
g.clearTimeout = (id: number) => timers.delete(id);
g.clearInterval = (id: number) => timers.delete(id);
Date.now = () => now;

const doc = new EventTarget() as EventTarget & { hidden: boolean };
doc.hidden = false;
g.document = doc;
g.window = new EventTarget();

async function drain() {
	for (let i = 0; i < 4; i++) await new Promise((resolve) => realImmediate(resolve));
}

async function advance(ms: number) {
	const end = now + ms;
	for (;;) {
		const due = [...timers.values()].filter((t) => t.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
		if (!due) break;
		now = due.at;
		if (due.every) due.at += due.every;
		else timers.delete(due.id);
		due.fn();
		await drain();
	}
	now = end;
}

type Msg = { method: string; subscription: unknown };

class FakeSocket extends EventTarget {
	readyState = 1;
	terminationSignal = new AbortController().signal;
	buffered: string[] = [];
	serverSubscribed = false;
	awaitingReply: unknown[] = [];
	subscribesSent = 0;

	send(raw: string) {
		if (this.readyState !== 1) {
			this.buffered.push(raw);
			return;
		}
		const msg = JSON.parse(raw) as Msg;
		if (msg.method === "subscribe") {
			this.subscribesSent += 1;
			this.awaitingReply.push(msg.subscription);
		}
		if (msg.method === "unsubscribe") this.serverSubscribed = false;
	}

	close() {
		if (this.readyState !== 1) return;
		this.readyState = 3;
		this.serverSubscribed = false;
		this.awaitingReply = [];
		this.dispatchEvent(new Event("close"));
	}

	reconnect() {
		this.close();
	}

	open() {
		this.readyState = 1;
		const pending = this.buffered;
		this.buffered = [];
		for (const raw of pending) this.send(raw);
		this.dispatchEvent(new Event("open"));
	}

	private deliver(channel: string, data: unknown) {
		this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify({ channel, data }) }));
	}

	ack() {
		const replies = this.awaitingReply;
		this.awaitingReply = [];
		for (const subscription of replies) {
			this.serverSubscribed = true;
			this.deliver("subscriptionResponse", { method: "subscribe", subscription });
		}
	}

	errorReply() {
		const replies = this.awaitingReply;
		this.awaitingReply = [];
		for (const subscription of replies) this.deliver("error", `Invalid subscription ${JSON.stringify(subscription)}`);
	}

	push() {
		if (this.readyState !== 1 || !this.serverSubscribed) return;
		this.deliver("l2Book", { coin: "BTC", time: now, levels: [[], []] });
	}
}

const hlReact = join(root, "packages/hl-react");
const sdk = dirname(Bun.resolveSync("@nktkas/hyperliquid", hlReact));
const { WebSocketSubscriptionManager } = await import(join(sdk, "transport/websocket/_subscriptionManager.js"));
const { WebSocketDispatcher } = await import(join(sdk, "transport/websocket/_dispatcher.js"));
const { HyperliquidEventTarget } = await import(join(sdk, "transport/websocket/_events.js"));
const { SubscriptionClient } = await import(join(sdk, "api/subscription/client.js"));
const { createHyperliquidStore } = await import(join(hlReact, "src/store.ts"));
const { serializeKey, subscriptionKeys } = await import(join(hlReact, "src/query/keys.ts"));
const { createThrottledUpdater } = await import(join(hlReact, "src/internal/websocket/batch-updater.ts"));
const { getStalenessThresholdForKey } = await import(join(hlReact, "src/internal/websocket/reliability.ts"));
const { getDefaultThrottle } = await import(join(hlReact, "src/registries/subscription.ts"));

const socket = new FakeSocket();
const hlEvents = new HyperliquidEventTarget(socket);
const dispatcher = new WebSocketDispatcher(socket, hlEvents, null);
const manager = new WebSocketSubscriptionManager(socket, dispatcher, hlEvents, true);
const client = new SubscriptionClient({
	transport: {
		subscribe: (channel: string, payload: unknown, listener: unknown, options: unknown) =>
			manager.subscribe(channel, payload, listener, options),
	},
});
const store = createHyperliquidStore({
	ssr: false,
	triggerReconnect: () => socket.reconnect(),
	subscribeSocketClose: (onClose: () => void) => {
		socket.addEventListener("close", onClose);
		return () => socket.removeEventListener("close", onClose);
	},
});
const params = { coin: "BTC" };
const key = serializeKey(subscriptionKeys.method("l2Book", params));

function mount() {
	const state = store.getState();
	const updater = createThrottledUpdater((data: unknown) => state.setSubscriptionData(key, data), getDefaultThrottle("l2Book"));
	state.acquireSubscription(
		key,
		(onError: (error: unknown) => void) => client.l2Book(params, (data: unknown) => updater.add(data), { onError }),
		getStalenessThresholdForKey(key),
		undefined,
	);
	return () => {
		updater.flush();
		updater.destroy();
		store.getState().releaseSubscription(key);
	};
}

function setHidden(hidden: boolean) {
	doc.hidden = hidden;
	doc.dispatchEvent(new Event("visibilitychange"));
}

function sdkListeners(): number {
	let count = 0;
	for (const sub of manager._subscriptions.values()) count += sub.listeners.size;
	return count;
}

function entry() {
	return store.getState().subscriptions[key];
}

function step(text: string) {
	console.log(`  ${text}`);
}

function report(broken: boolean, holdsText: string, findingText: string) {
	console.log(`  ${broken ? findingText : holdsText}`);
	console.log(`RESULT ${scenario} ${broken ? "finding" : "holds"}`);
}

const scenarios: Record<string, () => Promise<void>> = {
	"remount-while-subscribing": async () => {
		step("a commit unmounts the BTC book and mounts it again while its subscribe is in flight");
		const first = mount();
		first();
		const second = mount();
		await drain();
		step("Hyperliquid confirms the subscribe and pushes a book");
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step(`entry status ${entry()?.status}`);
		step("the book unmounts for good");
		second();
		await drain();
		socket.open();
		socket.ack();
		await drain();
		report(
			sdkListeners() > 0 || socket.serverSubscribed,
			"no SDK listener and no server subscription remain",
			`leak: ${sdkListeners()} SDK listener(s) remain, server streaming ${socket.serverSubscribed}`,
		);
	},
	"unmount-then-drop": async () => {
		step("the BTC book mounts and its subscribe goes out");
		const unmount = mount();
		await drain();
		step("the book unmounts while the subscribe is in flight");
		unmount();
		await drain();
		step("the socket drops, which rejects the in-flight subscribe");
		socket.close();
		await drain();
		step("the socket reopens and the SDK resubscribes what it still holds");
		socket.open();
		socket.ack();
		await drain();
		report(
			sdkListeners() > 0 || socket.serverSubscribed,
			"no SDK listener and no server subscription remain",
			`leak: ${sdkListeners()} SDK listener(s) remain with no hook mounted, server streaming BTC book: ${socket.serverSubscribed}`,
		);
	},
	"show-during-subscribe": async () => {
		step("the BTC book mounts and its subscribe goes out");
		const unmount = mount();
		await drain();
		step("the tab hides and shows before Hyperliquid confirms; show calls triggerReconnect");
		setHidden(true);
		setHidden(false);
		await drain();
		step("the book unmounts");
		unmount();
		await drain();
		step("the socket reopens and the SDK resubscribes what it still holds");
		socket.open();
		socket.ack();
		await drain();
		report(
			sdkListeners() > 0 || socket.serverSubscribed,
			"no SDK listener and no server subscription remain",
			`leak: ${sdkListeners()} SDK listener(s) remain with no hook mounted, server streaming BTC book: ${socket.serverSubscribed}`,
		);
	},
	"hide-show-recovers": async () => {
		step("the BTC book mounts, is confirmed and shows a book");
		mount();
		await drain();
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step("the tab hides, a book arrives and is buffered, the tab shows");
		setHidden(true);
		socket.push();
		await advance(50);
		setHidden(false);
		await drain();
		step("triggerReconnect closed the socket; it reopens and the SDK resubscribes");
		socket.open();
		await drain();
		socket.ack();
		await drain();
		const before = entry()?.data;
		socket.push();
		await advance(50);
		const live = entry()?.status === "active" && entry()?.data !== before && socket.serverSubscribed;
		report(
			!live,
			`live again: status ${entry()?.status}, new book data arrived`,
			`frozen: status ${entry()?.status}, server streaming ${socket.serverSubscribed}`,
		);
	},
	"frozen-after-resubscribe-failure": async () => {
		step("the BTC book mounts, is confirmed and shows a book");
		mount();
		await drain();
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step("the socket drops and stays down for 30s; the watchdog marks the book stale and calls triggerReconnect");
		socket.close();
		await drain();
		await advance(30_000);
		step("the socket reopens; the SDK resubscribes and Hyperliquid answers with an error (the path a 10s timeout also takes)");
		socket.open();
		await drain();
		socket.errorReply();
		await drain();
		step(`entry status ${entry()?.status}; the store retries`);
		await advance(1_000);
		const sentBefore = socket.subscribesSent;
		step("two minutes pass");
		for (let i = 0; i < 24; i++) {
			socket.push();
			await advance(5_000);
		}
		const status = entry()?.status;
		const frozen = status === "active" && !socket.serverSubscribed && socket.subscribesSent === sentBefore;
		console.log(`  wsStatus ${store.getState().wsStatus}, entry status ${status}, isStale ${entry()?.isStale}, server streaming ${socket.serverSubscribed}, subscribes sent ${sentBefore} then ${socket.subscribesSent}, socket ${socket.readyState}`);
		report(
			frozen,
			"recovered: the book is streaming again",
			"frozen: status says active (footer shows Connected) but the server is not streaming and nothing retries",
		);
	},
	"drop-stays-stale-until-frame": async () => {
		step("the BTC book mounts, is confirmed and shows a book");
		mount();
		await drain();
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step("the socket drops; the SDK keeps the subscription and calls no onError");
		socket.close();
		await drain();
		const afterDrop = { ...entry() };
		step(`after the drop: status ${afterDrop.status}, isStale ${afterDrop.isStale}`);
		step("the socket reopens and Hyperliquid confirms the resubscribe, with no book yet");
		socket.open();
		await drain();
		socket.ack();
		await drain();
		const afterAck = { ...entry() };
		step(`after the ack: status ${afterAck.status}, isStale ${afterAck.isStale}`);
		socket.push();
		await advance(50);
		const afterFrame = { ...entry() };
		step(`after a new book: status ${afterFrame.status}, isStale ${afterFrame.isStale}`);
		report(
			!afterDrop.isStale || !afterAck.isStale || afterFrame.isStale !== false || afterDrop.data === undefined,
			"not live from the drop until a book arrives on the new socket, and the old book stays shown",
			"the entry claimed live data while the socket was down or before a new book arrived",
		);
	},
	"show-keeps-expired-stale": async () => {
		step("the BTC book mounts, is confirmed and shows a book");
		mount();
		await drain();
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step("the tab hides and one book is buffered, then the server goes quiet for 30s");
		setHidden(true);
		socket.push();
		await advance(30_000);
		step(`the watchdog marked the key stale and closed the socket: isStale ${entry()?.isStale}, socket ${socket.readyState}`);
		step("the tab shows, which flushes the buffered book");
		setHidden(false);
		await drain();
		const afterShow = { ...entry() };
		step(`after the show: status ${afterShow.status}, isStale ${afterShow.isStale}`);
		socket.open();
		await drain();
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step(`after a new book: status ${entry()?.status}, isStale ${entry()?.isStale}`);
		report(
			!afterShow.isStale || entry()?.isStale !== false,
			"the expired book stays stale after the show, and a new book makes it live",
			"the show revived an expired book as live",
		);
	},
	"remount-after-error-keeps-buffer-stale": async () => {
		step("the BTC book mounts, is confirmed and shows a book");
		mount();
		await drain();
		socket.ack();
		await drain();
		socket.push();
		await advance(50);
		step("the tab hides and one book is buffered");
		setHidden(true);
		socket.push();
		await advance(50);
		const beforeHide = entry()?.data;
		step("the socket drops and reopens; Hyperliquid refuses the resubscribe, so the store marks the key error");
		socket.close();
		await drain();
		socket.open();
		await drain();
		socket.errorReply();
		await drain();
		step(`entry status ${entry()?.status}`);
		step("a second hook mounts the key, which resets the entry and subscribes again; Hyperliquid confirms");
		mount();
		await drain();
		socket.ack();
		await drain();
		step(`entry status ${entry()?.status}, isStale ${entry()?.isStale}`);
		step("the tab shows before any new book; the reconnect's close event has not landed yet");
		socket.reconnect = () => {};
		setHidden(false);
		await drain();
		const shown = entry();
		const old = shown?.data !== undefined && shown?.data !== beforeHide;
		step(`after the show: status ${shown?.status}, isStale ${shown?.isStale}, shows the pre-drop book ${old}`);
		report(
			old && shown?.status === "active" && !shown?.isStale,
			"no pre-drop book is shown as live",
			"the show put the pre-drop book back as live data",
		);
	},
};

const run = scenarios[scenario];
if (!run) {
	console.error(`unknown scenario ${scenario}; known: ${Object.keys(scenarios).join(", ")}`);
	process.exit(2);
}
console.log(`replay ${scenario}`);
await run();
process.exit(0);
