const SAMPLE_TTL_MS = 5 * 60 * 1000;

export interface ExchangeClock {
	now(): Promise<number>;
	estimate(): number | null;
	warm(): void;
}

export function createExchangeClock(readServerTime: () => Promise<number>, elapsed: () => number): ExchangeClock {
	let sample: { serverTime: number; takenAt: number } | null = null;
	let refreshing: Promise<void> | null = null;

	function refresh(): Promise<void> {
		refreshing ??= (async () => {
			const sentAt = elapsed();
			const serverTime = await readServerTime();
			const receivedAt = elapsed();
			sample = { serverTime: serverTime + (receivedAt - sentAt) / 2, takenAt: receivedAt };
		})().finally(() => {
			refreshing = null;
		});
		return refreshing;
	}

	function estimate(): number | null {
		return sample && Math.round(sample.serverTime + elapsed() - sample.takenAt);
	}

	async function now(): Promise<number> {
		if (!sample) await refresh();
		else if (elapsed() - sample.takenAt > SAMPLE_TTL_MS) refresh().catch(() => {});
		const current = estimate();
		if (current === null) throw new Error("Exchange clock unavailable");
		return current;
	}

	function warm() {
		if (!sample) refresh().catch(() => {});
	}

	return { now, estimate, warm };
}
