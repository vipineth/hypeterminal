import { type RefObject, useLayoutEffect, useState } from "react";

const ROW_HEIGHT = 22;
const MIN_ROWS_PER_SIDE = 3;
const MAX_ROWS_PER_SIDE = 20;

export function useOrderbookRows(containerRef: RefObject<HTMLDivElement | null>): number {
	const [visibleRows, setVisibleRows] = useState(MIN_ROWS_PER_SIDE);

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		function calculateRows() {
			const height = container!.clientHeight;
			const rowsPerSide = Math.min(MAX_ROWS_PER_SIDE, Math.max(MIN_ROWS_PER_SIDE, Math.floor(height / 2 / ROW_HEIGHT)));
			setVisibleRows(rowsPerSide);
		}

		calculateRows();

		const observer = new ResizeObserver(calculateRows);
		observer.observe(container);

		return () => observer.disconnect();
	}, [containerRef]);

	return visibleRows;
}
