import { t } from "@lingui/core/macro";
import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { SL_QUICK_PERCENT_OPTIONS, TP_QUICK_PERCENT_OPTIONS } from "@/config/constants";
import { getRiskRewardRatio } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { isPositive, toNumber } from "@/lib/trade/numbers";
import { calculateEstimatedPnl, calculateSlPrice, calculateTpPrice, formatRiskRewardRatio } from "@/lib/trade/tpsl";
import { PriceInputWithPercent } from "./price-input-with-percent";

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

	const riskRewardRatio = useMemo(() => getRiskRewardRatio(tpPnl, slPnl), [tpPnl, slPnl]);

	const riskRewardDisplay = useMemo(() => {
		if (riskRewardRatio === null || tpPnl === null || slPnl === null) return null;
		const rrDisplay = formatRiskRewardRatio(riskRewardRatio);
		if (!rrDisplay) return null;
		return { rrDisplay, tpPnl, slPnl };
	}, [riskRewardRatio, tpPnl, slPnl]);

	const priceDecimals = szDecimalsToPriceDecimals(szDecimals ?? 4);

	function handleTpPercentClick(percent: number) {
		const price = calculateTpPrice(referencePrice, side, percent, priceDecimals);
		if (price) onTpPriceChange(price);
	}

	function handleSlPercentClick(percent: number) {
		const price = calculateSlPrice(referencePrice, side, percent, priceDecimals);
		if (price) onSlPriceChange(price);
	}

	if (compact) {
		return (
			<div className="rounded-xs border border-border-200/50 bg-surface-analysis p-2.5">
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1">
						<span className="text-3xs text-text-950">{t`Take Profit`}</span>
						<Input
							placeholder={t`TP Price`}
							value={tpPrice}
							onChange={(e) => onTpPriceChange(e.target.value)}
							className={cn(
								"text-2xs bg-surface-base tabular-nums",
								tpError && "border-market-down-600 focus:border-market-down-600",
							)}
							disabled={disabled}
						/>
						{tpError && <div className="text-4xs text-market-down-600">{tpError}</div>}
					</div>
					<div className="space-y-1">
						<span className="text-3xs text-text-950">{t`Stop Loss`}</span>
						<Input
							placeholder={t`SL Price`}
							value={slPrice}
							onChange={(e) => onSlPriceChange(e.target.value)}
							className={cn(
								"text-2xs bg-surface-base tabular-nums",
								slError && "border-market-down-600 focus:border-market-down-600",
							)}
							disabled={disabled}
						/>
						{slError && <div className="text-4xs text-market-down-600">{slError}</div>}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<PriceInputWithPercent
				label={t`Take Profit`}
				icon={TrendUpIcon}
				value={tpPrice}
				onChange={onTpPriceChange}
				percentOptions={TP_QUICK_PERCENT_OPTIONS}
				onPercentClick={handleTpPercentClick}
				pnlValue={tpPnl}
				error={tpError}
				disabled={disabled}
				referencePrice={referencePrice}
			/>

			<PriceInputWithPercent
				label={t`Stop Loss`}
				icon={TrendDownIcon}
				value={slPrice}
				onChange={onSlPriceChange}
				percentOptions={SL_QUICK_PERCENT_OPTIONS}
				onPercentClick={handleSlPercentClick}
				pnlValue={slPnl}
				error={slError}
				disabled={disabled}
				referencePrice={referencePrice}
			/>

			{riskRewardDisplay && (
				<div className="rounded-xs border border-border-200/40 bg-surface-analysis p-2.5 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-3xs text-text-950">{t`Risk/Reward`}</span>
						<span
							className={cn(
								"text-3xs font-semibold tabular-nums",
								riskRewardDisplay.rrDisplay.isFavorable ? "text-market-up-600" : "text-warning-700",
							)}
						>
							{riskRewardDisplay.rrDisplay.label}
						</span>
					</div>
					<div className="flex h-1.5 rounded-full overflow-hidden bg-surface-analysis">
						<div
							className="bg-market-down-600"
							style={{
								width: `${(riskRewardDisplay.rrDisplay.risk / (riskRewardDisplay.rrDisplay.risk + riskRewardDisplay.rrDisplay.reward)) * 100}%`,
							}}
						/>
						<div
							className="bg-market-up-600"
							style={{
								width: `${(riskRewardDisplay.rrDisplay.reward / (riskRewardDisplay.rrDisplay.risk + riskRewardDisplay.rrDisplay.reward)) * 100}%`,
							}}
						/>
					</div>
					<div className="flex items-center justify-between text-3xs">
						<span className="tabular-nums text-market-down-600">
							{formatUSD(riskRewardDisplay.slPnl, { signDisplay: "exceptZero" })}
						</span>
						<span className="tabular-nums text-market-up-600">
							{formatUSD(riskRewardDisplay.tpPnl, { signDisplay: "exceptZero" })}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
