import { useMemo } from "react";
import { useConnection } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClearinghouseState, useOpenOrders, useTwapHistory } from "@/hooks/hyperliquid";
import { BalancesTab } from "./balances-tab";
import { FundingTab } from "./funding-tab";
import { HistoryTab } from "./history-tab";
import { OrdersTab } from "./orders-tab";
import { PositionsTab } from "./positions-tab";
import { TwapTab } from "./twap-tab";

const TABS = [
	{ value: "balances", label: "Balances" },
	{ value: "positions", label: "Positions" },
	{ value: "orders", label: "Orders" },
	{ value: "twap", label: "TWAP" },
	{ value: "history", label: "History" },
	{ value: "funding", label: "Funding" },
] as const;

function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
}

export function PositionsPanel() {
	const { address, isConnected } = useConnection();

	// Fetch data for counts
	const { data: clearinghouseState } = useClearinghouseState({ user: isConnected ? address : undefined });
	const { data: openOrdersData } = useOpenOrders({ user: isConnected ? address : undefined });
	const { data: twapData } = useTwapHistory({ user: isConnected ? address : undefined });

	// Calculate positions count
	const positionsCount = useMemo(() => {
		if (!isConnected) return 0;
		const raw = clearinghouseState?.assetPositions ?? [];
		return raw
			.map((p) => p.position)
			.filter((p) => {
				const size = parseNumber(p.szi);
				return Number.isFinite(size) && size !== 0;
			}).length;
	}, [clearinghouseState, isConnected]);

	// Calculate orders count
	const ordersCount = useMemo(() => {
		if (!isConnected) return 0;
		return openOrdersData?.length ?? 0;
	}, [openOrdersData, isConnected]);

	// Calculate active TWAP orders count
	const twapCount = useMemo(() => {
		if (!isConnected) return 0;
		const orders = twapData ?? [];
		return orders.filter((o) => o.status.status === "activated").length;
	}, [twapData, isConnected]);

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			<Tabs defaultValue="positions" className="flex-1 min-h-0 flex flex-col">
				<div className="px-2 pt-1.5 border-b border-border/40">
					<TabsList className="pb-1.5">
						{TABS.map((tab) => {
							// Determine count for specific tabs
							let count: number | undefined;
							if (tab.value === "positions") count = positionsCount;
							if (tab.value === "orders") count = ordersCount;
							if (tab.value === "twap") count = twapCount;

							return (
								<TabsTrigger key={tab.value} value={tab.value} variant="underline">
									<span className="flex items-center gap-1.5">
										{tab.label}
										{count !== undefined && count > 0 && (
											<span className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[9px] font-medium leading-none tabular-nums rounded-full bg-terminal-cyan/20 text-terminal-cyan">
												{count}
											</span>
										)}
									</span>
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
