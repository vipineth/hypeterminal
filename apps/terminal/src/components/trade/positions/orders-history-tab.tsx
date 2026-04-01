import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatDateTime, formatToken, formatUSD } from "@/lib/format";
import { useMarkets, useSubscription } from "@/lib/hyperliquid";
import { getSideClass, getSideLabel } from "@/lib/trade/open-orders";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketActions } from "@/stores/use-market-store";
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

export function OrdersHistoryTab() {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const markets = useMarkets();
	const {
		data: historicalOrdersEvent,
		status,
		error,
	} = useSubscription("userHistoricalOrders", { user: address ?? "0x0" }, { enabled: isConnected && !!address });

	const orders =
		historicalOrdersEvent?.orderHistory
			?.slice()
			.sort((a, b) => b.statusTimestamp - a.statusTimestamp)
			.slice(0, 200) ?? [];

	const headerCount = isConnected ? `${orders.length} ${t`Orders`}` : FALLBACK_VALUE_PLACEHOLDER;

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view order history.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading order history...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load order history.`}</span>
					{error instanceof Error && <span className="mt-1 text-xs text-text-weak">{error.message}</span>}
				</Placeholder>
			);
		}
		if (orders.length === 0) return <Placeholder>{t`No order history found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-xs uppercase tracking-wider text-text-weak mb-1.5 flex items-center gap-2">
				<ClockCounterClockwiseIcon className="size-3" />
				{t`Order History`}
				<span className="text-text-brand ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-stroke-weak/40 rounded-8 bg-bg-sunken/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-stroke-weak/40 bg-bg-raised hover:bg-bg-raised">
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Time`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Asset`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Type`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Price`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Status`}</TableHead>
									<TableHead className="text-xs font-medium uppercase tracking-wider text-text-weak text-right h-7">
										{t`Updated`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((entry, i) => {
									const { order } = entry;
									const market = markets.getMarket(order.coin);

									return (
										<TableRow
											key={`${order.oid}-${entry.statusTimestamp}`}
											className={cn("border-stroke-weak/40 hover:bg-bg-raised/30", i % 2 === 1 && "bg-bg-raised")}
										>
											<TableCell className="text-xs text-text-weak py-1.5 whitespace-nowrap">
												{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
											</TableCell>
											<TableCell className="text-xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<Button
														variant="link"
														onClick={() => setSelectedMarket(scope, order.coin)}
														className="gap-1.5"
														aria-label={t`Switch to ${order.coin} market`}
													>
														<AssetDisplay coin={order.coin} />
													</Button>
													<span className={cn("text-xs px-1 py-0.5 rounded-8 uppercase", getSideClass(order.side))}>
														{getSideLabel(order.side, market?.kind)}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-xs py-1.5">{order.orderType}</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												{formatUSD(order.limitPx, { compact: false })}
											</TableCell>
											<TableCell className="text-xs text-right tabular-nums py-1.5">
												{formatToken(order.origSz, market?.szDecimals)}
											</TableCell>
											<TableCell className="text-xs py-1.5 capitalize">{entry.status}</TableCell>
											<TableCell className="text-xs text-right tabular-nums text-text-weak py-1.5 whitespace-nowrap">
												{formatDateTime(entry.statusTimestamp, { dateStyle: "short", timeStyle: "short" })}
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
