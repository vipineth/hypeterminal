import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAllMidsSubscription } from "@/hooks/hyperliquid/socket/use-all-mids-subscription";
import { TopNav } from "@/components/trade/header/top-nav";
import { FooterBar } from "@/components/trade/footer/footer-bar";
import { ASSET_TO_COIN } from "./constants";
import { SettingsButton, SettingsModal } from "./components/settings-modal";
import { TradingControls } from "./components/trading-controls";
import { useTapTradeActions, useTapTradeSettings, useTapTradePrice } from "./hooks/use-tap-trade-store";
import { formatPrice } from "./lib/calculations";

export function TapTradePage() {
	const { betAmount, asset, maxLeverage, hasSeenSettings } = useTapTradeSettings();
	const { currentPrice } = useTapTradePrice();
	const { setCurrentPrice, setIsSettingsOpen } = useTapTradeActions();

	// Subscribe to price updates
	const { data: mids } = useAllMidsSubscription<Record<string, string> | undefined>({
		select: (event) => event?.mids,
	});

	// Update current price when mids change
	useEffect(() => {
		const coin = ASSET_TO_COIN[asset];
		const mid = mids?.[coin];
		if (mid) {
			const price = parseFloat(mid);
			if (!Number.isNaN(price)) {
				setCurrentPrice(price);
			}
		}
	}, [mids, asset, setCurrentPrice]);

	// Auto-open settings on first visit
	useEffect(() => {
		if (!hasSeenSettings) {
			setIsSettingsOpen(true);
		}
	}, [hasSeenSettings, setIsSettingsOpen]);

	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono">
			<TopNav />

			<main className="flex-1 flex flex-col overflow-hidden">
				{/* Header Bar */}
				<div className="h-10 border-b border-border/60 px-4 flex items-center justify-between bg-surface/40">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium">{asset}</span>
						{currentPrice !== null && (
							<span className="text-sm font-bold text-terminal-cyan">
								${formatPrice(currentPrice, asset)}
							</span>
						)}
					</div>
					<SettingsButton />
				</div>

				{/* Trading Controls */}
				<TradingControls />

				{/* Bottom Controls Bar */}
				<div className="h-12 border-t border-border/60 px-4 flex items-center justify-between bg-surface/40">
					<div className="flex items-center gap-3 ml-auto">
						<div className="flex items-center gap-2">
							<span className="text-2xs text-muted-foreground">Bet:</span>
							<Button
								variant="outline"
								size="xs"
								onClick={() => setIsSettingsOpen(true)}
								className="min-w-[3rem]"
							>
								${betAmount}
							</Button>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-2xs text-muted-foreground">Max Lev:</span>
							<Button
								variant="outline"
								size="xs"
								onClick={() => setIsSettingsOpen(true)}
								className="min-w-[3rem]"
							>
								{maxLeverage}x
							</Button>
						</div>
					</div>
				</div>
			</main>

			<FooterBar />
			<SettingsModal />
		</div>
	);
}
