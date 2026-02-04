import { Tray, Wallet } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { POSITIONS_TABS, UI_TEXT } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { toNumber } from "@/lib/trade/numbers";
import { BalancesTab } from "../positions/balances-tab";
import { FundingTab } from "../positions/funding-tab";
import { HistoryTab } from "../positions/history-tab";
import { OrdersTab } from "../positions/orders-tab";
import { PositionsTab } from "../positions/positions-tab";
import { TwapTab } from "../positions/twap-tab";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const TABS_TEXT = UI_TEXT.POSITIONS_TAB;

type TabValue = (typeof POSITIONS_TABS)[number]["value"];

interface MobilePositionsViewProps {
	className?: string;
}

export function MobilePositionsView({ className }: MobilePositionsViewProps) {
	const [activeTab, setActiveTab] = useState<TabValue>("positions");

	const { address, isConnected } = useConnection();
	const { perpPositions, isLoading: isLoadingState } = useAccountBalances();

	const { data: ordersEvent, status: ordersStatus } = useSubOpenOrders(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const openOrders = ordersEvent?.orders;
	const isLoadingOrders = ordersStatus === "subscribing" || ordersStatus === "idle";

	const positionsCount = useMemo(() => {
		if (!isConnected) return 0;
		return perpPositions.reduce((count, entry) => {
			const size = toNumber(entry.position.szi);
			if (!size) return count;
			return count + 1;
		}, 0);
	}, [isConnected, perpPositions]);

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;

	const renderContent = () => {
		if (!isConnected) {
			return <EmptyState title={TABS_TEXT.CONNECT} icon="wallet" />;
		}

		switch (activeTab) {
			case "balances":
				return <BalancesTab />;
			case "positions":
				return <PositionsTab />;
			case "orders":
				return <OrdersTab />;
			case "twap":
				return <TwapTab />;
			case "history":
				return <HistoryTab />;
			case "funding":
				return <FundingTab />;
			default:
				return null;
		}
	};

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-surface/20", className)}>
			{/* Scrollable tabs header */}
			<div className="shrink-0 border-b border-border/60 bg-surface/30">
				<div className="px-3 py-2 overflow-x-auto">
					<div className="flex items-center gap-1 min-w-max">
						{POSITIONS_TABS.map((tab) => {
							const isActive = activeTab === tab.value;
							const count = tab.value === "positions" ? positionsCount : tab.value === "orders" ? ordersCount : null;
							const showCount = typeof count === "number" && count > 0;
							const isLoading =
								(tab.value === "positions" && isLoadingState) || (tab.value === "orders" && isLoadingOrders);

							return (
								<Button
									key={tab.value}
									variant="ghost"
									size="none"
									onClick={() => setActiveTab(tab.value)}
									className={cn(
										"px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
										"min-h-[44px] flex items-center gap-2",
										"active:scale-98",
										"hover:bg-transparent",
										isActive ? "bg-bg text-info shadow-sm" : "text-muted-fg hover:text-fg",
									)}
								>
									<span>{tab.label}</span>
									{isLoading ? (
										<Skeleton className="h-4 w-4 rounded-full" />
									) : showCount ? (
										<Badge
											variant="outline"
											className={cn("min-w-5 h-5 px-1.5 text-xs tabular-nums", "border-info/30 bg-info/10 text-info")}
										>
											{count}
										</Badge>
									) : null}
								</Button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>

			<MobileBottomNavSpacer />
		</div>
	);
}

interface EmptyStateProps {
	title: string;
	icon?: "wallet" | "empty";
}

function EmptyState({ title, icon = "empty" }: EmptyStateProps) {
	return (
		<div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
			<div className={cn("size-16 rounded-full flex items-center justify-center", "bg-muted/50")}>
				{icon === "wallet" ? <Wallet className="size-8 text-muted-fg" /> : <Tray className="size-8 text-muted-fg" />}
			</div>
			<p className="text-sm text-muted-fg max-w-xs">{title}</p>
		</div>
	);
}
