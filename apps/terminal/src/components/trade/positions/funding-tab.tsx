import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { PercentIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTimeShort, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { getValueColorClass, toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-xs",
				variant === "error" ? "text-text-error" : "text-text-weak",
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
	} = useSubscription("userFundings", { user: address ?? "0x0" }, { enabled: isConnected && !!address });
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
					{error instanceof Error && <span className="mt-1 text-xs text-text-weak">{error.message}</span>}
				</Placeholder>
			);
		}
		if (updates.length === 0) return <Placeholder>{t`No funding payments found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-xs uppercase tracking-wider text-text-weak mb-1.5 flex items-center gap-2">
				<PercentIcon className="size-3" />
				{t`Funding History`}
				<span className={cn("ml-auto tabular-nums", headerClass)}>{headerTotal}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-stroke-weak/40 rounded-8 bg-bg-sunken/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-stroke-weak/40 bg-bg-raised hover:bg-bg-raised">
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Asset`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Position`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Rate`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Payment`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{updates.map((update, index) => {
									const market = markets.getMarket(update.coin);
									const szi = toNumber(update.szi);
									const rate = toNumber(update.fundingRate);
									const usdc = toNumber(update.usdc);
									const positionSize = szi !== null ? Math.abs(szi) : null;

									return (
										<TableRow
											key={`${update.coin}-${update.time}-${index}`}
											className={cn("border-stroke-weak/40 hover:bg-bg-raised/30", index % 2 === 1 && "bg-bg-raised")}
										>
											<TableCell className="text-xs font-medium py-1.5">
												<AssetDisplay coin={update.coin} />
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												{formatToken(positionSize, { decimals: market?.szDecimals, symbol: market?.shortName })}
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												<span className={getValueColorClass(rate)}>
													{formatPercent(rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
												</span>
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												<span className={getValueColorClass(usdc)}>{formatToken(usdc, { symbol: "USDC" })}</span>
											</TableCell>

											<TableCell className="text-xs text-right tabular-nums text-text-weak py-1.5">
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
