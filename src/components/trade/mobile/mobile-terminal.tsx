import { useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { useOpenOrders } from "@/hooks/hyperliquid/use-open-orders";
import { parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { MobileAccountView } from "./mobile-account-view";
import { MobileBookView } from "./mobile-book-view";
import { MobileBottomNav, type MobileTab } from "./mobile-bottom-nav";
import { MobileChartView } from "./mobile-chart-view";
import { MobileHeader } from "./mobile-header";
import { MobilePositionsView } from "./mobile-positions-view";
import { MobileTradeView } from "./mobile-trade-view";
import { OfflineBanner } from "./offline-banner";

interface MobileTerminalProps {
	className?: string;
}

export function MobileTerminal({ className }: MobileTerminalProps) {
	const [activeTab, setActiveTab] = useState<MobileTab>("chart");

	const { address, isConnected } = useConnection();
	const { data: state } = useClearinghouseState({ user: isConnected ? address : undefined });
	const { data: openOrders } = useOpenOrders({ user: isConnected ? address : undefined });

	// Badge counts for bottom nav
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
		<div
			className={cn("h-dvh w-full flex flex-col bg-background text-foreground font-mono", "overflow-hidden", className)}
		>
			<MobileHeader />
			<OfflineBanner />
			<main className="flex-1 min-h-0 overflow-hidden">{renderContent()}</main>
			<MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} badges={badges} />
		</div>
	);
}
