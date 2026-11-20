import { t } from "@lingui/core/macro";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import type { OrderType } from "@/config/trade";
import { DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT } from "@/config/trade";
import { formatPrice, formatUSD } from "@/lib/format";
import { convertFeeToPercentageString, type MarketKind } from "@/lib/hyperliquid";
import { isMarketExecutionOrderType } from "@/lib/trade/order-types";
import { type SummaryItem, SummaryItems, type SummaryLayout, type SummaryTone } from "./summary-items";

interface Props {
	liqPrice: number | null;
	liqWarning: boolean;
	orderValue: number;
	marginRequired: number;
	estimatedFee: number;
	feeRatePercent: string;
	slippagePercent: number;
	priceDecimals: number | undefined;
	onSlippageClick: () => void;
	orderType: OrderType;
	marketKind?: MarketKind;
	layout?: SummaryLayout;
}

function getLiqTone(liqPrice: number | null, liqWarning: boolean): SummaryTone {
	if (!liqPrice) return "muted";
	return liqWarning ? "error" : "default";
}

export function OrderSummary({
	liqPrice,
	liqWarning,
	orderValue,
	marginRequired,
	estimatedFee,
	feeRatePercent,
	slippagePercent,
	priceDecimals,
	onSlippageClick,
	orderType,
	marketKind = "perp",
	layout = "list",
}: Props) {
	const isLeveraged = marketKind !== "spot";
	const items: SummaryItem[] = [];

	if (isLeveraged && layout === "list") {
		items.push({
			label: t`Liq. Price`,
			value: liqPrice ? formatPrice(liqPrice, { decimals: priceDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
			tone: getLiqTone(liqPrice, liqWarning),
		});
	}
	items.push({ label: t`Order Value`, value: formatUSD(orderValue), tone: orderValue > 0 ? "default" : "muted" });
	if (isLeveraged) {
		items.push({
			label: t`Margin Req.`,
			value: formatUSD(marginRequired),
			tone: marginRequired > 0 ? "default" : "muted",
		});
	}
	if (isMarketExecutionOrderType(orderType)) {
		items.push({
			label: t`Slippage`,
			value: `${slippagePercent}%`,
			tone: slippagePercent > DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT ? "warning" : "default",
			onEdit: onSlippageClick,
		});
	}
	items.push({
		label: t`Est. Fee`,
		value: orderValue > 0 ? `${feeRatePercent} (${formatUSD(estimatedFee)})` : feeRatePercent,
		tone: "muted",
	});
	if (DEFAULT_BUILDER_CONFIG?.f) {
		items.push({ label: t`Builder Fee`, value: convertFeeToPercentageString(DEFAULT_BUILDER_CONFIG.f), tone: "muted" });
	}

	return <SummaryItems items={items} layout={layout} />;
}
