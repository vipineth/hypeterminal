import { useEffect, useRef, useState } from "react";

export function formatDuration(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

interface Props {
	startTime: number;
	durationMs?: number;
	isActive?: boolean;
	format?: (elapsedMs: number) => string;
}

export function TimeTicker({ startTime, durationMs, isActive = true, format = formatDuration }: Props) {
	const [elapsed, setElapsed] = useState(() => Date.now() - startTime);
	const rafRef = useRef<number>(0);
	const lastUpdateRef = useRef<number>(0);

	useEffect(() => {
		if (!isActive) {
			setElapsed(durationMs ?? Date.now() - startTime);
			return;
		}

		const tick = (now: number) => {
			if (now - lastUpdateRef.current >= 1000) {
				lastUpdateRef.current = now;
				setElapsed(Date.now() - startTime);
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		lastUpdateRef.current = performance.now();
		rafRef.current = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rafRef.current);
	}, [isActive, startTime, durationMs]);

	const displayMs = durationMs != null ? Math.min(elapsed, durationMs) : elapsed;

	return <>{format(displayMs)}</>;
}
