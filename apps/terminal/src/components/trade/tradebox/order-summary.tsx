import { t } from "@lingui/core/macro";
import { PencilIcon } from "@phosphor-icons/react";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import type { OrderType } from "@/config/trade";
import { cn } from "@/lib/cn";
import { bpsToPercentage, formatPrice, formatUSD } from "@/lib/format";
import type { MarketKind } from "@/lib/hyperliquid";
import { isMarketExecutionOrderType } from "@/lib/trade/order-types";

interface Props {
	liqPrice: number | null;
	liqWarning: boolean;
	orderValue: number;
	marginRequired: number;
	estimatedFee: number;
	feeRatePercent: string;
	slippagePercent: number;
	szDecimals: number | undefined;
	onSlippageClick: () => void;
	orderType: OrderType;
	marketKind?: MarketKind;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<span className="text-xs tracking-[0.5px] text-fg-muted">{label}</span>
			<span className="text-xs tabular-nums text-fg">{children}</span>
		</div>
	);
}

export function OrderSummary({
	liqPrice,
	liqWarning,
	orderValue,
	marginRequired,
	estimatedFee,
	feeRatePercent,
	slippagePercent,
	szDecimals,
	onSlippageClick,
	orderType,
	marketKind = "perp",
}: Props) {
	const isLeveraged = marketKind !== "spot";
	const showSlippage = isMarketExecutionOrderType(orderType);

	return (
		<div className="flex flex-col">
			{isLeveraged && (
				<SummaryRow label={t`Liq. Price`}>
					<span className={cn(liqPrice ? (liqWarning ? "text-error" : "text-fg") : "text-fg-muted")}>
						{liqPrice ? formatPrice(liqPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</SummaryRow>
			)}
			<SummaryRow label={t`Order Value`}>
				<span className={orderValue > 0 ? "text-fg" : "text-fg-muted"}>
					{orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</SummaryRow>
			{isLeveraged && (
				<SummaryRow label={t`Margin Req.`}>
					<span className={marginRequired > 0 ? "text-fg" : "text-fg-muted"}>
						{marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</SummaryRow>
			)}
			{showSlippage && (
				<SummaryRow label={t`Slippage`}>
					<button
						type="button"
						onClick={onSlippageClick}
						className="inline-flex cursor-pointer items-center gap-1 hover:opacity-80"
					>
						<span className="tabular-nums text-error">{slippagePercent}%</span>
						<PencilIcon className="size-2.5 text-fg-muted" />
					</button>
				</SummaryRow>
			)}
			<SummaryRow label={t`Est. Fee`}>
				<span className="text-fg-muted">
					{orderValue > 0 ? `${feeRatePercent} (${formatUSD(estimatedFee)})` : feeRatePercent}
				</span>
			</SummaryRow>
			{!!DEFAULT_BUILDER_CONFIG?.f && (
				<SummaryRow label={t`Builder Fee`}>
					<span className="text-fg-muted">{`${bpsToPercentage(DEFAULT_BUILDER_CONFIG?.f)}%`}</span>
				</SummaryRow>
			)}
		</div>
	);
}
