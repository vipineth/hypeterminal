import { useConnection } from "wagmi";
import { HL_ALL_DEXS } from "@/config/app";
import { cn } from "@/lib/cn";
import { useSubscription, useUserPositions } from "@/lib/hyperliquid";
import { toNumber } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, useMobileActiveTab, useMobileMarketOpen } from "@/stores/use-global-settings-store";
import { OrderToast } from "../tradebox/order-toast";
import { MobileAccountView } from "./mobile-account-view";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileHeader } from "./mobile-header";
import { MobileMarketPage } from "./mobile-market-page";
import { MobileMarketsView } from "./mobile-markets-view";
import { MobilePositionsView } from "./mobile-positions-view";
import { OfflineBanner } from "./offline-banner";

interface Props {
	className?: string;
}

export function MobileTerminal({ className }: Props) {
	const activeTab = useMobileActiveTab();
	const marketOpen = useMobileMarketOpen();
	const { setMobileActiveTab } = useGlobalSettingsActions();
	const { address, isConnected } = useConnection();
	const { positions } = useUserPositions();

	const { data: ordersEvent } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);

	const positionsCount = isConnected
		? positions.reduce((count, entry) => (toNumber(entry.szi) ? count + 1 : count), 0)
		: 0;

	const ordersCount = isConnected ? (ordersEvent?.orders?.length ?? 0) : 0;

	return (
		<div className={cn("h-dvh w-full flex flex-col bg-background text-fg font-sans", "overflow-hidden", className)}>
			{!marketOpen && <MobileHeader />}
			<OfflineBanner />
			<main className="flex-1 min-h-0 flex flex-col overflow-hidden">
				{marketOpen ? (
					<MobileMarketPage />
				) : (
					<>
						{activeTab === "home" && <MobileAccountView />}
						{activeTab === "markets" && <MobileMarketsView />}
						{activeTab === "activity" && <MobilePositionsView />}
					</>
				)}
			</main>
			<MobileBottomNav
				activeTab={activeTab}
				onTabChange={setMobileActiveTab}
				badges={{ activity: positionsCount + ordersCount }}
			/>
			<OrderToast />
		</div>
	);
}
