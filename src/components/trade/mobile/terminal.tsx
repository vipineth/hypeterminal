import { useConnection } from "wagmi";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useSubOpenOrders } from "@/lib/hyperliquid/hooks/subscription";
import { toNumber } from "@/lib/trade/numbers";
import { MobileFloatingNav } from "./floating-nav";
import { MobileHeader } from "./header";
import { MobileMainScreen } from "./main-screen";
import { MobilePwaBanner } from "./pwa/banner";
import { OfflineBanner } from "./pwa/offline-banner";

interface Props {
	className?: string;
}

export function MobileTerminal({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { perpPositions } = useAccountBalances();
	const { data: ordersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const openOrders = ordersEvent?.orders;

	const positionsCount = isConnected
		? perpPositions.reduce((count, entry) => {
				const size = toNumber(entry.position.szi);
				if (!size) return count;
				return count + 1;
			}, 0)
		: 0;

	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;

	const badges = { positions: positionsCount + ordersCount };

	return (
		<div
			className={cn("h-dvh w-full flex flex-col bg-surface-base text-text-950 font-mono", "overflow-hidden", className)}
		>
			<MobileHeader />
			<OfflineBanner />
			<main className="flex-1 min-h-0 overflow-hidden">
				<MobileMainScreen />
			</main>
			<MobileFloatingNav badges={badges} />
			<MobilePwaBanner />
		</div>
	);
}
