import { useConnection } from "wagmi";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useSubscription } from "@/lib/hyperliquid";
import { toNumber } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, useMobileActiveTab } from "@/stores/use-global-settings-store";
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
	const activeTab = useMobileActiveTab() as MobileTab;
	const { setMobileActiveTab } = useGlobalSettingsActions();
	const { address, isConnected } = useConnection();
	const { perpPositions } = useAccountBalances();

	const { data: ordersEvent } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);

	const positionsCount = isConnected
		? perpPositions.reduce((count, entry) => (toNumber(entry.position.szi) ? count + 1 : count), 0)
		: 0;

	const ordersCount = isConnected ? (ordersEvent?.orders?.length ?? 0) : 0;

	return (
		<div
			className={cn("h-dvh w-full flex flex-col bg-bg-sunken text-text-strong font-sans", "overflow-hidden", className)}
		>
			<MobileHeader />
			<OfflineBanner />
			<main className="flex-1 min-h-0 flex flex-col overflow-hidden">
				{activeTab === "chart" && <MobileChartView />}
				{activeTab === "book" && <MobileBookView />}
				{activeTab === "trade" && <MobileTradeView />}
				{activeTab === "positions" && <MobilePositionsView />}
				{activeTab === "account" && <MobileAccountView />}
			</main>
			<MobileBottomNav
				activeTab={activeTab}
				onTabChange={setMobileActiveTab}
				badges={{ positions: positionsCount + ordersCount }}
			/>
		</div>
	);
}
