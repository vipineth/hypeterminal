const SAMPLE_TTL_MS = 5 * 60 * 1000;

export interface ExchangeClock {
	now(): Promise<number>;
	warm(): void;
}

export function createExchangeClock(readServerTime: () => Promise<number>, localNow: () => number): ExchangeClock {
	let sample: { offsetMs: number; takenAt: number } | null = null;
	let refreshing: Promise<void> | null = null;

	function refresh(): Promise<void> {
		refreshing ??= (async () => {
			const sentAt = localNow();
			const serverTime = await readServerTime();
			const receivedAt = localNow();
			sample = { offsetMs: serverTime - (sentAt + receivedAt) / 2, takenAt: receivedAt };
		})().finally(() => {
			refreshing = null;
		});
		return refreshing;
	}

	async function now(): Promise<number> {
		if (!sample) await refresh();
		else if (localNow() - sample.takenAt > SAMPLE_TTL_MS) refresh().catch(() => {});
		if (!sample) throw new Error("Exchange clock unavailable");
		return Math.round(localNow() + sample.offsetMs);
	}

	function warm() {
		if (!sample) refresh().catch(() => {});
	}

	return { now, warm };
}
