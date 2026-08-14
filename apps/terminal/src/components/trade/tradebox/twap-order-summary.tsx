import { t } from "@lingui/core/macro";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { TWAP_SUBORDER_INTERVAL_SECONDS } from "@/config/trade";
import { bpsToPercentage, formatDuration, formatToken, formatUSD } from "@/lib/format";

interface Props {
	twapMinutesNum: number | null;
	sizeValue: number;
	orderValue: number;
	estimatedFee: number;
	feeRatePercent: string;
	baseToken: string;
	szDecimals: number | undefined;
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<span className="text-xs tracking-[0.5px] text-fg-muted">{label}</span>
			<span className="text-xs tabular-nums text-fg">{children}</span>
		</div>
	);
}

export function TwapOrderSummary({
	twapMinutesNum,
	sizeValue,
	orderValue,
	estimatedFee,
	feeRatePercent,
	baseToken,
	szDecimals,
}: Props) {
	const minutes = Math.max(0, Math.round(twapMinutesNum ?? 0));
	const numberOfOrders = minutes > 0 ? Math.floor((minutes * 60) / TWAP_SUBORDER_INTERVAL_SECONDS) + 1 : 0;
	const sizePerSuborder = numberOfOrders > 0 ? sizeValue / numberOfOrders : 0;

	return (
		<div className="flex flex-col">
			<SummaryRow label={t`Frequency`}>
				<span className="text-fg">{t`${TWAP_SUBORDER_INTERVAL_SECONDS} seconds`}</span>
			</SummaryRow>
			<SummaryRow label={t`Runtime`}>
				<span className={minutes > 0 ? "text-fg" : "text-fg-muted"}>
					{minutes > 0 ? formatDuration(minutes) : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</SummaryRow>
			<SummaryRow label={t`Number of Orders`}>
				<span className={numberOfOrders > 0 ? "text-fg" : "text-fg-muted"}>
					{numberOfOrders > 0 ? numberOfOrders : FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</SummaryRow>
			<SummaryRow label={t`Size per Suborder`}>
				<span className={sizePerSuborder > 0 ? "text-fg" : "text-fg-muted"}>
					{sizePerSuborder > 0
						? formatToken(sizePerSuborder, { decimals: szDecimals, symbol: baseToken })
						: FALLBACK_VALUE_PLACEHOLDER}
				</span>
			</SummaryRow>
			<SummaryRow label={t`Fees`}>
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
