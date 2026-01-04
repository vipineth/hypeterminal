import { Settings2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TAP_TRADE_CONFIG } from "../constants";
import { useTapTradeActions, useTapTradeSettings } from "../hooks/use-tap-trade-store";
import type { BetAmount, MaxLeverage, TapAsset } from "../types";

export function SettingsModal() {
	const { betAmount, asset, maxLeverage, isSettingsOpen } = useTapTradeSettings();
	const { setBetAmount, setAsset, setMaxLeverage, setIsSettingsOpen, setHasSeenSettings } =
		useTapTradeActions();

	const handleOpenChange = (open: boolean) => {
		setIsSettingsOpen(open);
		if (!open) {
			setHasSeenSettings(true);
		}
	};

	return (
		<Dialog open={isSettingsOpen} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Settings2Icon className="size-5" />
						Tap Trade Settings
					</DialogTitle>
					<DialogDescription>
						Configure your trading preferences. These settings apply to all trades.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Asset Selection */}
					<div className="space-y-2">
						<span className="text-sm font-medium">Asset</span>
						<div className="flex gap-2">
							{TAP_TRADE_CONFIG.SUPPORTED_ASSETS.map((a) => (
								<Button
									key={a}
									variant={asset === a ? "default" : "outline"}
									size="sm"
									onClick={() => setAsset(a as TapAsset)}
									className="flex-1"
								>
									{a}
								</Button>
							))}
						</div>
					</div>

					{/* Bet Amount Selection */}
					<div className="space-y-2">
						<span className="text-sm font-medium">Bet Amount</span>
						<div className="flex gap-2">
							{TAP_TRADE_CONFIG.BET_AMOUNTS.map((amount) => (
								<Button
									key={amount}
									variant={betAmount === amount ? "default" : "outline"}
									size="sm"
									onClick={() => setBetAmount(amount as BetAmount)}
									className="flex-1"
								>
									${amount}
								</Button>
							))}
						</div>
					</div>

					{/* Max Leverage Selection */}
					<div className="space-y-2">
						<span className="text-sm font-medium">Max Leverage</span>
						<div className="flex gap-2 flex-wrap">
							{TAP_TRADE_CONFIG.MAX_LEVERAGE_OPTIONS.map((lev) => (
								<Button
									key={lev}
									variant={maxLeverage === lev ? "default" : "outline"}
									size="sm"
									onClick={() => setMaxLeverage(lev as MaxLeverage)}
									className={cn("min-w-[4rem]")}
								>
									{lev}x
								</Button>
							))}
						</div>
						<p className="text-xs text-muted-foreground">
							Higher leverage means higher risk. Positions can be liquidated if price moves against you.
						</p>
					</div>
				</div>

				{/* Close Button */}
				<div className="flex justify-end">
					<Button onClick={() => handleOpenChange(false)}>Done</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function SettingsButton() {
	const { setIsSettingsOpen } = useTapTradeActions();

	return (
		<Button
			variant="outline"
			size="icon-sm"
			onClick={() => setIsSettingsOpen(true)}
			className="shrink-0"
		>
			<Settings2Icon className="size-4" />
		</Button>
	);
}
