import { Tabs, TabsContent, TabsList, TabsTrigger } from "@hypeterminal/ui";
import { WalletIcon } from "@phosphor-icons/react";
import { useTransition } from "react";
import { useConnection } from "wagmi";
import { Spinner } from "@/components/ui/spinner";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useSubscription } from "@/lib/hyperliquid";
import { toNumber } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, usePositionsActiveTab } from "@/stores/use-global-settings-store";
import { MobileBalancesTab } from "./mobile-balances-tab";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";
import { MobileFundingTab } from "./mobile-funding-tab";
import { MobileHistoryTab } from "./mobile-history-tab";
import { MobileOrdersHistoryTab } from "./mobile-orders-history-tab";
import { MobileOrdersTab } from "./mobile-orders-tab";
import { MobilePositionsTab } from "./mobile-positions-tab";
import { MobileTwapTab } from "./mobile-twap-tab";

const MOBILE_TABS = [
	{ value: "positions", label: "Positions" },
	{ value: "orders", label: "Open Orders" },
	{ value: "balances", label: "Balances" },
	{ value: "twap", label: "TWAP" },
	{ value: "history", label: "Trade History" },
	{ value: "orders-history", label: "Order History" },
	{ value: "funding", label: "Funding History" },
] as const;

type TabValue = (typeof MOBILE_TABS)[number]["value"];

interface Props {
	className?: string;
}

export function MobilePositionsView({ className }: Props) {
	const activeTab = usePositionsActiveTab() as TabValue;
	const { setPositionsActiveTab } = useGlobalSettingsActions();
	const [isPending, startTransition] = useTransition();
	const { address, isConnected } = useConnection();
	const { perpPositions, isLoading: isLoadingState } = useAccountBalances();

	const { data: ordersEvent, status: ordersStatus } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const openOrders = ordersEvent?.orders;
	const isLoadingOrders = ordersStatus === "subscribing" || ordersStatus === "idle";

	const positionsCount = isConnected
		? perpPositions.reduce((count, entry) => {
				const size = toNumber(entry.position.szi);
				return size ? count + 1 : count;
			}, 0)
		: 0;

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;

	function handleTabChange(value: string) {
		startTransition(() => setPositionsActiveTab(value));
	}

	function getTabCount(tabValue: TabValue): number | null {
		if (tabValue === "positions") return positionsCount;
		if (tabValue === "orders") return ordersCount;
		return null;
	}

	function isTabLoading(tabValue: TabValue): boolean {
		if (!isConnected) return false;
		if (tabValue === "positions") return isLoadingState;
		if (tabValue === "orders") return isLoadingOrders;
		return false;
	}

	const tabContentClass = cn("flex-1 min-h-0 flex flex-col mt-0", isPending && "opacity-70");

	return (
		<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
			<Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col">
				<div className="shrink-0 overflow-x-auto border-b border-stroke-weak/60">
					<TabsList className="px-3 min-w-max">
						{MOBILE_TABS.map((tab) => {
							const count = getTabCount(tab.value);
							const loading = isTabLoading(tab.value);

							return (
								<TabsTrigger key={tab.value} value={tab.value} className="inline-flex items-center gap-1">
									<span>{tab.label}</span>
									{loading ? (
										<Spinner className="size-3" />
									) : typeof count === "number" && count > 0 ? (
										<span>({count})</span>
									) : null}
								</TabsTrigger>
							);
						})}
					</TabsList>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto">
					{!isConnected ? (
						<EmptyState />
					) : (
						<>
							<TabsContent value="positions" className={tabContentClass}>
								<MobilePositionsTab />
							</TabsContent>
							<TabsContent value="orders" className={tabContentClass}>
								<MobileOrdersTab />
							</TabsContent>
							<TabsContent value="balances" className={tabContentClass}>
								<MobileBalancesTab />
							</TabsContent>
							<TabsContent value="twap" className={tabContentClass}>
								<MobileTwapTab />
							</TabsContent>
							<TabsContent value="history" className={tabContentClass}>
								<MobileHistoryTab />
							</TabsContent>
							<TabsContent value="orders-history" className={tabContentClass}>
								<MobileOrdersHistoryTab />
							</TabsContent>
							<TabsContent value="funding" className={tabContentClass}>
								<MobileFundingTab />
							</TabsContent>
						</>
					)}
					<MobileBottomNavSpacer />
				</div>
			</Tabs>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
			<div className="size-16 rounded-full flex items-center justify-center bg-bg-raised">
				<WalletIcon className="size-8 text-text-weak" />
			</div>
			<p className="text-sm text-text-weak max-w-xs">Connect wallet to view positions</p>
		</div>
	);
}
