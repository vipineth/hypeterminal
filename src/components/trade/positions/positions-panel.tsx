import { useMemo } from "react";
import { useConnection } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POSITIONS_TABS } from "@/config/constants";
import { useSubClearinghouseState, useSubOpenOrders, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber, parseNumberOrZero } from "@/lib/trade/numbers";
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
	const { data: spotEvent } = useSubSpotState({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const spotData = spotEvent?.spotState;

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

	const balancesCount = useMemo(() => {
		if (!isConnected) return 0;
		let count = 0;
		const perpAccountValue = parseNumberOrZero(state?.crossMarginSummary?.accountValue);
		if (perpAccountValue > 0) count++;
		if (spotData?.balances) {
			for (const b of spotData.balances) {
				if (parseNumberOrZero(b.total) > 0) count++;
			}
		}
		return count;
	}, [isConnected, state?.crossMarginSummary?.accountValue, spotData?.balances]);

	function getTabCount(tabValue: string): number | null {
		if (tabValue === "balances") return balancesCount;
		if (tabValue === "positions") return positionsCount;
		if (tabValue === "orders") return ordersCount;
		return null;
	}

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			<Tabs defaultValue="positions" className="flex-1 min-h-0 flex flex-col">
				<div className="px-2 pt-1.5 border-b border-border/40">
					<TabsList className="pb-1.5">
						{POSITIONS_TABS.map((tab) => {
							const count = getTabCount(tab.value);

							return (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									variant="underline"
									className="inline-flex items-center gap-1"
								>
									<span>{tab.label}</span>
									{typeof count === "number" ? (
										<span className="size-4 p-1 inline-flex items-center justify-center border border-info/10 bg-info/10 text-info text-4xs tabular-nums">
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
