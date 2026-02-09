import { t } from "@lingui/core/macro";
import { PencilIcon } from "@phosphor-icons/react";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { bpsToPercentage, formatPrice, formatUSD } from "@/lib/format";
import type { MarketKind } from "@/lib/hyperliquid";

interface Props {
	liqPrice: number | null;
	liqWarning: boolean;
	orderValue: number;
	marginRequired: number;
	estimatedFee: number;
	slippagePercent: number;
	szDecimals: number | undefined;
	onSlippageClick: () => void;
	marketKind?: MarketKind;
}

export function OrderSummary({
	liqPrice,
	liqWarning: _liqWarning,
	orderValue,
	marginRequired,
	estimatedFee,
	slippagePercent,
	szDecimals,
	onSlippageClick,
	marketKind = "perp",
}: Props) {
	const isLeveraged = marketKind !== "spot";

	return (
		<div className="divide-y divide-border-200/30 text-2xs tracking-[0.5px]">
			{isLeveraged && (
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-text-500">{t`Liq. Price`}</span>
					<span className="tabular-nums text-market-down-600">
						{liqPrice ? formatPrice(liqPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</div>
			)}
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-text-500">{t`Order Value`}</span>
				<span className="tabular-nums text-text-600">
					{orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			{isLeveraged && (
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-text-500">{t`Margin Req.`}</span>
					<span className="tabular-nums text-text-600">
						{marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</div>
			)}
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-text-500">{t`Slippage`}</span>
				<button
					type="button"
					onClick={onSlippageClick}
					className="flex items-center gap-1 hover:text-text-950 transition-colors"
				>
					<span className="tabular-nums text-market-down-600">{slippagePercent}%</span>
					<PencilIcon className="size-2 text-text-500" />
				</button>
			</div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-text-500">{t`Est. Fee`}</span>
				<span className="tabular-nums text-text-600">
					{estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			{DEFAULT_BUILDER_CONFIG?.f && (
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-text-500">{t`Builder Fee`}</span>
					<span className="tabular-nums text-text-600">{bpsToPercentage(DEFAULT_BUILDER_CONFIG?.f)}%</span>
				</div>
			)}
		</div>
	);
}
