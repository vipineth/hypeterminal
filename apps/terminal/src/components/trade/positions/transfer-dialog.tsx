import { Button, Modal, ModalContent, ModalDescription, ModalHeader, ModalPopup, ModalTitle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { exceedsBalance, isAmountWithinBalance } from "@/domain/market";
import { getAvailableFromTotals, getPerpAvailable, getSpotBalance } from "@/domain/trade/balances";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchange } from "@/lib/hyperliquid";
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
	const { mutateAsync: sendAsset, isPending } = useExchange("sendAsset");
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
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalPopup size="sm">
				<ModalHeader>
					<ModalTitle>{t`Transfer USDC`}</ModalTitle>
					<ModalDescription>{t`Move USDC between your Perp and Spot accounts.`}</ModalDescription>
				</ModalHeader>

				<ModalContent>
					<div className="space-y-4">
						<div className="flex items-center justify-center gap-3 py-2">
							<div className="flex flex-col items-center">
								<span
									className={cn(
										"text-xs px-2 py-1 uppercase font-medium",
										direction === "toSpot"
											? "bg-fill-brand-strong/20 text-text-brand"
											: "bg-fill-warning-strong/20 text-text-warning",
									)}
								>
									{fromLabel}
								</span>
							</div>
							<button
								type="button"
								onClick={handleFlip}
								className="p-1.5 rounded-8 hover:bg-bg-raised/50 transition-colors text-text-weak hover:text-text-brand"
							>
								<ArrowsLeftRightIcon className="size-4" />
							</button>
							<div className="flex flex-col items-center">
								<span
									className={cn(
										"text-xs px-2 py-1 uppercase font-medium",
										direction === "toPerp"
											? "bg-fill-brand-strong/20 text-text-brand"
											: "bg-fill-warning-strong/20 text-text-warning",
									)}
								>
									{toLabel}
								</span>
							</div>
						</div>

						<div className="space-y-1.5">
							<span className="text-xs uppercase tracking-wider text-text-strong">{t`Amount (USDC)`}</span>
							<NumberInput
								placeholder="0.00"
								value={amount}
								onChange={(e) => handleAmountChange(e.target.value)}
								maxLabel={
									<>
										{t`MAX`}: {formatToken(availableBalance, 2)}
									</>
								}
								onMaxClick={handleMaxClick}
								className={cn(
									"w-full h-9 text-sm bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums",
									exceedsBalance(amount, availableBalanceValue) &&
										"border-stroke-error-strong focus:border-stroke-error-strong",
								)}
							/>
						</div>

						{error && (
							<div className="flex items-center gap-2 p-2.5 rounded-8 bg-fill-error-weak border border-stroke-error-strong/20 text-xs text-text-error">
								<WarningCircleIcon className="size-3.5 shrink-0" />
								<span className="flex-1">{error}</span>
							</div>
						)}

						<Button onClick={handleTransfer} disabled={!isValidAmount || isPending} size="lg" className="w-full">
							{isPending && <SpinnerGapIcon className="size-3.5 animate-spin mr-2" />}
							{isPending ? t`Transferring...` : t`Transfer`}
						</Button>
					</div>
				</ModalContent>
			</ModalPopup>
		</Modal>
	);
}
