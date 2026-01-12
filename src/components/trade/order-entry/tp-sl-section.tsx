import { t } from "@lingui/core/macro";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SL_QUICK_PERCENT_OPTIONS, TP_QUICK_PERCENT_OPTIONS } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import {
	calculateEstimatedPnl,
	calculatePercentFromPrice,
	calculateSlPrice,
	calculateTpPrice,
	formatRiskRewardRatio,
} from "@/lib/trade/tpsl";

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
	const [customTpPercent, setCustomTpPercent] = useState("");
	const [customSlPercent, setCustomSlPercent] = useState("");

	const tpPriceNum = parseFloat(tpPrice) || 0;
	const slPriceNum = parseFloat(slPrice) || 0;

	const tpPercentFromPrice = useMemo(() => {
		if (tpPriceNum <= 0 || referencePrice <= 0) return null;
		return calculatePercentFromPrice(referencePrice, tpPriceNum, side, "tp");
	}, [tpPriceNum, referencePrice, side]);

	const slPercentFromPrice = useMemo(() => {
		if (slPriceNum <= 0 || referencePrice <= 0) return null;
		return calculatePercentFromPrice(referencePrice, slPriceNum, side, "sl");
	}, [slPriceNum, referencePrice, side]);

	const customTpPercentNum = parseFloat(customTpPercent) || null;
	const customSlPercentNum = parseFloat(customSlPercent) || null;

	const tpPercent = customTpPercentNum ?? tpPercentFromPrice;
	const slPercent = customSlPercentNum ?? slPercentFromPrice;

	const customTpPricePreview = useMemo(() => {
		const percent = parseFloat(customTpPercent);
		if (percent > 0 && referencePrice > 0) {
			return calculateTpPrice(referencePrice, side, percent);
		}
		return null;
	}, [customTpPercent, referencePrice, side]);

	const customSlPricePreview = useMemo(() => {
		const percent = parseFloat(customSlPercent);
		if (percent > 0 && referencePrice > 0) {
			return calculateSlPrice(referencePrice, side, percent);
		}
		return null;
	}, [customSlPercent, referencePrice, side]);

	const effectiveTpPrice = customTpPricePreview ?? tpPriceNum;
	const effectiveSlPrice = customSlPricePreview ?? slPriceNum;

	const tpPnl = useMemo(() => {
		if (effectiveTpPrice <= 0 || referencePrice <= 0 || size <= 0) return null;
		return calculateEstimatedPnl({ referencePrice, side, size }, effectiveTpPrice);
	}, [effectiveTpPrice, referencePrice, side, size]);

	const slPnl = useMemo(() => {
		if (effectiveSlPrice <= 0 || referencePrice <= 0 || size <= 0) return null;
		return calculateEstimatedPnl({ referencePrice, side, size }, effectiveSlPrice);
	}, [effectiveSlPrice, referencePrice, side, size]);

	const riskRewardRatio = useMemo(() => {
		if (tpPnl === null || slPnl === null || slPnl >= 0) return null;
		const reward = Math.abs(tpPnl);
		const risk = Math.abs(slPnl);
		if (risk === 0) return null;
		return reward / risk;
	}, [tpPnl, slPnl]);

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

	function handleCustomTpPercentSubmit() {
		const percent = parseFloat(customTpPercent);
		if (percent > 0 && referencePrice > 0) {
			handleTpPercentClick(percent);
			setCustomTpPercent("");
		}
	}

	function handleCustomSlPercentSubmit() {
		const percent = parseFloat(customSlPercent);
		if (percent > 0 && referencePrice > 0) {
			handleSlPercentClick(percent);
			setCustomSlPercent("");
		}
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 text-terminal-green">
						<TrendingUp className="size-3.5" />
						<span className="text-2xs font-medium uppercase tracking-wide">{t`Take Profit`}</span>
					</div>
					{tpPercent !== null && (
						<span className="text-3xs tabular-nums text-terminal-green/80 ml-auto">+{tpPercent.toFixed(1)}%</span>
					)}
				</div>
				<div className="rounded-md border border-terminal-green/20 bg-terminal-green/5 p-2.5 space-y-2">
					<Input
						placeholder={t`TP trigger price`}
						value={tpPrice}
						onChange={(e) => onTpPriceChange(e.target.value)}
						className={cn(
							"h-8 text-xs bg-background border-border/60 focus:border-terminal-green/60 tabular-nums",
							tpError && "border-terminal-red focus:border-terminal-red",
						)}
						disabled={disabled}
					/>
					<div className="flex gap-1">
						{TP_QUICK_PERCENT_OPTIONS.map((p) => (
							<Button
								key={p}
								onClick={() => handleTpPercentClick(p)}
								variant="outline"
								size="xs"
								className="flex-1 text-3xs h-6"
								disabled={disabled || referencePrice <= 0}
								aria-label={t`Set TP to ${p}%`}
							>
								{p}%
							</Button>
						))}
						<Input
							placeholder="100%"
							value={customTpPercent}
							onChange={(e) => setCustomTpPercent(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleCustomTpPercentSubmit()}
							onBlur={handleCustomTpPercentSubmit}
							className="flex-1 h-6 min-w-0 text-3xs px-1.5 text-center bg-background border-border/60 tabular-nums"
							disabled={disabled || referencePrice <= 0}
							aria-label={t`Custom TP percentage`}
						/>
					</div>
					{tpPnl !== null && (
						<div className="flex items-center justify-between text-3xs pt-0.5">
							<span className="text-muted-foreground">{t`Est. P&L`}</span>
							<span className={cn("tabular-nums font-medium", tpPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
								{formatUSD(tpPnl, { signDisplay: "exceptZero" })}
							</span>
						</div>
					)}
				</div>
				{tpError && <div className="text-3xs text-terminal-red px-1">{tpError}</div>}
			</div>

			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 text-terminal-red">
						<TrendingDown className="size-3.5" />
						<span className="text-2xs font-medium uppercase tracking-wide">{t`Stop Loss`}</span>
					</div>
					{slPercent !== null && (
						<span className="text-3xs tabular-nums text-terminal-red/80 ml-auto">-{Math.abs(slPercent).toFixed(1)}%</span>
					)}
				</div>
				<div className="rounded-md border border-terminal-red/20 bg-terminal-red/5 p-2.5 space-y-2">
					<Input
						placeholder={t`SL trigger price`}
						value={slPrice}
						onChange={(e) => onSlPriceChange(e.target.value)}
						className={cn(
							"h-8 text-xs bg-background border-border/60 focus:border-terminal-red/60 tabular-nums",
							slError && "border-terminal-red focus:border-terminal-red",
						)}
						disabled={disabled}
					/>
					<div className="flex gap-1">
						{SL_QUICK_PERCENT_OPTIONS.map((p) => (
							<Button
								key={p}
								onClick={() => handleSlPercentClick(p)}
								variant="outline"
								size="xs"
								className="flex-1 text-3xs h-6"
								disabled={disabled || referencePrice <= 0}
								aria-label={t`Set SL to ${p}%`}
							>
								{p}%
							</Button>
						))}
						<Input
							placeholder="50%"
							value={customSlPercent}
							onChange={(e) => setCustomSlPercent(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleCustomSlPercentSubmit()}
							onBlur={handleCustomSlPercentSubmit}
							className="flex-1 h-6 min-w-0 text-3xs px-1.5 text-center bg-background border-border/60 tabular-nums"
							disabled={disabled || referencePrice <= 0}
							aria-label={t`Custom SL percentage`}
						/>
					</div>
					{slPnl !== null && (
						<div className="flex items-center justify-between text-3xs pt-0.5">
							<span className="text-muted-foreground">{t`Est. P&L`}</span>
							<span className={cn("tabular-nums font-medium", slPnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
								{formatUSD(slPnl, { signDisplay: "exceptZero" })}
							</span>
						</div>
					)}
				</div>
				{slError && <div className="text-3xs text-terminal-red px-1">{slError}</div>}
			</div>

			{riskRewardRatio !== null && tpPnl !== null && slPnl !== null && (() => {
				const rrDisplay = formatRiskRewardRatio(riskRewardRatio);
				if (!rrDisplay) return null;
				return (
					<div className="rounded-md border border-border/40 bg-muted/20 p-2.5 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-2xs text-muted-foreground">{t`Risk/Reward`}</span>
							<span
								className={cn(
									"text-2xs font-semibold tabular-nums",
									rrDisplay.isFavorable ? "text-terminal-green" : "text-terminal-amber",
								)}
							>
								{rrDisplay.label}
							</span>
						</div>
						<div className="flex h-1.5 rounded-full overflow-hidden bg-muted/50">
							<div
								className="bg-terminal-red"
								style={{ width: `${(rrDisplay.risk / (rrDisplay.risk + rrDisplay.reward)) * 100}%` }}
							/>
							<div
								className="bg-terminal-green"
								style={{ width: `${(rrDisplay.reward / (rrDisplay.risk + rrDisplay.reward)) * 100}%` }}
							/>
						</div>
						<div className="flex items-center justify-between text-3xs">
							<span className="tabular-nums text-terminal-red">{formatUSD(slPnl, { signDisplay: "exceptZero" })}</span>
							<span className="tabular-nums text-terminal-green">{formatUSD(tpPnl, { signDisplay: "exceptZero" })}</span>
						</div>
					</div>
				);
			})()}
		</div>
	);
}
