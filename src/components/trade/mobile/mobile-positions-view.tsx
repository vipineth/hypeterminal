import { Inbox, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { POSITIONS_TABS, UI_TEXT } from "@/constants/app";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { useOpenOrders } from "@/hooks/hyperliquid/use-open-orders";
import { parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
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
	const { data: state, isLoading: isLoadingState } = useClearinghouseState({ user: isConnected ? address : undefined });
	const { data: openOrders, isLoading: isLoadingOrders } = useOpenOrders({ user: isConnected ? address : undefined });

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
								<button
									key={tab.value}
									type="button"
									onClick={() => setActiveTab(tab.value)}
									className={cn(
										"px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
										"min-h-[44px] flex items-center gap-2",
										"active:scale-98",
										isActive
											? "bg-background text-terminal-cyan shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<span>{tab.label}</span>
									{isLoading ? (
										<Skeleton className="h-4 w-4 rounded-full" />
									) : showCount ? (
										<Badge
											variant="outline"
											className={cn(
												"min-w-5 h-5 px-1.5 text-xs tabular-nums",
												"border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan",
											)}
										>
											{count}
										</Badge>
									) : null}
								</button>
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
				{icon === "wallet" ? (
					<Wallet className="size-8 text-muted-foreground" />
				) : (
					<Inbox className="size-8 text-muted-foreground" />
				)}
			</div>
			<p className="text-sm text-muted-foreground max-w-xs">{title}</p>
		</div>
	);
}
