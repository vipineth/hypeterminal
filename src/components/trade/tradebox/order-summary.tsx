import { t } from "@lingui/core/macro";
import { PencilIcon } from "@phosphor-icons/react";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { cn } from "@/lib/cn";
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
	liqWarning,
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
		<div className="border border-border/40 divide-y divide-border/40 text-3xs">
			{isLeveraged && (
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-muted-fg">{t`Liq. Price`}</span>
					<span className={cn("tabular-nums", liqWarning ? "text-negative" : "text-negative/70")}>
						{liqPrice ? formatPrice(liqPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</div>
			)}
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Order Value`}</span>
				<span className="tabular-nums">{orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}</span>
			</div>
			{isLeveraged && (
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-muted-fg">{t`Margin Req.`}</span>
					<span className="tabular-nums">
						{marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
					</span>
				</div>
			)}
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Slippage`}</span>
				<button
					type="button"
					onClick={onSlippageClick}
					className="flex items-center gap-1 hover:text-fg transition-colors"
				>
					<span className="tabular-nums text-warning">{slippagePercent}%</span>
					<PencilIcon className="size-2 text-muted-fg" />
				</button>
			</div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Est. Fee`}</span>
				<span className="tabular-nums text-muted-fg">
					{estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			{DEFAULT_BUILDER_CONFIG?.f && (
				<div className="flex items-center justify-between px-2 py-1.5">
					<span className="text-muted-fg">{t`Builder Fee`}</span>
					<span className="tabular-nums text-muted-fg">{bpsToPercentage(DEFAULT_BUILDER_CONFIG?.f)}%</span>
				</div>
			)}
		</div>
	);
}
