import { t } from "@lingui/core/macro";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { TWAP_SUBORDER_INTERVAL_SECONDS } from "@/config/trade";
import { formatDuration, formatToken, formatUSD } from "@/lib/format";
import { convertFeeToPercentageString } from "@/lib/hyperliquid";
import { type SummaryItem, SummaryItems, type SummaryLayout } from "./summary-items";

interface Props {
	twapMinutesNum: number | null;
	sizeValue: number;
	orderValue: number;
	estimatedFee: number;
	feeRatePercent: string;
	baseToken: string;
	szDecimals: number | undefined;
	layout?: SummaryLayout;
}

export function TwapOrderSummary({
	twapMinutesNum,
	sizeValue,
	orderValue,
	estimatedFee,
	feeRatePercent,
	baseToken,
	szDecimals,
	layout = "list",
}: Props) {
	const minutes = Math.max(0, Math.round(twapMinutesNum ?? 0));
	const numberOfOrders = minutes > 0 ? Math.floor((minutes * 60) / TWAP_SUBORDER_INTERVAL_SECONDS) + 1 : 0;
	const sizePerSuborder = numberOfOrders > 0 ? sizeValue / numberOfOrders : 0;

	const items: SummaryItem[] = [
		{ label: t`Frequency`, value: t`${TWAP_SUBORDER_INTERVAL_SECONDS} seconds`, tone: "default" },
		{
			label: t`Runtime`,
			value: minutes > 0 ? formatDuration(minutes) : FALLBACK_VALUE_PLACEHOLDER,
			tone: minutes > 0 ? "default" : "muted",
		},
		{
			label: t`Number of Orders`,
			value: numberOfOrders > 0 ? numberOfOrders : FALLBACK_VALUE_PLACEHOLDER,
			tone: numberOfOrders > 0 ? "default" : "muted",
		},
		{
			label: t`Size per Suborder`,
			value:
				sizePerSuborder > 0
					? formatToken(sizePerSuborder, { decimals: szDecimals, symbol: baseToken })
					: FALLBACK_VALUE_PLACEHOLDER,
			tone: sizePerSuborder > 0 ? "default" : "muted",
		},
		{
			label: t`Fees`,
			value: orderValue > 0 ? `${feeRatePercent} (${formatUSD(estimatedFee)})` : feeRatePercent,
			tone: "muted",
		},
	];

	if (DEFAULT_BUILDER_CONFIG?.f) {
		items.push({ label: t`Builder Fee`, value: convertFeeToPercentageString(DEFAULT_BUILDER_CONFIG.f), tone: "muted" });
	}

	return <SummaryItems items={items} layout={layout} />;
}
