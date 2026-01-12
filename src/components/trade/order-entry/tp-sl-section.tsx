import { t } from "@lingui/core/macro";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { SL_QUICK_PERCENT_OPTIONS, TP_QUICK_PERCENT_OPTIONS } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { calc, isPositive, toFixed, toNumber } from "@/lib/trade/numbers";
import { calculateEstimatedPnl, calculateSlPrice, calculateTpPrice, formatRiskRewardRatio } from "@/lib/trade/tpsl";

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
	compact?: boolean;
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
	compact,
}: Props) {
	const tpPriceNum = toNumber(tpPrice);
	const slPriceNum = toNumber(slPrice);

	const tpPnl = useMemo(() => {
		if (!isPositive(tpPriceNum) || !isPositive(referencePrice) || !isPositive(size)) return null;
		return calculateEstimatedPnl({ referencePrice, side, size }, tpPriceNum);
	}, [tpPriceNum, referencePrice, side, size]);

	const slPnl = useMemo(() => {
		if (!isPositive(slPriceNum) || !isPositive(referencePrice) || !isPositive(size)) return null;
		return calculateEstimatedPnl({ referencePrice, side, size }, slPriceNum);
	}, [slPriceNum, referencePrice, side, size]);

	const riskRewardRatio = useMemo(() => {
		if (tpPnl === null || slPnl === null || slPnl >= 0) return null;
		const reward = Math.abs(tpPnl);
		const risk = Math.abs(slPnl);
		return calc.divide(reward, risk);
	}, [tpPnl, slPnl]);

	const riskRewardDisplay = useMemo(() => {
		if (riskRewardRatio === null || tpPnl === null || slPnl === null) return null;
		const rrDisplay = formatRiskRewardRatio(riskRewardRatio);
		if (!rrDisplay) return null;
		return { rrDisplay, tpPnl, slPnl };
	}, [riskRewardRatio, tpPnl, slPnl]);

	function handleTpPercentClick(percent: number) {
		if (!isPositive(referencePrice)) return;
		const price = calculateTpPrice(referencePrice, side, percent);
		if (price === null) return;
		const decimals = szDecimalsToPriceDecimals(szDecimals ?? 4);
		onTpPriceChange(toFixed(price, decimals));
	}

	function handleSlPercentClick(percent: number) {
		if (!isPositive(referencePrice)) return;
		const price = calculateSlPrice(referencePrice, side, percent);
		if (price === null) return;
		const decimals = szDecimalsToPriceDecimals(szDecimals ?? 4);
		onSlPriceChange(toFixed(price, decimals));
	}

	if (compact) {
		return (
			<div className="rounded-md border border-border/50 bg-muted/20 p-2.5">
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1">
						<span className="text-3xs text-muted-foreground">{t`Take Profit`}</span>
						<Input
							placeholder={t`TP Price`}
							value={tpPrice}
							onChange={(e) => onTpPriceChange(e.target.value)}
							className={cn(
								"h-7 text-2xs bg-background tabular-nums",
								tpError && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={disabled}
						/>
						{tpError && <div className="text-4xs text-terminal-red">{tpError}</div>}
					</div>
					<div className="space-y-1">
						<span className="text-3xs text-muted-foreground">{t`Stop Loss`}</span>
						<Input
							placeholder={t`SL Price`}
							value={slPrice}
							onChange={(e) => onSlPriceChange(e.target.value)}
							className={cn(
								"h-7 text-2xs bg-background tabular-nums",
								slError && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={disabled}
						/>
						{slError && <div className="text-4xs text-terminal-red">{slError}</div>}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<span className="text-3xs font-medium uppercase tracking-wide">{t`Take Profit`}</span>
						<TrendingUp className="size-3" />
					</div>
					{tpPnl !== null && (
						<span className={cn("text-3xs tabular-nums", tpPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
							{formatUSD(tpPnl, { signDisplay: "exceptZero" })}
						</span>
					)}
				</div>
				<div
					className={cn(
						"flex items-center rounded-md border bg-background overflow-hidden",
						tpError ? "border-terminal-red" : "border-border/60 focus-within:border-foreground/30",
					)}
				>
					<Input
						placeholder={t`Price`}
						value={tpPrice}
						onChange={(e) => onTpPriceChange(e.target.value)}
						className="h-8 flex-1 text-xs border-0 focus-visible:ring-0 tabular-nums"
						disabled={disabled}
					/>
					<div className="flex items-center gap-0.5 px-1.5 border-l border-border/40">
						{TP_QUICK_PERCENT_OPTIONS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => handleTpPercentClick(p)}
								disabled={disabled || !isPositive(referencePrice)}
								className="px-1.5 py-1 text-4xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-terminal-cyan/20 rounded-xs transition-colors disabled:opacity-50"
								aria-label={t`Set TP to ${p}%`}
							>
								{p}%
							</button>
						))}
					</div>
				</div>
				{tpError && <div className="text-4xs text-terminal-red">{tpError}</div>}
			</div>

			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5 text-muted-foreground">
						<span className="text-3xs font-medium uppercase tracking-wide">{t`Stop Loss`}</span>
						<TrendingDown className="size-3" />
					</div>
					{slPnl !== null && (
						<span className={cn("text-3xs tabular-nums", slPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
							{formatUSD(slPnl, { signDisplay: "exceptZero" })}
						</span>
					)}
				</div>
				<div
					className={cn(
						"flex items-center rounded-md border bg-background overflow-hidden",
						slError ? "border-terminal-red" : "border-border/60 focus-within:border-foreground/30",
					)}
				>
					<Input
						placeholder={t`Price`}
						value={slPrice}
						onChange={(e) => onSlPriceChange(e.target.value)}
						className="h-8 flex-1 text-xs border-0 focus-visible:ring-0 tabular-nums"
						disabled={disabled}
					/>
					<div className="flex items-center gap-1 px-1.5 border-l border-border/40">
						{SL_QUICK_PERCENT_OPTIONS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => handleSlPercentClick(p)}
								disabled={disabled || !isPositive(referencePrice)}
								className="px-1.5 py-1 text-4xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-terminal-cyan/20 rounded-xs transition-colors disabled:opacity-50"
								aria-label={t`Set SL to ${p}%`}
							>
								{p}%
							</button>
						))}
					</div>
				</div>
				{slError && <div className="text-4xs text-terminal-red">{slError}</div>}
			</div>

			{riskRewardDisplay && (
				<div className="rounded-md border border-border/40 bg-muted/20 p-2.5 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-3xs text-muted-foreground">{t`Risk/Reward`}</span>
						<span
							className={cn(
								"text-3xs font-semibold tabular-nums",
								riskRewardDisplay.rrDisplay.isFavorable ? "text-terminal-green" : "text-terminal-amber",
							)}
						>
							{riskRewardDisplay.rrDisplay.label}
						</span>
					</div>
					<div className="flex h-1.5 rounded-full overflow-hidden bg-muted/50">
						<div
							className="bg-terminal-red"
							style={{
								width: `${(riskRewardDisplay.rrDisplay.risk / (riskRewardDisplay.rrDisplay.risk + riskRewardDisplay.rrDisplay.reward)) * 100}%`,
							}}
						/>
						<div
							className="bg-terminal-green"
							style={{
								width: `${(riskRewardDisplay.rrDisplay.reward / (riskRewardDisplay.rrDisplay.risk + riskRewardDisplay.rrDisplay.reward)) * 100}%`,
							}}
						/>
					</div>
					<div className="flex items-center justify-between text-3xs">
						<span className="tabular-nums text-terminal-red">
							{formatUSD(riskRewardDisplay.slPnl, { signDisplay: "exceptZero" })}
						</span>
						<span className="tabular-nums text-terminal-green">
							{formatUSD(riskRewardDisplay.tpPnl, { signDisplay: "exceptZero" })}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
