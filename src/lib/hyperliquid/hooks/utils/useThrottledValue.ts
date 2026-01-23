import { useEffect, useRef, useState } from "react";

/**
 * Throttles value updates to at most once per interval.
 * First non-null value is always immediate (no delay).
 * Subsequent updates are throttled.
 */
export function useThrottledValue<T>(value: T, interval: number): T {
	const [throttledValue, setThrottledValue] = useState(value);
	const lastUpdateTime = useRef<number | null>(null);

	useEffect(() => {
		const now = Date.now();
		const hasRealData = value != null;
		const isFirstRealData = hasRealData && lastUpdateTime.current === null;
		const intervalElapsed = lastUpdateTime.current !== null && now >= lastUpdateTime.current + interval;

		if (isFirstRealData || intervalElapsed) {
			if (hasRealData) {
				lastUpdateTime.current = now;
			}
			setThrottledValue(value);
			return;
		}

		if (lastUpdateTime.current === null) {
			return;
		}

		const remaining = interval - (now - lastUpdateTime.current);
		const id = window.setTimeout(() => {
			lastUpdateTime.current = Date.now();
			setThrottledValue(value);
		}, remaining);

		return () => window.clearTimeout(id);
	}, [value, interval]);

	return throttledValue;
}
