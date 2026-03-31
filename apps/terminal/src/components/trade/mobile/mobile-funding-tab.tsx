import { t } from "@lingui/core/macro";
import { PercentIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTimeShort, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { getValueColorClass, toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";
import { FundingTabSkeleton } from "./mobile-card-skeleton";

interface Props {
	className?: string;
}

export function MobileFundingTab({ className }: Props) {
	const { address, isConnected } = useConnection();
	const {
		data: fundingEvent,
		status,
		error,
	} = useSubscription("userFundings", { user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const markets = useMarkets();

	const updates = fundingEvent?.fundings?.slice(0, 200).sort((a, b) => b.time - a.time) ?? [];
	const totalFunding = updates.reduce((acc, f) => acc + toNumberOrZero(f.usdc), 0);
	const headerTotal =
		isConnected && status === "active"
			? formatUSD(totalFunding, { signDisplay: "exceptZero" })
			: FALLBACK_VALUE_PLACEHOLDER;
	const headerClass = getValueColorClass(totalFunding);

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`Connect your wallet to view funding payments.`}
			</div>
		);
	}

	if (status === "subscribing" || status === "idle") {
		return <FundingTabSkeleton />;
	}

	if (status === "error") {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-error">
				<span>{t`Failed to load funding history.`}</span>
				{error instanceof Error && <span className="mt-1 text-xs text-text-weak">{error.message}</span>}
			</div>
		);
	}

	if (updates.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-text-weak">
				{t`No funding payments found.`}
			</div>
		);
	}

	return (
		<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
			<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase tracking-wider text-text-weak">
				<PercentIcon className="size-3" />
				{t`Funding History`}
				<span className={cn("font-semibold ml-auto tabular-nums", headerClass)}>{headerTotal}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
				{updates.map((update, index) => {
					const market = markets.getMarket(update.coin);
					const szi = toNumber(update.szi);
					const rate = toNumber(update.fundingRate);
					const usdc = toNumber(update.usdc);
					const positionSize = szi !== null ? Math.abs(szi) : null;
					const isPositivePayment = usdc !== null && usdc >= 0;

					return (
						<div
							key={`${update.coin}-${update.time}-${index}`}
							className={cn(
								"rounded-8 border bg-bg-sunken/50",
								isPositivePayment ? "border-stroke-success-strong/30" : "border-stroke-error-strong/30",
							)}
						>
							<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
								<AssetDisplay coin={update.coin} nameClassName="text-sm font-semibold" />
								<div className={cn("text-sm font-semibold tabular-nums", getValueColorClass(usdc))}>
									{formatToken(usdc, { symbol: "USDC" })}
								</div>
							</div>

							<div className="grid grid-cols-3 gap-px bg-stroke-weak/20">
								<MetricCell
									label={t`Position`}
									value={formatToken(positionSize, { decimals: market?.szDecimals, symbol: market?.shortName })}
								/>
								<MetricCell
									label={t`Rate`}
									value={formatPercent(rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
									valueClass={rate !== null ? getValueColorClass(rate) : undefined}
								/>
								<MetricCell label={t`Time`} value={formatDateTimeShort(update.time)} />
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

interface MetricCellProps {
	label: string;
	value: string;
	valueClass?: string;
}

function MetricCell({ label, value, valueClass }: MetricCellProps) {
	return (
		<div className="px-3 py-2 bg-bg-sunken/50">
			<div className="text-xs text-text-weak mb-0.5">{label}</div>
			<div className={cn("text-xs tabular-nums font-medium", valueClass)}>{value}</div>
		</div>
	);
}
