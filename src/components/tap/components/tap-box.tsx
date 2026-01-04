import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BOX_STYLES } from "../constants";
import { useTapTradeBoxState, useTapTradeSettings } from "../hooks/use-tap-trade-store";
import { formatPrice } from "../lib/calculations";
import type { BoxState, TapBox as TapBoxType } from "../types";

interface TapBoxProps {
	box: TapBoxType;
	onTap: (box: TapBoxType) => void;
	onDoubleTap: (box: TapBoxType) => void;
	isHighlighted?: boolean;
}

export function TapBox({ box, onTap, onDoubleTap, isHighlighted = false }: TapBoxProps) {
	const { asset } = useTapTradeSettings();
	const { activeBets } = useTapTradeBoxState();

	// Determine box state
	const boxState = useMemo((): BoxState => {
		// Check if this box has an active bet
		const activeBet = activeBets.find((bet) => {
			const priceDiff = Math.abs(bet.tpPrice - box.priceLevel);
			const tolerance = box.priceLevel * 0.001; // 0.1% tolerance
			return priceDiff < tolerance && bet.direction === box.direction;
		});

		if (activeBet) return "active";
		if (isHighlighted) return "highlighted";
		return "available";
	}, [isHighlighted, activeBets, box]);

	// Get style classes based on state
	const styleClasses = useMemo(() => {
		const directionStyles = BOX_STYLES[box.direction];
		return directionStyles[boxState];
	}, [box.direction, boxState]);

	// Handle tap
	const handleClick = useCallback(() => {
		if (boxState === "active") {
			// TODO: Show cash out confirmation
			return;
		}

		if (boxState === "highlighted") {
			// Second tap - execute trade
			onDoubleTap(box);
		} else {
			// First tap - highlight
			onTap(box);
		}
	}, [boxState, box, onTap, onDoubleTap]);

	// Get active bet duration if applicable
	const activeBet = activeBets.find((bet) => {
		const priceDiff = Math.abs(bet.tpPrice - box.priceLevel);
		const tolerance = box.priceLevel * 0.001;
		return priceDiff < tolerance && bet.direction === box.direction;
	});

	const duration = activeBet ? Math.floor((Date.now() - activeBet.startTime) / 1000) : null;

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				"relative flex flex-col items-center justify-center",
				"w-24 h-10 border rounded",
				"font-mono transition-all duration-200",
				"cursor-pointer select-none backdrop-blur-sm",
				styleClasses
			)}
		>
			{/* Main content row */}
			<div className="flex items-center gap-1.5">
				<span className="font-bold text-sm">{box.leverage}x</span>
				{boxState === "active" && duration !== null ? (
					<span className="text-2xs opacity-80">{duration}s</span>
				) : (
					<span className="text-2xs opacity-70">${formatPrice(box.priceLevel, asset)}</span>
				)}
			</div>
		</button>
	);
}
