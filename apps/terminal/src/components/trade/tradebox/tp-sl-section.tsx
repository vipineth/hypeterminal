import { t } from "@lingui/core/macro";
import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useMemo } from "react";
import { NumberInput } from "@/components/ui/number-input";
import { SL_QUICK_PERCENT_OPTIONS, TP_QUICK_PERCENT_OPTIONS } from "@/config/trade";
import { getRiskRewardRatio } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatUSD } from "@/lib/format";
import { isPositive, toNumber } from "@/lib/trade/numbers";
import { calculateEstimatedPnl, calculateSlPrice, calculateTpPrice, formatRiskRewardRatio } from "@/lib/trade/tpsl";
import { PriceInputWithPercent } from "./price-input-with-percent";

interface Props {
	side: "buy" | "sell";
	referencePrice: number;
	size: number;
	priceDecimals?: number;
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
	priceDecimals = 2,
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
			<div className="rounded-8 border border-stroke-weak/50 bg-surface p-2.5">
				<div className="grid grid-cols-2 gap-2">
					<div>
						<NumberInput
							label={t`Take Profit`}
							placeholder={t`TP Price`}
							value={tpPrice}
							onChange={(e) => onTpPriceChange(e.target.value)}
							className={cn(
								"text-xs bg-background tabular-nums",
								!!tpError && "border-stroke-error-strong focus:border-stroke-error-strong",
							)}
							disabled={disabled}
						/>
						{tpError && <div className="text-xs text-error mt-1">{tpError}</div>}
					</div>
					<div>
						<NumberInput
							label={t`Stop Loss`}
							placeholder={t`SL Price`}
							value={slPrice}
							onChange={(e) => onSlPriceChange(e.target.value)}
							className={cn(
								"text-xs bg-background tabular-nums",
								!!slError && "border-stroke-error-strong focus:border-stroke-error-strong",
							)}
							disabled={disabled}
						/>
						{slError && <div className="text-xs text-error mt-1">{slError}</div>}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 py-1">
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
				<div className="rounded-8 border border-stroke-weak/40 bg-surface p-2.5 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs text-fg">{t`Risk/Reward`}</span>
						<span
							className={cn(
								"text-xs font-semibold tabular-nums",
								riskRewardDisplay.rrDisplay.isFavorable ? "text-success" : "text-warning",
							)}
						>
							{riskRewardDisplay.rrDisplay.label}
						</span>
					</div>
					<div className="flex h-1.5 rounded-full overflow-hidden bg-surface">
						<div
							className="bg-error"
							style={{
								width: `${(riskRewardDisplay.rrDisplay.risk / (riskRewardDisplay.rrDisplay.risk + riskRewardDisplay.rrDisplay.reward)) * 100}%`,
							}}
						/>
						<div
							className="bg-success-soft"
							style={{
								width: `${(riskRewardDisplay.rrDisplay.reward / (riskRewardDisplay.rrDisplay.risk + riskRewardDisplay.rrDisplay.reward)) * 100}%`,
							}}
						/>
					</div>
					<div className="flex items-center justify-between text-xs">
						<span className="tabular-nums text-error">
							{formatUSD(riskRewardDisplay.slPnl, { signDisplay: "exceptZero" })}
						</span>
						<span className="tabular-nums text-success">
							{formatUSD(riskRewardDisplay.tpPnl, { signDisplay: "exceptZero" })}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
