import { t } from "@lingui/core/macro";
import { PercentIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTimeShort, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useMarkets } from "@/lib/hyperliquid";
import { useSubUserFundings } from "@/lib/hyperliquid/hooks/subscription";
import { getValueColorClass, toNumber, toNumberOrZero } from "@/lib/trade/numbers";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs",
				variant === "error" ? "text-market-down-600" : "text-text-600",
			)}
		>
			{children}
		</div>
	);
}

export function FundingTab() {
	const { address, isConnected } = useConnection();
	const {
		data: fundingEvent,
		status,
		error,
	} = useSubUserFundings({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const markets = useMarkets();

	const updates = fundingEvent?.fundings?.slice(0, 200).sort((a, b) => b.time - a.time) ?? [];
	const totalFunding = updates.reduce((acc, f) => acc + toNumberOrZero(f.usdc), 0);

	const headerTotal =
		isConnected && status === "active"
			? formatUSD(totalFunding, { signDisplay: "exceptZero" })
			: FALLBACK_VALUE_PLACEHOLDER;
	const headerClass = getValueColorClass(totalFunding);

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view funding payments.`}</Placeholder>;
		if (status === "subscribing" || status === "idle")
			return <Placeholder>{t`Loading funding history...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load funding history.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-text-600">{error.message}</span>}
				</Placeholder>
			);
		}
		if (updates.length === 0) return <Placeholder>{t`No funding payments found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-text-600 mb-1.5 flex items-center gap-2">
				<PercentIcon className="size-3" />
				{t`Funding History`}
				<span className={cn("ml-auto tabular-nums", headerClass)}>{headerTotal}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border-200/40 rounded-sm bg-surface-base/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border-200/40 bg-surface-analysis hover:bg-surface-analysis">
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Position`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Rate`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Payment`}
									</TableHead>
									<TableHead className="text-4xs font-medium uppercase tracking-wider text-text-600 text-right h-7">
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{updates.map((update, index) => {
									const szi = toNumber(update.szi);
									const isLong = szi !== null ? szi > 0 : true;
									const rate = toNumber(update.fundingRate);
									const usdc = toNumber(update.usdc);
									const szDecimals = markets.getSzDecimals(update.coin);
									const positionSize = szi !== null ? Math.abs(szi) : null;

									const sideClass = isLong
										? "bg-market-up-100 text-market-up-600"
										: "bg-market-down-100 text-market-down-600";

									return (
										<TableRow
											key={`${update.coin}-${update.time}-${index}`}
											className={cn(
												"border-border-200/40 hover:bg-surface-analysis/30",
												index % 2 === 1 && "bg-surface-analysis",
											)}
										>
											<TableCell className="text-3xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", sideClass)}>
														{isLong ? t`Long` : t`Short`}
													</span>
													<span>{markets.getMarket(update.coin)?.displayName ?? update.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-3xs text-right tabular-nums py-1.5">
												{formatToken(positionSize, { digits: szDecimals, symbol: update.coin })}
											</TableCell>
											<TableCell className="text-3xs text-right tabular-nums py-1.5">
												<span className={getValueColorClass(rate)}>
													{formatPercent(rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
												</span>
											</TableCell>
											<TableCell className="text-3xs text-right tabular-nums py-1.5">
												<span className={getValueColorClass(usdc)}>{formatToken(usdc, { symbol: "USDC" })}</span>
											</TableCell>

											<TableCell className="text-3xs text-right tabular-nums text-text-600 py-1.5">
												<div className="flex flex-col items-end">
													<span>{formatDateTimeShort(update.time)}</span>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
