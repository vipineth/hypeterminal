import { useMemo } from "react";
import { useConnection } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POSITIONS_TABS } from "@/config/constants";
import { useSubClearinghouseState, useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber } from "@/lib/trade/numbers";
import { BalancesTab } from "./balances-tab";
import { FundingTab } from "./funding-tab";
import { HistoryTab } from "./history-tab";
import { OrdersTab } from "./orders-tab";
import { PositionsTab } from "./positions-tab";
import { TwapTab } from "./twap-tab";

export function PositionsPanel() {
	const { address, isConnected } = useConnection();
	const { data: stateEvent } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const state = stateEvent?.clearinghouseState;
	const { data: ordersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const openOrders = ordersEvent?.orders;

	const positionsCount = useMemo(() => {
		if (!isConnected) return 0;
		const raw = state?.assetPositions ?? [];
		return raw.reduce((count, entry) => {
			const size = parseNumber(entry.position.szi);
			if (!Number.isFinite(size) || size === 0) return count;
			return count + 1;
		}, 0);
	}, [isConnected, state?.assetPositions]);

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			<Tabs defaultValue="positions" className="flex-1 min-h-0 flex flex-col">
				<div className="px-2 pt-1.5 border-b border-border/40">
					<TabsList className="pb-1.5">
						{POSITIONS_TABS.map((tab) => {
							const count = tab.value === "positions" ? positionsCount : tab.value === "orders" ? ordersCount : null;

							return (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									variant="underline"
									className="inline-flex items-center gap-1"
								>
									<span>{tab.label}</span>
									{typeof count === "number" ? (
										<span className="min-w-4 h-4 px-1 inline-flex items-center justify-center rounded-full border border-terminal-cyan/30 bg-terminal-cyan/15 text-terminal-cyan text-4xs tabular-nums">
											{count}
										</span>
									) : null}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>
				<TabsContent value="balances" className="flex-1 min-h-0 flex flex-col mt-0">
					<BalancesTab />
				</TabsContent>
				<TabsContent value="positions" className="flex-1 min-h-0 flex flex-col mt-0">
					<PositionsTab />
				</TabsContent>
				<TabsContent value="orders" className="flex-1 min-h-0 flex flex-col mt-0">
					<OrdersTab />
				</TabsContent>
				<TabsContent value="twap" className="flex-1 min-h-0 flex flex-col mt-0">
					<TwapTab />
				</TabsContent>
				<TabsContent value="history" className="flex-1 min-h-0 flex flex-col mt-0">
					<HistoryTab />
				</TabsContent>
				<TabsContent value="funding" className="flex-1 min-h-0 flex flex-col mt-0">
					<FundingTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
