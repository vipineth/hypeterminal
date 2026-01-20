import { t } from "@lingui/core/macro";
import { PencilIcon } from "lucide-react";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatPrice, formatUSD } from "@/lib/format";
import { calc, toFixed } from "@/lib/trade/numbers";

interface Props {
	liqPrice: number | null;
	liqWarning: boolean;
	orderValue: number;
	marginRequired: number;
	estimatedFee: number;
	slippageBps: number;
	szDecimals: number | undefined;
	onSlippageClick: () => void;
}

export function OrderSummary({
	liqPrice,
	liqWarning,
	orderValue,
	marginRequired,
	estimatedFee,
	slippageBps,
	szDecimals,
	onSlippageClick,
}: Props) {
	return (
		<div className="border border-border/40 divide-y divide-border/40 text-3xs">
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Liq. Price`}</span>
				<span className={cn("tabular-nums", liqWarning ? "text-negative" : "text-negative/70")}>
					{liqPrice ? formatPrice(liqPrice, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Order Value`}</span>
				<span className="tabular-nums">{orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}</span>
			</div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Margin Req.`}</span>
				<span className="tabular-nums">{marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}</span>
			</div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Slippage`}</span>
				<button
					type="button"
					onClick={onSlippageClick}
					className="flex items-center gap-1 hover:text-fg transition-colors"
				>
					<span className="tabular-nums text-warning">{toFixed(calc.divide(slippageBps, 100), 2)}%</span>
					<PencilIcon className="size-2 text-muted-fg" />
				</button>
			</div>
			<div className="flex items-center justify-between px-2 py-1.5">
				<span className="text-muted-fg">{t`Est. Fee`}</span>
				<span className="tabular-nums text-muted-fg">
					{estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</div>
		</div>
	);
}
