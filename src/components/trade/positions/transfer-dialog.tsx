import Big from "big.js";
import { t } from "@lingui/core/macro";
import { ArrowRight, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchangeSendAsset } from "@/lib/hyperliquid/hooks/exchange";
import { limitDecimalInput } from "@/lib/trade/numbers";

type TransferDirection = "toSpot" | "toPerp";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	direction: TransferDirection;
	availableBalance: string;
}

const USDC_TOKEN = "USDC:0x6d1e7cde53ba9467b783cb7c530ce054";
const USDC_DECIMALS = 2;

export function TransferDialog({ open, onOpenChange, direction, availableBalance }: Props) {
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { address } = useConnection();
	const { mutateAsync: sendAsset, isPending } = useExchangeSendAsset();

	const amountBig = amount ? Big(amount) : Big(0);
	const availableBig = Big(availableBalance);
	const isValidAmount = amountBig.gt(0) && amountBig.lte(availableBig) && !!address;

	const fromLabel = direction === "toSpot" ? t`Perp` : t`Spot`;
	const toLabel = direction === "toSpot" ? t`Spot` : t`Perp`;
	const title = direction === "toSpot" ? t`Transfer to Spot` : t`Transfer to Perp`;

	const handleTransfer = useCallback(async () => {
		if (!isValidAmount || isPending || !address) return;

		setError(null);
		try {
			await sendAsset({
				destination: address,
				sourceDex: direction === "toSpot" ? "" : "spot",
				destinationDex: direction === "toSpot" ? "spot" : "",
				token: USDC_TOKEN,
				amount: amount,
			});
			setAmount("");
			onOpenChange(false);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`Transfer failed`;
			setError(message);
		}
	}, [address, amount, direction, isValidAmount, isPending, onOpenChange, sendAsset]);

	function handleAmountChange(value: string) {
		setAmount(limitDecimalInput(value, USDC_DECIMALS));
	}

	function handleMaxClick() {
		setAmount(Big(availableBalance).toFixed(USDC_DECIMALS));
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
					<DialogTitle className="text-sm font-medium">{title}</DialogTitle>
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
						<ArrowRight className="size-4 text-muted-fg" />
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
								amountBig.gt(availableBig) && "border-negative focus:border-negative",
							)}
						/>
					</div>

					{error && <div className="text-3xs text-negative">{error}</div>}

					<Button
						onClick={handleTransfer}
						disabled={!isValidAmount || isPending}
						className="w-full h-9 text-xs font-medium"
					>
						{isPending && <Loader2 className="size-3.5 animate-spin mr-2" />}
						{isPending ? t`Transferring...` : t`Transfer`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
