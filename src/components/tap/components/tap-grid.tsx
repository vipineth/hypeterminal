import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ASSET_TO_COIN } from "../constants";
import { useCandleHistory } from "../hooks/use-candle-history";
import {
	useTapTradeActions,
	useTapTradeBoxState,
	useTapTradePrice,
	useTapTradeSettings,
} from "../hooks/use-tap-trade-store";
import { formatPrice, generateGrid } from "../lib/calculations";
import type { GridCell, TapBox as TapBoxType } from "../types";
import { PriceChart } from "./price-chart";

interface TapGridProps {
	onTradeRequest: (box: TapBoxType) => void;
	className?: string;
}

export function TapGrid({ onTradeRequest, className }: TapGridProps) {
	const { currentPrice } = useTapTradePrice();
	const { maxLeverage, asset, betAmount } = useTapTradeSettings();
	const { highlightedBoxId, activeBets } = useTapTradeBoxState();
	const { setHighlightedBox, clearHighlightTimeout } = useTapTradeActions();

	// Fetch candle history for chart
	const coin = ASSET_TO_COIN[asset];
	const { data: candles } = useCandleHistory({ coin, interval: "1m" });

	// Generate 2D grid based on current price
	const { grid, priceLevels, minPrice, maxPrice, timeLabels, currentPriceRowIndex } = useMemo(() => {
		if (currentPrice === null) {
			return {
				grid: [],
				priceLevels: [],
				minPrice: 0,
				maxPrice: 0,
				timeLabels: [],
				currentPriceRowIndex: 0,
			};
		}
		return generateGrid(currentPrice, candles, maxLeverage);
	}, [currentPrice, candles, maxLeverage]);

	// Handle cell tap
	const handleCellTap = useCallback(
		(cell: GridCell) => {
			if (!cell.isActive) {
				return;
			}

			const boxId = `${cell.direction}-${cell.row}-${cell.col}`;

			if (highlightedBoxId === boxId) {
				// Second tap - execute trade
				clearHighlightTimeout();
				toast.info(`Executing ${cell.direction} trade...`);
				onTradeRequest({
					id: boxId,
					priceLevel: cell.priceLevel,
					distancePercent:
						(Math.abs(cell.priceLevel - (currentPrice ?? 0)) / (currentPrice ?? 1)) * 100,
					leverage: cell.leverage,
					direction: cell.direction,
				});
			} else {
				// First tap - highlight
				setHighlightedBox(boxId);
				toast.info(`Tap again to confirm ${cell.direction} at ${cell.leverage.toFixed(1)}x`);
			}
		},
		[highlightedBoxId, clearHighlightTimeout, onTradeRequest, setHighlightedBox, currentPrice]
	);

	// Check if a cell has an active bet
	const getCellActiveBet = useCallback(
		(cell: GridCell) => {
			return activeBets.find((bet) => {
				const priceDiff = Math.abs(bet.tpPrice - cell.priceLevel);
				const tolerance = cell.priceLevel * 0.001;
				return priceDiff < tolerance && bet.direction === cell.direction;
			});
		},
		[activeBets]
	);

	if (currentPrice === null) {
		return (
			<div className={cn("flex items-center justify-center h-full", className)}>
				<span className="text-muted-foreground">Loading price data...</span>
			</div>
		);
	}

	return (
		<div className={cn("flex h-full w-full overflow-hidden", className)}>
			{/* Left side: Price Chart (35%) */}
			<div className="w-[35%] h-full relative">
				{/* Price labels on left edge */}
				<div className="absolute left-0 top-0 bottom-0 w-14 flex flex-col z-10">
					{priceLevels.map((price, idx) => (
						<div
							key={idx}
							className={cn(
								"flex-1 flex items-center justify-end pr-1 text-2xs font-mono",
								idx === currentPriceRowIndex
									? "text-terminal-cyan font-bold"
									: idx < currentPriceRowIndex
										? "text-terminal-green/60"
										: "text-terminal-red/60"
							)}
						>
							${formatPrice(price, asset)}
						</div>
					))}
				</div>

				{/* Chart */}
				<div className="absolute left-14 right-0 top-0 bottom-0">
					<PriceChart
						candles={candles}
						currentPrice={currentPrice}
						minPrice={minPrice}
						maxPrice={maxPrice}
					/>
				</div>
			</div>

			{/* Gap with current price indicator */}
			<div className="w-16 h-full relative flex flex-col items-center justify-center border-l border-r border-terminal-cyan/20 bg-terminal-cyan/5">
				{/* Current price badge - positioned at price level */}
				<div
					className="absolute left-1/2 -translate-x-1/2 z-20 px-1.5 py-0.5 bg-terminal-cyan text-background text-2xs font-bold rounded whitespace-nowrap"
					style={{
						top: `${((currentPriceRowIndex + 0.5) / priceLevels.length) * 100}%`,
						transform: "translate(-50%, -50%)",
					}}
				>
					${currentPrice.toLocaleString()}
				</div>

				{/* NOW label at top */}
				<div className="absolute top-1 text-2xs font-mono text-terminal-cyan font-bold">NOW</div>

				{/* Animated line showing price direction */}
				<div className="absolute inset-x-2 top-1/2 h-px bg-terminal-cyan/50">
					<div className="absolute right-0 w-2 h-2 -translate-y-1/2 rounded-full bg-terminal-cyan animate-pulse" />
				</div>
			</div>

			{/* Right side: Trading Grid (remaining space) */}
			<div className="flex-1 h-full flex flex-col">
				{/* Time labels header */}
				<div className="h-5 flex border-b border-muted-foreground/20">
					{timeLabels.map((label, idx) => (
						<div
							key={idx}
							className="flex-1 flex items-center justify-center text-2xs font-mono text-muted-foreground/70"
						>
							{label}
						</div>
					))}
				</div>

				{/* Grid rows */}
				<div className="flex-1 flex flex-col">
					{grid.map((row, rowIndex) => {
						const priceLevel = priceLevels[rowIndex];
						const isLong = priceLevel > currentPrice;
						const isCurrentRow = rowIndex === currentPriceRowIndex;

						return (
							<div
								key={rowIndex}
								className={cn(
									"flex-1 flex border-b",
									isCurrentRow
										? "border-terminal-cyan/50 bg-terminal-cyan/10"
										: "border-muted-foreground/5"
								)}
							>
								{row.map((cell) => {
									const boxId = `${cell.direction}-${cell.row}-${cell.col}`;
									const isHighlighted = highlightedBoxId === boxId;
									const activeBet = getCellActiveBet(cell);
									const hasActiveBet = !!activeBet;

									return (
										<button
											key={cell.col}
											type="button"
											onClick={() => handleCellTap(cell)}
											disabled={!cell.isActive}
											className={cn(
												"flex-1 flex flex-col items-center justify-center",
												"border-r border-muted-foreground/10",
												"font-mono text-2xs transition-all duration-100",
												"relative min-h-0",

												// Current row - not tradeable
												isCurrentRow && "bg-terminal-cyan/5 cursor-not-allowed",

												// Tradeable cells
												!isCurrentRow && [
													"cursor-pointer",
													isLong && "bg-terminal-green/10 hover:bg-terminal-green/25",
													!isLong && "bg-terminal-red/10 hover:bg-terminal-red/25",
												],

												// Has active bet
												hasActiveBet && [
													"border-2 border-dashed border-terminal-amber",
													"bg-terminal-amber/20",
												],

												// Highlighted (first tap)
												isHighlighted && [
													"bg-terminal-cyan/50 hover:bg-terminal-cyan/60",
													"ring-2 ring-terminal-cyan ring-inset",
													"z-10",
												]
											)}
										>
											{/* Leverage */}
											<span
												className={cn(
													"font-bold leading-tight",
													isCurrentRow && "text-muted-foreground/40",
													!isCurrentRow && isLong && "text-terminal-green",
													!isCurrentRow && !isLong && "text-terminal-red",
													isHighlighted && "text-terminal-cyan",
													hasActiveBet && "text-terminal-amber"
												)}
											>
												{cell.leverage.toFixed(1)}x
											</span>

											{/* Bet amount */}
											{cell.isActive && (
												<span
													className={cn(
														"text-3xs leading-tight",
														isLong ? "text-terminal-green/70" : "text-terminal-red/70",
														isHighlighted && "text-terminal-cyan",
														hasActiveBet && "text-terminal-amber"
													)}
												>
													${betAmount}
												</span>
											)}

											{/* Target price on highlight */}
											{isHighlighted && (
												<span className="text-3xs text-terminal-cyan/80 leading-tight">
													→${formatPrice(cell.priceLevel, asset)}
												</span>
											)}
										</button>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
