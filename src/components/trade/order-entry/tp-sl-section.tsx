import { t } from "@lingui/core/macro";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QUICK_PERCENT_OPTIONS } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { calculateEstimatedPnl, calculatePercentFromPrice, calculateSlPrice, calculateTpPrice } from "@/lib/trade/tpsl";

interface Props {
	side: "buy" | "sell";
	referencePrice: number;
	size: number;
	szDecimals?: number;
	tpPrice: string;
	slPrice: string;
	onTpPriceChange: (value: string) => void;
	onSlPriceChange: (value: string) => void;
	tpError?: string | null;
	slError?: string | null;
	disabled?: boolean;
}

export function TpSlSection({
	side,
	referencePrice,
	size,
	szDecimals,
	tpPrice,
	slPrice,
	onTpPriceChange,
	onSlPriceChange,
	tpError,
	slError,
	disabled,
}: Props) {
	const tpPriceNum = parseFloat(tpPrice) || 0;
	const slPriceNum = parseFloat(slPrice) || 0;

	const tpPercent = useMemo(() => {
		if (tpPriceNum <= 0 || referencePrice <= 0) return null;
		return calculatePercentFromPrice(referencePrice, tpPriceNum, side, "tp");
	}, [tpPriceNum, referencePrice, side]);

	const slPercent = useMemo(() => {
		if (slPriceNum <= 0 || referencePrice <= 0) return null;
		return calculatePercentFromPrice(referencePrice, slPriceNum, side, "sl");
	}, [slPriceNum, referencePrice, side]);

	const tpPnl = useMemo(() => {
		if (tpPriceNum <= 0 || referencePrice <= 0 || size <= 0) return null;
		return calculateEstimatedPnl({ referencePrice, side, size }, tpPriceNum);
	}, [tpPriceNum, referencePrice, side, size]);

	const slPnl = useMemo(() => {
		if (slPriceNum <= 0 || referencePrice <= 0 || size <= 0) return null;
		return calculateEstimatedPnl({ referencePrice, side, size }, slPriceNum);
	}, [slPriceNum, referencePrice, side, size]);

	function handleTpPercentClick(percent: number) {
		if (referencePrice <= 0) return;
		const price = calculateTpPrice(referencePrice, side, percent);
		const decimals = szDecimalsToPriceDecimals(szDecimals ?? 4);
		onTpPriceChange(price.toFixed(decimals));
	}

	function handleSlPercentClick(percent: number) {
		if (referencePrice <= 0) return;
		const price = calculateSlPrice(referencePrice, side, percent);
		const decimals = szDecimalsToPriceDecimals(szDecimals ?? 4);
		onSlPriceChange(price.toFixed(decimals));
	}

	return (
		<div className="space-y-3 pt-1">
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Take Profit`}</div>
					{tpPercent !== null && (
						<span className="text-4xs tabular-nums text-terminal-green">({tpPercent.toFixed(1)}%)</span>
					)}
				</div>
				<Input
					placeholder={t`TP trigger price`}
					value={tpPrice}
					onChange={(e) => onTpPriceChange(e.target.value)}
					className={cn(
						"h-7 text-xs bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
						tpError && "border-terminal-red focus:border-terminal-red",
					)}
					disabled={disabled}
				/>
				<div className="grid grid-cols-5 gap-1">
					{QUICK_PERCENT_OPTIONS.map((p) => (
						<Button
							key={p}
							onClick={() => handleTpPercentClick(p)}
							variant="outline"
							size="xs"
							disabled={disabled || referencePrice <= 0}
							aria-label={t`Set TP to ${p}%`}
						>
							{p}%
						</Button>
					))}
				</div>
				{tpPnl !== null && (
					<div className="text-3xs text-muted-foreground">
						{t`Est. P&L`}:{" "}
						<span className={cn("tabular-nums", tpPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
							{formatUSD(tpPnl, { signDisplay: "exceptZero" })}
						</span>
					</div>
				)}
				{tpError && <div className="text-4xs text-terminal-red">{tpError}</div>}
			</div>

			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Stop Loss`}</div>
					{slPercent !== null && (
						<span className="text-4xs tabular-nums text-terminal-red">(-{Math.abs(slPercent).toFixed(1)}%)</span>
					)}
				</div>
				<Input
					placeholder={t`SL trigger price`}
					value={slPrice}
					onChange={(e) => onSlPriceChange(e.target.value)}
					className={cn(
						"h-7 text-xs bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
						slError && "border-terminal-red focus:border-terminal-red",
					)}
					disabled={disabled}
				/>
				<div className="grid grid-cols-4 gap-1">
					{QUICK_PERCENT_OPTIONS.map((p) => (
						<Button
							key={p}
							onClick={() => handleSlPercentClick(p)}
							variant="outline"
							size="xs"
							disabled={disabled || referencePrice <= 0}
							aria-label={t`Set SL to ${p}%`}
						>
							{p}%
						</Button>
					))}
				</div>
				{slPnl !== null && (
					<div className="text-3xs text-muted-foreground">
						{t`Est. P&L`}:{" "}
						<span className={cn("tabular-nums", slPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
							{formatUSD(slPnl, { signDisplay: "exceptZero" })}
						</span>
					</div>
				)}
				{slError && <div className="text-4xs text-terminal-red">{slError}</div>}
			</div>
		</div>
	);
}
