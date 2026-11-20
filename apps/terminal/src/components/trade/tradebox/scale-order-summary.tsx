import { t } from "@lingui/core/macro";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { formatPrice, formatUSD } from "@/lib/format";
import { convertFeeToPercentageString, type MarketKind } from "@/lib/hyperliquid";
import { type SummaryItem, SummaryItems, type SummaryLayout } from "./summary-items";

interface Props {
	scaleStart: number | null;
	scaleEnd: number | null;
	scaleLevels: number;
	orderValue: number;
	marginRequired: number;
	estimatedFee: number;
	feeRatePercent: string;
	priceDecimals: number | undefined;
	marketKind?: MarketKind;
	layout?: SummaryLayout;
}

export function ScaleOrderSummary({
	scaleStart,
	scaleEnd,
	scaleLevels,
	orderValue,
	marginRequired,
	estimatedFee,
	feeRatePercent,
	priceDecimals,
	marketKind = "perp",
	layout = "list",
}: Props) {
	const hasStart = scaleStart !== null && scaleStart > 0;
	const hasEnd = scaleEnd !== null && scaleEnd > 0;
	const items: SummaryItem[] = [
		{
			label: t`Start Price`,
			value: hasStart ? formatPrice(scaleStart, { decimals: priceDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
			tone: hasStart ? "default" : "muted",
		},
		{
			label: t`End Price`,
			value: hasEnd ? formatPrice(scaleEnd, { decimals: priceDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
			tone: hasEnd ? "default" : "muted",
		},
		{
			label: t`Number of Orders`,
			value: scaleLevels > 0 ? scaleLevels : FALLBACK_VALUE_PLACEHOLDER,
			tone: scaleLevels > 0 ? "default" : "muted",
		},
		{ label: t`Order Value`, value: formatUSD(orderValue), tone: orderValue > 0 ? "default" : "muted" },
	];

	if (marketKind !== "spot") {
		items.push({
			label: t`Margin Req.`,
			value: formatUSD(marginRequired),
			tone: marginRequired > 0 ? "default" : "muted",
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
