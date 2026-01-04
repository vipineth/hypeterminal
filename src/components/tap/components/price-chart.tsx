import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CandlePoint } from "../hooks/use-candle-history";

interface PriceChartProps {
	candles?: CandlePoint[];
	currentPrice: number;
	minPrice?: number;
	maxPrice?: number;
	className?: string;
}

export function PriceChart({
	candles,
	currentPrice,
	minPrice: propMinPrice,
	maxPrice: propMaxPrice,
	className,
}: PriceChartProps) {
	const patternId = useId();

	// Calculate chart data from candles
	const chartData = useMemo(() => {
		if (!candles || candles.length < 2) {
			return null;
		}

		// Use provided min/max or calculate from data
		const allPrices = candles.flatMap((c) => [c.high, c.low]);
		allPrices.push(currentPrice);

		const dataMin = Math.min(...allPrices);
		const dataMax = Math.max(...allPrices);

		const minPrice = propMinPrice ?? dataMin;
		const maxPrice = propMaxPrice ?? dataMax;
		const priceRange = maxPrice - minPrice || 1;

		// Normalize price to Y position (0-100, inverted)
		const priceToY = (price: number) => ((maxPrice - price) / priceRange) * 100;

		// Take last N candles to show
		const displayCandles = candles.slice(-30);
		const candleWidth = 100 / (displayCandles.length + 2); // +2 for some padding and current price area

		// Generate candle data
		const candleData = displayCandles.map((candle, idx) => {
			const x = idx * candleWidth + candleWidth / 2;
			const isGreen = candle.close >= candle.open;

			return {
				x,
				width: candleWidth * 0.6,
				wickTop: priceToY(candle.high),
				wickBottom: priceToY(candle.low),
				bodyTop: priceToY(Math.max(candle.open, candle.close)),
				bodyBottom: priceToY(Math.min(candle.open, candle.close)),
				isGreen,
			};
		});

		// Current price line position
		const currentPriceY = priceToY(currentPrice);

		// Line connecting closes for trend visualization
		const closePrices = displayCandles.map((c, idx) => ({
			x: idx * candleWidth + candleWidth / 2,
			y: priceToY(c.close),
		}));
		// Add current price as the last point (extending to the right edge)
		closePrices.push({ x: 100, y: currentPriceY });

		const linePoints = closePrices.map((p) => `${p.x},${p.y}`).join(" ");

		return {
			candleData,
			currentPriceY,
			linePoints,
			minPrice,
			maxPrice,
		};
	}, [candles, currentPrice, propMinPrice, propMaxPrice]);

	return (
		<div className={cn("relative w-full h-full bg-background", className)}>
			<svg
				className="absolute inset-0 w-full h-full"
				viewBox="0 0 100 100"
				preserveAspectRatio="none"
				role="img"
				aria-label="Price chart"
			>
				<title>Price chart with candlesticks</title>

				{/* Grid pattern */}
				<defs>
					<pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse">
						<circle cx="5" cy="5" r="0.2" className="fill-muted-foreground/15" />
					</pattern>
				</defs>
				<rect width="100" height="100" fill={`url(#${patternId})`} />

				{chartData && (
					<>
						{/* Gradient fill under the line */}
						<defs>
							<linearGradient id={`${patternId}-gradient`} x1="0" x2="0" y1="0" y2="1">
								<stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.1" />
								<stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
							</linearGradient>
						</defs>
						<polygon
							points={`0,100 ${chartData.linePoints} 100,100`}
							fill={`url(#${patternId}-gradient)`}
						/>

						{/* Price trend line */}
						<polyline
							points={chartData.linePoints}
							fill="none"
							className="stroke-terminal-cyan/40"
							strokeWidth="0.2"
							vectorEffect="non-scaling-stroke"
							strokeLinejoin="round"
						/>

						{/* Candlesticks */}
						{chartData.candleData.map((candle, idx) => (
							<g key={idx}>
								{/* Wick */}
								<line
									x1={candle.x}
									y1={candle.wickTop}
									x2={candle.x}
									y2={candle.wickBottom}
									className={candle.isGreen ? "stroke-terminal-green/70" : "stroke-terminal-red/70"}
									strokeWidth="0.15"
									vectorEffect="non-scaling-stroke"
								/>
								{/* Body */}
								<rect
									x={candle.x - candle.width / 2}
									y={candle.bodyTop}
									width={candle.width}
									height={Math.max(0.5, candle.bodyBottom - candle.bodyTop)}
									className={candle.isGreen ? "fill-terminal-green" : "fill-terminal-red"}
									rx="0.2"
								/>
							</g>
						))}

						{/* Current price horizontal line extending to right */}
						<line
							x1="0"
							y1={chartData.currentPriceY}
							x2="100"
							y2={chartData.currentPriceY}
							className="stroke-terminal-cyan"
							strokeWidth="0.2"
							strokeDasharray="1,1"
							vectorEffect="non-scaling-stroke"
						/>

						{/* Animated current price dot at the right edge */}
						<circle cx="98" cy={chartData.currentPriceY} r="1" className="fill-terminal-cyan">
							<animate attributeName="r" values="0.8;1.2;0.8" dur="1s" repeatCount="indefinite" />
						</circle>
						<circle cx="98" cy={chartData.currentPriceY} r="2" className="fill-terminal-cyan/20">
							<animate attributeName="r" values="1.5;2.5;1.5" dur="1s" repeatCount="indefinite" />
						</circle>

						{/* Arrow indicating price moving forward */}
						<path
							d={`M 96 ${chartData.currentPriceY} L 100 ${chartData.currentPriceY}`}
							className="stroke-terminal-cyan"
							strokeWidth="0.3"
							vectorEffect="non-scaling-stroke"
							markerEnd={`url(#${patternId}-arrow)`}
						/>
						<defs>
							<marker
								id={`${patternId}-arrow`}
								markerWidth="4"
								markerHeight="4"
								refX="2"
								refY="2"
								orient="auto"
							>
								<path d="M0,0 L0,4 L4,2 Z" className="fill-terminal-cyan" />
							</marker>
						</defs>
					</>
				)}
			</svg>

			{/* Loading state */}
			{!chartData && (
				<div className="absolute inset-0 flex items-center justify-center">
					<span className="text-sm text-muted-foreground">Loading chart...</span>
				</div>
			)}
		</div>
	);
}
