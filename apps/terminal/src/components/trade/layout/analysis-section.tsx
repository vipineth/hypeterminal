import {
	type KeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useConnection } from "wagmi";
import { PANEL_LAYOUT } from "@/config/layout";
import { PositionsPanel } from "../positions/positions-panel";
import { MarketInfo } from "./market-info";

const { id, chart, positions } = PANEL_LAYOUT.ANALYSIS;
const chartHeightStorageKey = `${id}:chart-height-px`;
const fallbackFooterHeightPx = 32;

type AnalysisSectionProps = {
	onDesiredHeightChange?: (heightPx: number) => void;
};

export function AnalysisSection({ onDesiredHeightChange }: AnalysisSectionProps) {
	const { isConnected } = useConnection();
	const rootRef = useRef<HTMLDivElement>(null);
	const cleanupDragRef = useRef<(() => void) | null>(null);
	const initializedRef = useRef(false);
	const positionsMinHeightPx = isConnected ? positions.minHeightPx : positions.disconnectedMinHeightPx;
	const [chartHeightPx, setChartHeightPx] = useState<number>(chart.minHeightPx);
	const [visibleChartMaxHeightPx, setVisibleChartMaxHeightPx] = useState<number>(
		PANEL_LAYOUT.ANALYSIS.minHeightPx - positionsMinHeightPx,
	);
	const maxChartHeightPx = Math.max(chart.minHeightPx, visibleChartMaxHeightPx, chartHeightPx);

	useLayoutEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;

		const storedChartHeight = readStoredChartHeight();
		const availableHeight = rootRef.current?.getBoundingClientRect().height ?? PANEL_LAYOUT.ANALYSIS.minHeightPx;
		const initialChartHeight = Math.max(chart.minHeightPx, storedChartHeight ?? availableHeight - positionsMinHeightPx);

		setVisibleChartMaxHeightPx(getVisibleChartMaxHeight(rootRef.current));
		setChartHeightPx(initialChartHeight);
		onDesiredHeightChange?.(initialChartHeight + positionsMinHeightPx);
	}, [onDesiredHeightChange, positionsMinHeightPx]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || typeof ResizeObserver === "undefined") return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				setVisibleChartMaxHeightPx(getVisibleChartMaxHeight(root));
			}
		});
		observer.observe(root);
		function handleResize() {
			setVisibleChartMaxHeightPx(getVisibleChartMaxHeight(root));
		}
		window.addEventListener("resize", handleResize);
		handleResize();
		return () => {
			window.removeEventListener("resize", handleResize);
			observer.disconnect();
		};
	}, []);

	useLayoutEffect(() => {
		onDesiredHeightChange?.(chartHeightPx + positionsMinHeightPx);
	}, [chartHeightPx, onDesiredHeightChange, positionsMinHeightPx]);

	useEffect(() => {
		writeStoredChartHeight(chartHeightPx);
	}, [chartHeightPx]);

	useEffect(() => {
		return () => {
			cleanupDragRef.current?.();
		};
	}, []);

	function resizeChartTo(nextHeightPx: number) {
		const clamped = Math.min(maxChartHeightPx, Math.max(chart.minHeightPx, Math.round(nextHeightPx)));
		setChartHeightPx(clamped);
	}

	function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
		if (event.button !== 0) return;

		event.preventDefault();

		const startY = event.clientY;
		const startChartHeight = chartHeightPx;
		const previousCursor = document.documentElement.style.cursor;
		const previousUserSelect = document.body.style.userSelect;

		Object.assign(document.documentElement.style, { cursor: "row-resize" });
		Object.assign(document.body.style, { userSelect: "none" });

		function cleanup() {
			Object.assign(document.documentElement.style, { cursor: previousCursor });
			Object.assign(document.body.style, { userSelect: previousUserSelect });
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerup", handlePointerUp);
			window.removeEventListener("pointercancel", handlePointerUp);
			cleanupDragRef.current = null;
		}

		function handlePointerMove(moveEvent: PointerEvent) {
			resizeChartTo(startChartHeight + moveEvent.clientY - startY);
		}

		function handlePointerUp() {
			cleanup();
		}

		cleanupDragRef.current?.();
		cleanupDragRef.current = cleanup;
		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerup", handlePointerUp);
		window.addEventListener("pointercancel", handlePointerUp);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		const step = event.shiftKey ? 80 : 24;

		if (event.key === "ArrowDown") {
			event.preventDefault();
			resizeChartTo(chartHeightPx + step);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			resizeChartTo(chartHeightPx - step);
		} else if (event.key === "Home") {
			event.preventDefault();
			resizeChartTo(chart.minHeightPx);
		}
	}

	return (
		<div ref={rootRef} className="h-full min-h-0 flex flex-col">
			<div className="min-h-0 shrink-0" style={{ height: chartHeightPx }}>
				<MarketInfo />
			</div>
			{/* biome-ignore lint/a11y/useSemanticElements: separator role is required for an interactive resize handle */}
			<div
				role="separator"
				aria-orientation="horizontal"
				aria-label="Resize chart and positions"
				aria-valuemin={chart.minHeightPx}
				aria-valuemax={maxChartHeightPx}
				aria-valuenow={chartHeightPx}
				tabIndex={0}
				onPointerDown={handlePointerDown}
				onKeyDown={handleKeyDown}
				className="group bg-stroke-weak relative z-10 flex h-px w-full shrink-0 cursor-row-resize items-center justify-center after:absolute after:left-0 after:top-1/2 after:h-2 after:w-full after:-translate-y-1/2 focus-visible:outline-hidden focus-visible:bg-brand/50 hover:bg-brand/30 active:bg-brand/50"
			>
				<div className="z-10 h-1 w-6 shrink-0 rounded-12 bg-stroke-weak group-hover:bg-brand/40 group-active:bg-brand/55" />
			</div>
			<div className="min-h-0 flex-1" style={{ minHeight: positionsMinHeightPx }}>
				<PositionsPanel />
			</div>
		</div>
	);
}

function readStoredChartHeight() {
	if (typeof window === "undefined") return null;

	const storedValue = window.localStorage.getItem(chartHeightStorageKey);
	if (!storedValue) return null;

	const parsedValue = Number.parseInt(storedValue, 10);
	return Number.isFinite(parsedValue) ? parsedValue : null;
}

function writeStoredChartHeight(heightPx: number) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(chartHeightStorageKey, String(heightPx));
}

function getVisibleChartMaxHeight(root: HTMLElement | null) {
	if (!root || typeof window === "undefined") return chart.minHeightPx;

	const footerHeight = document.querySelector("footer")?.getBoundingClientRect().height ?? fallbackFooterHeightPx;
	const top = root.getBoundingClientRect().top;
	return Math.max(chart.minHeightPx, Math.floor(window.innerHeight - top - footerHeight));
}
