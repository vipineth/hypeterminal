import { Suspense, useMemo, useTransition } from "react";
import { useConnection } from "wagmi";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HL_ALL_DEXS, POSITIONS_TABS } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useUserPositions } from "@/lib/hyperliquid";
import { useSubOpenOrders, useSubTwapStates } from "@/lib/hyperliquid/hooks/subscription";
import { createLazyComponent } from "@/lib/lazy";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, usePositionsActiveTab } from "@/stores/use-global-settings-store";

const BalancesTab = createLazyComponent(() => import("./balances-tab"), "BalancesTab");
const FundingTab = createLazyComponent(() => import("./funding-tab"), "FundingTab");
const HistoryTab = createLazyComponent(() => import("./history-tab"), "HistoryTab");
const OrdersHistoryTab = createLazyComponent(() => import("./orders-history-tab"), "OrdersHistoryTab");
const OrdersTab = createLazyComponent(() => import("./orders-tab"), "OrdersTab");
const PositionsTab = createLazyComponent(() => import("./positions-tab"), "PositionsTab");
const TwapTab = createLazyComponent(() => import("./twap-tab"), "TwapTab");

export function PositionsPanel() {
	const activeTab = usePositionsActiveTab();
	const { setPositionsActiveTab } = useGlobalSettingsActions();
	const [isPending, startTransition] = useTransition();
	const { address, isConnected } = useConnection();
	const { perpSummary, spotBalances } = useAccountBalances();
	const { positions } = useUserPositions();
	const { data: ordersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const { data: twapStatesEvent } = useSubTwapStates(
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const openOrders = ordersEvent?.orders;
	const twapCount = isConnected ? (twapStatesEvent?.states?.length ?? 0) : 0;

	function handleTabChange(value: string) {
		startTransition(() => setPositionsActiveTab(value));
	}

	const positionsCount = isConnected ? positions.length : 0;

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;

	const balancesCount = useMemo(() => {
		if (!isConnected) return 0;
		let count = 0;
		const perpAccountValue = toNumberOrZero(perpSummary?.accountValue);
		if (perpAccountValue > 0) count++;
		if (spotBalances.length) {
			for (const b of spotBalances) {
				if (toNumberOrZero(b.total) > 0) count++;
			}
		}
		return count;
	}, [isConnected, perpSummary?.accountValue, spotBalances]);

	function getTabCount(tabValue: string): number | null {
		if (tabValue === "balances") return balancesCount;
		if (tabValue === "positions") return positionsCount;
		if (tabValue === "orders") return ordersCount;
		if (tabValue === "twap") return twapCount;
		return null;
	}

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface-execution">
			<Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col">
				<div className="p-2">
					<TabsList variant="underline" fullWidth>
						{POSITIONS_TABS.map((tab) => {
							const count = getTabCount(tab.value);

							return (
								<TabsTrigger key={tab.value} value={tab.value} className="inline-flex items-center gap-1">
									<span>{tab.label}</span>
									{typeof count === "number" ? <span>({count})</span> : null}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>
				<TabsContent value="balances" className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}>
					<Suspense fallback={<TabLoadingFallback />}>
						<BalancesTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="positions" className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}>
					<Suspense fallback={<TabLoadingFallback />}>
						<PositionsTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="orders" className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}>
					<Suspense fallback={<TabLoadingFallback />}>
						<OrdersTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="twap" className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}>
					<Suspense fallback={<TabLoadingFallback />}>
						<TwapTab />
					</Suspense>
				</TabsContent>
				<TabsContent
					value="orders-history"
					className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}
				>
					<Suspense fallback={<TabLoadingFallback />}>
						<OrdersHistoryTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="history" className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}>
					<Suspense fallback={<TabLoadingFallback />}>
						<HistoryTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="funding" className={cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70")}>
					<Suspense fallback={<TabLoadingFallback />}>
						<FundingTab />
					</Suspense>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function TabLoadingFallback() {
	return (
		<div className="flex-1 flex items-center justify-center">
			<Spinner className="size-4 text-text-600" />
		</div>
	);
}
