import { AdaptiveModal, Button } from "@hypeterminal/ui";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { getSideLabels } from "@/config/ui-text";
import { getPositionDex } from "@/domain/market";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import type { Side } from "@/lib/trade/types";
import { useGlobalSettingsActions, useTheme } from "@/stores/use-global-settings-store";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { OrderbookPanel } from "../orderbook/orderbook-panel";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";
import { MobileMarketHeader } from "./mobile-market-header";
import { MobileMarketStats } from "./mobile-market-stats";
import { MobilePositionsTab } from "./mobile-positions-tab";
import { MobileTradeTicketBody } from "./mobile-trade-ticket-body";

const KlineChart = createLazyComponent(() => import("../chart/kline-chart"), "KlineChart");

export function MobileMarketPage() {
	const theme = useTheme();
	const { data: market } = useSelectedMarketInfo();
	const { setMobileMarketOpen } = useGlobalSettingsActions();
	const { setSide, setOrderType, setLimitPrice } = useOrderEntryActions();
	const selectedPrice = useSelectedPrice();
	const [ticketOpen, setTicketOpen] = useState(false);
	const sideLabels = getSideLabels(market?.kind === "spot");

	useEffect(() => {
		if (selectedPrice === null) return;
		setOrderType("limit");
		setLimitPrice(String(selectedPrice));
		getOrderbookActionsStore().actions.clearSelectedPrice();
		setTicketOpen(true);
	}, [selectedPrice, setOrderType, setLimitPrice]);

	function openTicket(side: Side) {
		setSide(side);
		setTicketOpen(true);
	}

	return (
		<div className="flex flex-1 min-h-0 flex-col">
			<MobileMarketHeader market={market} onBack={() => setMobileMarketOpen(false)} />
			<div className="flex-1 min-h-0 overflow-y-auto">
				<MobileMarketStats market={market} />
				<div className="h-80 border-b border-stroke-weak/60">
					<ClientOnly fallback={<ChartSkeleton />}>
						<Suspense fallback={<ChartSkeleton />}>
							{market && (
								<KlineChart
									symbol={market.name}
									priceDecimals={market.priceDecimals}
									positionDex={getPositionDex(market)}
									theme={theme === "dark" ? "dark" : "light"}
									yAxisInside
								/>
							)}
						</Suspense>
					</ClientOnly>
				</div>
				{market && (
					<div className="px-3 pt-3 empty:hidden">
						<MobilePositionsTab coin={market.name} />
					</div>
				)}
				<div className="h-96 mt-3 border-t border-stroke-weak/60">
					<OrderbookPanel key={market?.name ?? "default"} />
				</div>
			</div>
			<div className="shrink-0 grid grid-cols-2 gap-2 border-t border-stroke-weak/60 bg-surface px-3 py-2">
				<Button
					variant="filled"
					intent="brand"
					size="md"
					className="touch-hitbox bg-success text-background hover:opacity-90"
					onClick={() => openTicket("buy")}
				>
					{sideLabels.buy}
				</Button>
				<Button
					variant="filled"
					intent="error"
					size="md"
					className="touch-hitbox text-background"
					onClick={() => openTicket("sell")}
				>
					{sideLabels.sell}
				</Button>
			</div>
			<MobileBottomNavSpacer />
			<AdaptiveModal open={ticketOpen} onOpenChange={setTicketOpen}>
				<MobileTradeTicketBody onSubmitted={() => setTicketOpen(false)} />
			</AdaptiveModal>
		</div>
	);
}

function ChartSkeleton() {
	return <div className="h-full w-full animate-pulse bg-surface" />;
}
