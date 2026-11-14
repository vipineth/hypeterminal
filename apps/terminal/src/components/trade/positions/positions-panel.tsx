import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hypeterminal/ui";
import { Suspense, useTransition } from "react";
import { useConnection } from "wagmi";
import { Spinner } from "@/components/ui/spinner";
import { HL_ALL_DEXS } from "@/config/app";
import { POSITIONS_TABS } from "@/config/trade";
import { useBalances } from "@/hooks/trade/use-balances";
import { cn } from "@/lib/cn";
import { useSubscription, useUserPositions } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { useGlobalSettingsActions, usePositionsActiveTab } from "@/stores/use-global-settings-store";

const tabContentBaseClass = "flex-1 min-h-0 flex flex-col mt-0";

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
	const balances = useBalances();
	const { positions } = useUserPositions();
	const { data: ordersEvent } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const { data: twapStatesEvent } = useSubscription(
		"twapStates",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const openOrders = ordersEvent?.orders;
	const twapCount = isConnected ? (twapStatesEvent?.states?.length ?? 0) : null;

	function handleTabChange(value: string) {
		startTransition(() => setPositionsActiveTab(value));
	}

	const positionsCount = isConnected ? positions.length : null;

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : null;

	const tabContentClass = cn(tabContentBaseClass, isPending && "opacity-70");

	const balancesCount = isConnected && balances.status === "ready" ? balances.perp.length + balances.spot.length : null;

	function getTabCount(tabValue: string): number | null {
		if (tabValue === "balances") return balancesCount;
		if (tabValue === "positions") return positionsCount;
		if (tabValue === "orders") return ordersCount;
		if (tabValue === "twap") return twapCount;
		return null;
	}

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface">
			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="flex-1 min-h-0 flex flex-col"
				size="sm"
				variant="underline"
			>
				<div className="overflow-x-auto scrollbar-none px-2 pt-1.5 pb-1">
					<TabsList className="min-w-max gap-1">
						{POSITIONS_TABS.map((tab) => {
							const count = getTabCount(tab.value);

							return (
								<TabsTrigger
									key={tab.value}
									value={tab.value}
									className="inline-flex items-center gap-1 whitespace-nowrap"
								>
									<span>{tab.label}</span>
									{typeof count === "number" ? <span className="text-fg-muted">({count})</span> : null}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>
				<TabsContent value="balances" className={tabContentClass}>
					<Suspense fallback={<TabLoadingFallback />}>
						<BalancesTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="positions" className={tabContentClass}>
					<Suspense fallback={<TabLoadingFallback />}>
						<PositionsTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="orders" className={tabContentClass}>
					<Suspense fallback={<TabLoadingFallback />}>
						<OrdersTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="twap" className={tabContentClass}>
					<Suspense fallback={<TabLoadingFallback />}>
						<TwapTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="orders-history" className={tabContentClass}>
					<Suspense fallback={<TabLoadingFallback />}>
						<OrdersHistoryTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="history" className={tabContentClass}>
					<Suspense fallback={<TabLoadingFallback />}>
						<HistoryTab />
					</Suspense>
				</TabsContent>
				<TabsContent value="funding" className={tabContentClass}>
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
			<Spinner className="size-4 text-fg-muted" />
		</div>
	);
}
