import { t } from "@lingui/core/macro";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { exceedsBalance, isAmountWithinBalance } from "@/domain/market";
import { type BalanceRow, getAvailableFromTotals, getPerpAvailable } from "@/domain/trade/balances";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchangeSendAsset } from "@/lib/hyperliquid/hooks/exchange";
import { useExchangeSpotSend } from "@/lib/hyperliquid/hooks/exchange/useExchangeSpotSend";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { floorToString, limitDecimalInput } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";

type AccountType = "perp" | "spot";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialAsset?: string;
	initialAccountType?: AccountType;
}

export function SendDialog({
	open,
	onOpenChange,
	initialAsset = DEFAULT_QUOTE_TOKEN,
	initialAccountType = "spot",
}: Props) {
	const [destination, setDestination] = useState("");
	const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
	const [selectedToken, setSelectedToken] = useState(initialAsset);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { getToken } = useSpotTokens();
	const { mutateAsync: sendAsset, isPending: isSendAssetPending } = useExchangeSendAsset();
	const { mutateAsync: spotSend, isPending: isSpotSendPending } = useExchangeSpotSend();
	const { perpSummary, spotBalances } = useAccountBalances();

	const isPending = isSendAssetPending || isSpotSendPending;

	const availableSpotTokens = useMemo((): BalanceRow[] => {
		if (!spotBalances?.length) return [];
		return spotBalances
			.filter((b) => {
				const available = getAvailableFromTotals(b.total, b.hold);
				return available > 0;
			})
			.map((b) => ({
				asset: b.coin,
				type: "spot" as const,
				available: String(getAvailableFromTotals(b.total, b.hold)),
				inOrder: b.hold,
				total: b.total,
				usdValue: b.coin === DEFAULT_QUOTE_TOKEN ? b.total : b.entryNtl,
				entryNtl: b.entryNtl,
			}));
	}, [spotBalances]);

	const tokenOptions = useMemo(() => {
		if (accountType === "perp") {
			return [DEFAULT_QUOTE_TOKEN];
		}
		return availableSpotTokens.map((b) => b.asset);
	}, [accountType, availableSpotTokens]);

	const tokenInfo = useMemo(() => getToken(selectedToken), [getToken, selectedToken]);
	const tokenId = useMemo(() => {
		if (!tokenInfo) return "";
		return `${tokenInfo.name}:${tokenInfo.tokenId}`;
	}, [tokenInfo]);

	const decimals = useMemo(() => getToken(selectedToken)?.weiDecimals ?? 2, [getToken, selectedToken]);

	const availableBalance = useMemo(() => {
		if (accountType === "perp") {
			return getPerpAvailable(perpSummary?.accountValue, perpSummary?.totalMarginUsed);
		}
		const balance = spotBalances?.find((b) => b.coin === selectedToken);
		return getAvailableFromTotals(balance?.total, balance?.hold);
	}, [accountType, perpSummary, spotBalances, selectedToken]);

	const availableBalanceStr = useMemo(() => floorToString(availableBalance, decimals), [availableBalance, decimals]);

	const isValidDestination = isAddress(destination);
	const isValidAmount = isAmountWithinBalance(amount, availableBalance);
	const canSend = isValidDestination && isValidAmount && !!tokenId && !isPending;

	function handleAccountTypeChange(value: AccountType) {
		setAccountType(value);
		if (value === "perp") {
			setSelectedToken(DEFAULT_QUOTE_TOKEN);
		} else if (!availableSpotTokens.some((t) => t.asset === selectedToken)) {
			setSelectedToken(availableSpotTokens[0]?.asset ?? DEFAULT_QUOTE_TOKEN);
		}
		setAmount("");
	}

	function handleTokenChange(value: string) {
		setSelectedToken(value);
		setAmount("");
	}

	function handleAmountChange(value: string) {
		setAmount(limitDecimalInput(value, decimals));
	}

	function handleMaxClick() {
		setAmount(floorToString(availableBalance, decimals));
	}

	const handleSend = useCallback(async () => {
		if (!canSend) return;

		setError(null);
		try {
			if (accountType === "perp") {
				await sendAsset({
					destination,
					sourceDex: "",
					destinationDex: "",
					token: tokenId,
					amount,
				});
			} else {
				await spotSend({
					destination,
					token: tokenId,
					amount,
				});
			}
			setDestination("");
			setAmount("");
			onOpenChange(false);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`Send failed`;
			setError(message);
		}
	}, [accountType, amount, canSend, destination, onOpenChange, sendAsset, spotSend, tokenId]);

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			setDestination("");
			setAmount("");
			setError(null);
		}
		onOpenChange(newOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-sm font-medium">{t`Send Tokens`}</DialogTitle>
					<DialogDescription className="text-3xs text-muted-fg">
						{t`Send tokens to another account on the Hyperliquid L1.`}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Input
							placeholder={t`Destination`}
							value={destination}
							onChange={(e) => setDestination(e.target.value)}
							inputSize="lg"
							className={cn(
								"w-full bg-bg/50 border-border/60",
								destination && !isValidDestination && "border-negative focus-visible:border-negative",
							)}
						/>
					</div>

					<div className="flex gap-2">
						<Select value={accountType} onValueChange={(v) => handleAccountTypeChange(v as AccountType)}>
							<SelectTrigger className="flex-1 h-10 bg-bg/50 border-border/60">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="perp">{t`Perps Account`}</SelectItem>
								<SelectItem value="spot">{t`Spot Account`}</SelectItem>
							</SelectContent>
						</Select>

						<Select value={selectedToken} onValueChange={handleTokenChange}>
							<SelectTrigger className="flex-1 h-10 bg-bg/50 border-border/60">
								<AssetDisplay
									asset={getToken(selectedToken) ?? { displayName: selectedToken, iconUrl: undefined }}
									hideIcon
								/>
							</SelectTrigger>
							<SelectContent>
								{tokenOptions.map((tokenName) => (
									<SelectItem key={tokenName} value={tokenName}>
										<AssetDisplay
											asset={getToken(tokenName) ?? { displayName: tokenName, iconUrl: undefined }}
											hideIcon
										/>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<div className="relative">
							<NumberInput
								placeholder={t`Amount`}
								value={amount}
								onChange={(e) => handleAmountChange(e.target.value)}
								className={cn(
									"w-full h-10 text-sm bg-bg/50 border-border/60 pr-24 tabular-nums",
									exceedsBalance(amount, availableBalance) && "border-negative focus:border-negative",
								)}
							/>
							<button
								type="button"
								onClick={handleMaxClick}
								className="absolute right-2 top-1/2 -translate-y-1/2 text-3xs text-info hover:text-info/80 transition-colors"
							>
								{t`MAX`}: {formatToken(availableBalanceStr, 2)}
							</button>
						</div>
					</div>

					{error && <div className="text-3xs text-negative">{error}</div>}

					<Button onClick={handleSend} disabled={!canSend} className="w-full h-10 text-xs font-medium">
						{isPending && <SpinnerGap className="size-3.5 animate-spin mr-2" />}
						<PaperPlaneTilt className="size-3.5 mr-2" />
						{isPending ? t`Sending...` : t`Send`}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
