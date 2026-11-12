export const title = "One l2Book key in hl-react's subscription store";

function book(s) {
	if (s.hooks === 0) return "Book unmounted";
	if (s.vis === "hidden") return "Tab hidden";
	if (s.entry.status === "active") return s.serverSub && s.sock === "open" ? "Book live" : "Book says live, no data";
	if (s.entry.status === "error") return "Book shows error";
	return "Book loading";
}

function sdk(s) {
	if (s.orphan) return "SDK keeps a listener nobody can remove";
	if (s.lis.length > 0) return "SDK listener owned";
	return "no SDK listener";
}

export const state = (v) => ({ Screen: book(v.s), SDK: sdk(v.s) });

const words = {
	YouMount: "a book hook mounts",
	YouUnmount: "a book hook unmounts",
	CommitEnds: "the React commit ends",
	RunMicrotask: "a subscribe call settles",
	RetryTimerFires: "the retry timer fires",
	CooldownEnds: "the retry cooldown ends",
	SocketDrops: "the socket drops",
	RequestTimesOut: "a subscribe request fails",
	SocketReopens: "the socket reconnects",
	ServerAcks: "Hyperliquid confirms the subscribe",
	ServerPushesBook: "Hyperliquid pushes a book",
	WatchdogFires: "the staleness watchdog fires",
	TabHides: "you hide the tab",
	TabShows: "you show the tab",
	NothingLeftToHappen: "nothing left to happen",
};

export const step = (action) => words[action] ?? action;
