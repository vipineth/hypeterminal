import { Copy, ExternalLink, LogOut, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { useConnection, useDisconnect } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_TEXT } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-deposit-modal-store";
import { WalletDialog } from "../components/wallet-dialog";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ACCOUNT_TEXT = UI_TEXT.ACCOUNT_PANEL;

interface MobileAccountViewProps {
	className?: string;
}

export function MobileAccountView({ className }: MobileAccountViewProps) {
	const { address, isConnected } = useConnection();
	const { disconnect } = useDisconnect();

	const { data: stateEvent, status } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const state = stateEvent?.clearinghouseState;
	const isLoading = status === "subscribing" || status === "idle";

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const { open: openDepositModal } = useDepositModalActions();

	const handleCopyAddress = async () => {
		if (!address) return;
		await navigator.clipboard.writeText(address);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Parse account data
	const crossMargin = state?.crossMarginSummary;
	const accountValue = parseNumber(crossMargin?.accountValue) || 0;
	const totalMarginUsed = parseNumber(crossMargin?.totalMarginUsed) || 0;
	const totalNtlPos = parseNumber(crossMargin?.totalNtlPos) || 0;
	const totalRawUsd = parseNumber(crossMargin?.totalRawUsd) || 0;

	const availableBalance = Math.max(0, accountValue - totalMarginUsed);
	const marginRatio = accountValue > 0 ? totalMarginUsed / accountValue : 0;

	// Calculate unrealized PnL from positions
	const unrealizedPnl =
		state?.assetPositions?.reduce((sum, pos) => {
			const pnl = parseNumber(pos.position.unrealizedPnl);
			return sum + (Number.isFinite(pnl) ? pnl : 0);
		}, 0) ?? 0;

	if (!isConnected) {
		return (
			<div className={cn("flex flex-col h-full min-h-0 bg-surface/20", className)}>
				<div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
					<div className="size-20 rounded-full bg-muted/50 flex items-center justify-center">
						<Wallet className="size-10 text-muted-foreground" />
					</div>
					<div className="text-center space-y-2">
						<h2 className="text-lg font-semibold">Connect Wallet</h2>
						<p className="text-sm text-muted-foreground max-w-xs">
							Connect your wallet to view your account, positions, and start trading.
						</p>
					</div>
					<Button
						variant="ghost"
						size="none"
						onClick={() => setWalletDialogOpen(true)}
						className={cn(
							"px-6 py-3 text-base font-semibold rounded-md",
							"bg-terminal-cyan/20 border border-terminal-cyan text-terminal-cyan",
							"hover:bg-terminal-cyan/30 transition-colors",
							"min-h-[48px]",
						)}
					>
						Connect Wallet
					</Button>
				</div>
				<MobileBottomNavSpacer />
				<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-surface/20", className)}>
			{/* Account header */}
			<div className="shrink-0 px-4 py-4 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-full bg-terminal-cyan/20 flex items-center justify-center">
							<span className="text-terminal-cyan font-bold">{address?.slice(2, 4).toUpperCase()}</span>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="font-mono text-sm">
									{address?.slice(0, 6)}...{address?.slice(-4)}
								</span>
								<Button
									variant="ghost"
									size="none"
									onClick={handleCopyAddress}
									className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
									aria-label="Copy address"
								>
									<Copy className={cn("size-3.5", copied && "text-terminal-green")} />
								</Button>
							</div>
							<Badge variant="outline" className="text-xs mt-0.5">
								Cross Margin
							</Badge>
						</div>
					</div>
					<Button
						variant="ghost"
						size="none"
						onClick={() => disconnect()}
						className={cn(
							"p-2.5 text-muted-foreground hover:text-terminal-red",
							"transition-colors rounded-md hover:bg-transparent",
							"min-h-[44px] min-w-[44px] flex items-center justify-center",
						)}
						aria-label="Disconnect wallet"
					>
						<LogOut className="size-5" />
					</Button>
				</div>
			</div>

			{/* Account stats */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="p-4 space-y-4">
					{/* Main balance card */}
					<div className="p-4 rounded-lg border border-border/60 bg-surface/30">
						{isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-4 w-24" />
							</div>
						) : (
							<>
								<div className="text-sm text-muted-foreground mb-1">{ACCOUNT_TEXT.EQUITY_LABEL}</div>
								<div className="text-3xl font-bold tabular-nums">{formatUSD(accountValue)}</div>
								<div
									className={cn(
										"text-sm tabular-nums mt-1",
										unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
									)}
								>
									{unrealizedPnl >= 0 ? "+" : ""}
									{formatUSD(unrealizedPnl)} {ACCOUNT_TEXT.UNREALIZED_LABEL}
								</div>
							</>
						)}
					</div>

					{/* Stats grid */}
					<div className="grid grid-cols-2 gap-3">
						<StatCard
							label={ACCOUNT_TEXT.AVAILABLE_LABEL}
							value={formatUSD(availableBalance)}
							valueClass="text-terminal-green"
							isLoading={isLoading}
						/>
						<StatCard label={ACCOUNT_TEXT.MARGIN_USED_LABEL} value={formatUSD(totalMarginUsed)} isLoading={isLoading} />
						<StatCard
							label={ACCOUNT_TEXT.MARGIN_RATIO_LABEL}
							value={formatPercent(marginRatio)}
							valueClass={marginRatio > 0.8 ? "text-terminal-red" : marginRatio > 0.5 ? "text-terminal-amber" : ""}
							isLoading={isLoading}
						/>
						<StatCard label="Total Position" value={formatUSD(Math.abs(totalNtlPos))} isLoading={isLoading} />
					</div>

					{/* Actions */}
					<div className="grid grid-cols-2 gap-3 pt-2">
						<Button
							variant="ghost"
							size="none"
							onClick={() => openDepositModal("deposit")}
							className={cn(
								"py-4 text-base font-semibold rounded-md",
								"bg-terminal-green/20 border border-terminal-green text-terminal-green",
								"hover:bg-terminal-green/30 transition-colors",
								"flex items-center justify-center gap-2",
								"min-h-[56px]",
							)}
						>
							<Zap className="size-5" />
							{ACCOUNT_TEXT.DEPOSIT_LABEL}
						</Button>
						<Button
							variant="ghost"
							size="none"
							className={cn(
								"py-4 text-base font-semibold rounded-md",
								"bg-muted/50 border border-border/60 text-muted-foreground",
								"hover:bg-muted transition-colors",
								"flex items-center justify-center gap-2",
								"min-h-[56px]",
							)}
							disabled
						>
							<ExternalLink className="size-5" />
							{ACCOUNT_TEXT.WITHDRAW_LABEL}
						</Button>
					</div>

					{/* Additional info */}
					<div className="pt-4 space-y-3">
						<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Details</h3>
						<div className="space-y-2 text-sm">
							<DetailRow label="Account Value" value={formatUSD(accountValue)} isLoading={isLoading} />
							<DetailRow label="Total Raw USD" value={formatUSD(totalRawUsd)} isLoading={isLoading} />
							<DetailRow
								label="Cross Leverage"
								value={
									totalMarginUsed > 0 && accountValue > 0 ? `${(totalNtlPos / accountValue).toFixed(2)}x` : "0.00x"
								}
								isLoading={isLoading}
							/>
						</div>
					</div>
				</div>
			</div>

			<MobileBottomNavSpacer />
		</div>
	);
}

interface StatCardProps {
	label: string;
	value: string;
	valueClass?: string;
	isLoading?: boolean;
}

function StatCard({ label, value, valueClass, isLoading }: StatCardProps) {
	return (
		<div className="p-3 rounded-lg border border-border/40 bg-surface/20">
			<div className="text-xs text-muted-foreground mb-1">{label}</div>
			{isLoading ? (
				<Skeleton className="h-6 w-20" />
			) : (
				<div className={cn("text-lg font-semibold tabular-nums", valueClass)}>{value}</div>
			)}
		</div>
	);
}

interface DetailRowProps {
	label: string;
	value: string;
	isLoading?: boolean;
}

function DetailRow({ label, value, isLoading }: DetailRowProps) {
	return (
		<div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
			<span className="text-muted-foreground">{label}</span>
			{isLoading ? <Skeleton className="h-4 w-16" /> : <span className="tabular-nums font-medium">{value}</span>}
		</div>
	);
}
