import type { BoxDirection, GridCell, TapBox } from "../types";
import { TAP_TRADE_CONFIG } from "../constants";
import type { CandlePoint } from "../hooks/use-candle-history";

/**
 * Calculate leverage for a box based on distance from current price
 */
export function calculateBoxLeverage(
	boxPriceLevel: number,
	currentPrice: number,
	maxLeverage: number
): number {
	const distancePercent = (Math.abs(boxPriceLevel - currentPrice) / currentPrice) * 100;

	// Calculate leverage needed to achieve ~2x return at this distance
	// Formula: leverage = 100 / distancePercent (for ~2x return)
	const calculatedLeverage = Math.ceil(100 / distancePercent);

	// Cap at user's max leverage setting
	return Math.min(maxLeverage, calculatedLeverage);
}

/**
 * Generate boxes for the grid based on current price
 */
export function generateBoxes(
	currentPrice: number,
	maxLeverage: number
): { longBoxes: TapBox[]; shortBoxes: TapBox[] } {
	const longBoxes: TapBox[] = [];
	const shortBoxes: TapBox[] = [];

	const { BOX_SPACING_PERCENT, MAX_BOXES_PER_SIDE } = TAP_TRADE_CONFIG;

	// Generate LONG boxes (above current price)
	for (let i = 1; i <= MAX_BOXES_PER_SIDE; i++) {
		const distancePercent = i * BOX_SPACING_PERCENT;
		const priceLevel = currentPrice * (1 + distancePercent / 100);
		const leverage = calculateBoxLeverage(priceLevel, currentPrice, maxLeverage);

		longBoxes.push({
			id: `long-${i}`,
			priceLevel,
			distancePercent,
			leverage,
			direction: "LONG",
		});
	}

	// Generate SHORT boxes (below current price)
	for (let i = 1; i <= MAX_BOXES_PER_SIDE; i++) {
		const distancePercent = i * BOX_SPACING_PERCENT;
		const priceLevel = currentPrice * (1 - distancePercent / 100);
		const leverage = calculateBoxLeverage(priceLevel, currentPrice, maxLeverage);

		shortBoxes.push({
			id: `short-${i}`,
			priceLevel,
			distancePercent,
			leverage,
			direction: "SHORT",
		});
	}

	return { longBoxes, shortBoxes };
}

/**
 * Calculate position size based on bet amount and leverage
 */
export function calculatePositionSize(
	betAmount: number,
	leverage: number,
	currentPrice: number
): { sizeUsd: number; sizeAsset: number } {
	const sizeUsd = betAmount * leverage;
	const sizeAsset = sizeUsd / currentPrice;

	return { sizeUsd, sizeAsset };
}

/**
 * Calculate expected PnL if TP is hit
 */
export function calculateExpectedPnL(
	sizeAsset: number,
	entryPrice: number,
	tpPrice: number,
	direction: BoxDirection
): number {
	const priceDiff = tpPrice - entryPrice;

	if (direction === "LONG") {
		return sizeAsset * priceDiff;
	} else {
		return sizeAsset * -priceDiff;
	}
}

/**
 * Estimate liquidation price (simplified)
 */
export function estimateLiquidationPrice(
	entryPrice: number,
	leverage: number,
	direction: BoxDirection
): number {
	// Simplified: liquidation ~= entry ± (entry / leverage)
	// Actual depends on maintenance margin
	const liqDistance = entryPrice / leverage;

	if (direction === "LONG") {
		return entryPrice - liqDistance;
	} else {
		return entryPrice + liqDistance;
	}
}

/**
 * Format price with appropriate decimals based on magnitude
 */
export function formatPrice(price: number, asset: string): string {
	if (asset === "BTC") {
		return price.toLocaleString("en-US", {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		});
	} else if (asset === "ETH") {
		return price.toLocaleString("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	} else {
		return price.toLocaleString("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 4,
		});
	}
}

/**
 * Format percentage with sign
 */
export function formatPercent(percent: number): string {
	const sign = percent >= 0 ? "+" : "";
	return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Generate time labels for grid columns
 * All columns are future time buckets for trading (+10s, +20s, etc.)
 * No NOW column - chart handles current time
 */
export function generateTimeLabels(numCols: number): string[] {
	const { TIME_BUCKET_SECONDS } = TAP_TRADE_CONFIG;
	const labels: string[] = [];

	// All columns are future predictions starting at +10s
	for (let col = 0; col < numCols; col++) {
		const seconds = (col + 1) * TIME_BUCKET_SECONDS;
		labels.push(`+${seconds}s`);
	}

	return labels;
}

/**
 * Generate a 2D grid of cells for the tap trade interface
 * Chart is on left, grid is on right
 * All cells in +10s and beyond are tradeable
 * Leverage = return multiplier based on distance from current price to target
 */
export function generateGrid(
	currentPrice: number,
	_candles: CandlePoint[] | undefined,
	maxLeverage: number
): {
	grid: GridCell[][];
	priceLevels: number[];
	minPrice: number;
	maxPrice: number;
	timeLabels: string[];
	currentPriceRowIndex: number;
} {
	const { GRID_ROWS, GRID_COLS, PRICE_STEP_PERCENT } = TAP_TRADE_CONFIG;
	const halfRows = Math.floor(GRID_ROWS / 2);

	// Calculate price levels centered around current price
	const priceLevels: number[] = [];
	for (let i = halfRows; i >= -halfRows + 1; i--) {
		const priceLevel = currentPrice * (1 + (i * PRICE_STEP_PERCENT) / 100);
		priceLevels.push(priceLevel);
	}

	const minPrice = Math.min(...priceLevels);
	const maxPrice = Math.max(...priceLevels);

	// Time labels: NOW, +10s, +20s, etc.
	const timeLabels = generateTimeLabels(GRID_COLS);

	// Find current price row index (closest row to current price)
	let currentPriceRowIndex = halfRows;
	let minDiff = Infinity;
	for (let i = 0; i < priceLevels.length; i++) {
		const diff = Math.abs(priceLevels[i] - currentPrice);
		if (diff < minDiff) {
			minDiff = diff;
			currentPriceRowIndex = i;
		}
	}

	// Generate grid
	const grid: GridCell[][] = [];

	for (let row = 0; row < priceLevels.length; row++) {
		const priceLevel = priceLevels[row];
		const direction: BoxDirection = priceLevel > currentPrice ? "LONG" : "SHORT";

		// Calculate return multiplier based on distance
		// If current = 126 and target = 127, that's ~0.79% move
		// At 100x leverage, that's ~79% return (0.79x on your bet, or 1.79x total)
		// We show the leverage needed to double your money at this distance
		const distancePercent = (Math.abs(priceLevel - currentPrice) / currentPrice) * 100;

		// Leverage = 100 / distance% (how much leverage to get 100% return)
		// E.g., 0.5% distance = 200x leverage for 100% return
		// But we cap it and show it as return multiplier
		let leverage = distancePercent > 0 ? Math.round((100 / distancePercent) * 100) / 100 : maxLeverage;
		leverage = Math.min(maxLeverage, Math.max(1.01, leverage));

		const rowCells: GridCell[] = [];

		for (let col = 0; col < GRID_COLS; col++) {
			// All cells are tradeable except current price row
			const isActive = row !== currentPriceRowIndex;

			rowCells.push({
				row,
				col,
				priceLevel,
				leverage,
				direction,
				isActive,
				isFaded: false,
			});
		}

		grid.push(rowCells);
	}

	return { grid, priceLevels, minPrice, maxPrice, timeLabels, currentPriceRowIndex };
}
