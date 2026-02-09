import { t } from "@lingui/core/macro";
import { PencilIcon } from "@phosphor-icons/react";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
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
		<InfoRowGroup className="divide-border-200/30">
			{isLeveraged && (
				<InfoRow
					label={t`Liq. Price`}
					value={liqPrice ? formatPrice(liqPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
					valueClassName="text-market-down-600"
				/>
			)}
			<InfoRow
				label={t`Order Value`}
				value={orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}
				valueClassName="text-text-600"
			/>
			{isLeveraged && (
				<InfoRow
					label={t`Margin Req.`}
					value={marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
					valueClassName="text-text-600"
				/>
			)}
			<InfoRow
				label={t`Slippage`}
				value={
					<button
						type="button"
						onClick={onSlippageClick}
						className="flex items-center gap-1 hover:text-text-950 transition-colors"
					>
						<span className="tabular-nums text-market-down-600">{slippagePercent}%</span>
						<PencilIcon className="size-2 text-text-600" />
					</button>
				}
			/>
			<InfoRow
				label={t`Est. Fee`}
				value={estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
				valueClassName="text-text-600"
			/>
			{DEFAULT_BUILDER_CONFIG?.f && (
				<InfoRow
					label={t`Builder Fee`}
					value={`${bpsToPercentage(DEFAULT_BUILDER_CONFIG?.f)}%`}
					valueClassName="text-text-600"
				/>
			)}
		</InfoRowGroup>
	);
}
