interface BatchedUpdater<T> {
	add: (item: T) => void;
	flush: () => void;
	destroy: () => void;
}

export function createThrottledUpdater<T>(callback: (item: T) => void, intervalMs = 16): BatchedUpdater<T> {
	let lastItem: T | null = null;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastCallTime = 0;

	function scheduleUpdate() {
		if (timeoutId !== null) return;

		const now = Date.now();
		const elapsed = now - lastCallTime;

		if (elapsed >= intervalMs) {
			if (lastItem !== null) {
				callback(lastItem);
				lastItem = null;
				lastCallTime = now;
			}
		} else {
			timeoutId = setTimeout(() => {
				timeoutId = null;
				if (lastItem !== null) {
					callback(lastItem);
					lastItem = null;
					lastCallTime = Date.now();
				}
			}, intervalMs - elapsed);
		}
	}

	return {
		add: (item: T) => {
			lastItem = item;
			scheduleUpdate();
		},
		flush: () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			if (lastItem !== null) {
				callback(lastItem);
				lastItem = null;
			}
		},
		destroy: () => {
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			lastItem = null;
		},
	};
}
