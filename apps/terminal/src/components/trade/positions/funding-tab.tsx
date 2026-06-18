import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MAX_HISTORY_ROWS } from "@/config/trade";
import { cn } from "@/lib/cn";
import { formatDateTimeShort, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetBadge } from "../components/asset-badge";
import { Placeholder } from "./placeholder";
import {
	positionsPanelRowHoverClass,
	positionsPanelRowStripeClass,
	positionsPanelTableBodyClass,
	positionsPanelTableCaptionRowClass,
	positionsPanelTableCellClass,
	positionsPanelTableHeadClass,
	positionsPanelTableHeaderClass,
	positionsPanelTableHeaderRowClass,
	positionsPanelTableShellClass,
	positionsPanelTabRootClass,
} from "./positions-panel-table-styles";

export function FundingTab() {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const {
		data: fundingEvent,
		status,
		error,
	} = useSubscription("userFundings", { user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const markets = useMarkets();

	const updates = fundingEvent?.fundings?.slice(0, MAX_HISTORY_ROWS).sort((a, b) => b.time - a.time) ?? [];
	const totalFunding = updates.reduce((acc, f) => acc + toNumberOrZero(f.usdc), 0);

	const headerTotal = formatUSD(totalFunding, { signDisplay: "exceptZero" });
	const headerClass = getValueColorClass(totalFunding);

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view funding payments.`}</Placeholder>;
		if (status === "subscribing" || status === "idle")
			return <Placeholder>{t`Loading funding history...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load funding history.`}</span>
					{error instanceof Error && <span className="mt-1 text-xs text-fg-muted">{error.message}</span>}
				</Placeholder>
			);
		}
		if (updates.length === 0) return <Placeholder>{t`No funding payments found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className={positionsPanelTabRootClass}>
			<div className={positionsPanelTableCaptionRowClass}>
				{isConnected && status === "active" ? (
					<span className={cn("tabular-nums text-3xs font-medium", headerClass)}>{headerTotal}</span>
				) : null}
			</div>
			<div className={positionsPanelTableShellClass}>
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table className="table-fixed min-w-[38rem] w-full">
							<TableHeader className={positionsPanelTableHeaderClass}>
								<TableRow className={positionsPanelTableHeaderRowClass}>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[22%] text-left")}>
										{t`Asset`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[18%] text-right")}
									>
										{t`Position`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[18%] text-right")}
									>
										{t`Rate`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[22%] text-right")}
									>
										{t`Payment`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[20%] text-right")}
									>
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className={positionsPanelTableBodyClass}>
								{updates.map((update, index) => {
									const market = markets.getMarket(update.coin);
									const szi = toNumber(update.szi);
									const rate = toNumber(update.fundingRate);
									const usdc = toNumber(update.usdc);
									const positionSize = szi !== null ? Math.abs(szi) : null;

									return (
										<TableRow
											key={`${update.coin}-${update.time}-${update.usdc}`}
											className={cn(positionsPanelRowHoverClass, index % 2 === 1 && positionsPanelRowStripeClass)}
										>
											<TableCell size="dense" className={cn(positionsPanelTableCellClass, "font-medium text-fg")}>
												<AssetBadge
													coin={update.coin}
													onClick={() => setSelectedMarket(scope, update.coin)}
													aria-label={t`Switch to ${update.coin} market`}
												/>
											</TableCell>
											<TableCell
												size="dense"
												className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg")}
											>
												{formatToken(positionSize, { decimals: market?.szDecimals, symbol: market?.shortName })}
											</TableCell>
											<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums")}>
												<span className={getValueColorClass(rate)}>
													{formatPercent(rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
												</span>
											</TableCell>
											<TableCell size="dense" className={cn(positionsPanelTableCellClass, "text-right tabular-nums")}>
												<span className={getValueColorClass(usdc)}>{formatToken(usdc, { symbol: "USDC" })}</span>
											</TableCell>

											<TableCell
												size="dense"
												className={cn(positionsPanelTableCellClass, "text-right tabular-nums text-fg-muted")}
											>
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
