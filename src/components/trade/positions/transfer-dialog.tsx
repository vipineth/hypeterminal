import { t } from "@lingui/core/macro";
import { ArrowsLeftRight, SpinnerGap } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { exceedsBalance, isAmountWithinBalance } from "@/domain/market";
import { getAvailableFromTotals, getPerpAvailable, getSpotBalance } from "@/domain/trade/balances";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchangeSendAsset } from "@/lib/hyperliquid/hooks/exchange";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { floorToString, limitDecimalInput } from "@/lib/trade/numbers";

type TransferDirection = "toSpot" | "toPerp";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialDirection?: TransferDirection;
}

export function TransferDialog({ open, onOpenChange, initialDirection = "toSpot" }: Props) {
	const [direction, setDirection] = useState<TransferDirection>(initialDirection);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { address } = useConnection();
	const { getToken } = useSpotTokens();
	const { mutateAsync: sendAsset, isPending } = useExchangeSendAsset();
	const { perpSummary, spotBalances } = useAccountBalances();

	useEffect(() => {
		if (open) {
			setDirection(initialDirection);
		}
	}, [open, initialDirection]);

	const usdcTokenInfo = useMemo(() => getToken(DEFAULT_QUOTE_TOKEN), [getToken]);
	const usdcTokenId = useMemo(() => {
		if (!usdcTokenInfo) return "";
		const tokenId = usdcTokenInfo.tokenId;
		return `${usdcTokenInfo.name}:${tokenId}`;
	}, [usdcTokenInfo]);

	const usdcDecimals = useMemo(() => getToken(DEFAULT_QUOTE_TOKEN)?.weiDecimals ?? 2, [getToken]);

	const spotUsdcBal = useMemo(() => getSpotBalance(spotBalances, DEFAULT_QUOTE_TOKEN), [spotBalances]);
	const availableBalanceValue = useMemo(() => {
		if (direction === "toSpot") {
			return getPerpAvailable(perpSummary?.accountValue, perpSummary?.totalMarginUsed);
		}

		return getAvailableFromTotals(spotUsdcBal?.total, spotUsdcBal?.hold);
	}, [direction, perpSummary, spotUsdcBal]);

	const availableBalance = useMemo(
		() => floorToString(availableBalanceValue, usdcDecimals),
		[availableBalanceValue, usdcDecimals],
	);

	const isValidAmount = isAmountWithinBalance(amount, availableBalanceValue) && !!address && !!usdcTokenId;

	const fromLabel = direction === "toSpot" ? t`Perp` : t`Spot`;
	const toLabel = direction === "toSpot" ? t`Spot` : t`Perp`;

	function handleFlip() {
		setDirection((prev) => (prev === "toSpot" ? "toPerp" : "toSpot"));
		setAmount("");
	}

	const handleTransfer = useCallback(async () => {
		if (!isValidAmount || isPending || !address) return;

		setError(null);
		try {
			await sendAsset({
				destination: address,
				sourceDex: direction === "toSpot" ? "" : "spot",
				destinationDex: direction === "toSpot" ? "spot" : "",
				token: usdcTokenId,
				amount: amount,
			});
			setAmount("");
			onOpenChange(false);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`Transfer failed`;
			setError(message);
		}
	}, [address, amount, direction, isValidAmount, isPending, onOpenChange, sendAsset, usdcTokenId]);

	function handleAmountChange(value: string) {
		setAmount(limitDecimalInput(value, usdcDecimals));
	}

	function handleMaxClick() {
		setAmount(floorToString(availableBalanceValue, usdcDecimals));
	}

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			setAmount("");
			setError(null);
		}
		onOpenChange(newOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-sm font-medium">{t`Transfer USDC`}</DialogTitle>
					<DialogDescription className="text-3xs text-muted-fg">
						{t`Move USDC between your Perp and Spot accounts.`}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex items-center justify-center gap-3 py-2">
						<div className="flex flex-col items-center">
							<span
								className={cn(
									"text-3xs px-2 py-1 uppercase font-medium",
									direction === "toSpot" ? "bg-highlight/20 text-highlight" : "bg-warning/20 text-warning",
								)}
							>
								{fromLabel}
							</span>
						</div>
						<button
							type="button"
							onClick={handleFlip}
							className="p-1.5 rounded-sm hover:bg-accent/50 transition-colors text-muted-fg hover:text-info"
						>
							<ArrowsLeftRight className="size-4" />
						</button>
						<div className="flex flex-col items-center">
							<span
								className={cn(
									"text-3xs px-2 py-1 uppercase font-medium",
									direction === "toPerp" ? "bg-highlight/20 text-highlight" : "bg-warning/20 text-warning",
								)}
							>
								{toLabel}
							</span>
						</div>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<span className="text-4xs uppercase tracking-wider text-muted-fg">{t`Amount (USDC)`}</span>
							<button
								type="button"
								onClick={handleMaxClick}
								className="text-4xs text-info hover:text-info/80 transition-colors"
							>
								{t`Max`}: {formatToken(availableBalance, 2)}
							</button>
						</div>
						<NumberInput
							placeholder="0.00"
							value={amount}
							onChange={(e) => handleAmountChange(e.target.value)}
							className={cn(
								"w-full h-9 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums",
								exceedsBalance(amount, availableBalanceValue) && "border-negative focus:border-negative",
							)}
						/>
					</div>

					{error && <div className="text-3xs text-negative">{error}</div>}

					<Button
						onClick={handleTransfer}
						disabled={!isValidAmount || isPending}
						className="w-full h-9 text-xs font-medium"
					>
						{isPending && <SpinnerGap className="size-3.5 animate-spin mr-2" />}
						{isPending ? t`Transferring...` : t`Transfer`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
