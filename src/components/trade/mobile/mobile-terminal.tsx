import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { toNumber } from "@/lib/trade/numbers";
import { MobileAccountView } from "./mobile-account-view";
import { MobileBookView } from "./mobile-book-view";
import { MobileBottomNav, type MobileTab } from "./mobile-bottom-nav";
import { MobileChartView } from "./mobile-chart-view";
import { MobileHeader } from "./mobile-header";
import { MobilePositionsView } from "./mobile-positions-view";
import { MobileTradeView } from "./mobile-trade-view";
import { OfflineBanner } from "./offline-banner";

interface Props {
	className?: string;
}

export function MobileTerminal({ className }: Props) {
	const [activeTab, setActiveTab] = useState<MobileTab>("chart");

	const { address, isConnected } = useConnection();
	const { perpPositions } = useAccountBalances();
	const { data: ordersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const openOrders = ordersEvent?.orders;

	const positionsCount = useMemo(() => {
		if (!isConnected) return 0;
		return perpPositions.reduce((count, entry) => {
			const size = toNumber(entry.position.szi);
			if (!size) return count;
			return count + 1;
		}, 0);
	}, [isConnected, perpPositions]);

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;

	const badges = useMemo(
		() => ({
			positions: positionsCount + ordersCount,
		}),
		[positionsCount, ordersCount],
	);

	const renderContent = () => {
		switch (activeTab) {
			case "chart":
				return <MobileChartView />;
			case "book":
				return <MobileBookView />;
			case "trade":
				return <MobileTradeView />;
			case "positions":
				return <MobilePositionsView />;
			case "account":
				return <MobileAccountView />;
			default:
				return null;
		}
	};

	return (
		<div className={cn("h-dvh w-full flex flex-col bg-bg text-fg font-mono", "overflow-hidden", className)}>
			<MobileHeader />
			<OfflineBanner />
			<main className="flex-1 min-h-0 overflow-hidden">{renderContent()}</main>
			<MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} badges={badges} />
		</div>
	);
}
