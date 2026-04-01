import {
	Button,
	Modal,
	ModalContent,
	ModalDescription,
	ModalHeader,
	ModalPopup,
	ModalTitle,
	Select,
	TextInput,
} from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { PaperPlaneTiltIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { isAddress } from "viem";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { exceedsBalance, isAmountWithinBalance } from "@/domain/market";
import { type BalanceRow, getAvailableFromTotals, getPerpAvailable } from "@/domain/trade/balances";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchange } from "@/lib/hyperliquid";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { floorToString, limitDecimalInput } from "@/lib/trade/numbers";

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
	const { mutateAsync: sendAsset, isPending: isSendAssetPending } = useExchange("sendAsset");
	const { mutateAsync: spotSend, isPending: isSpotSendPending } = useExchange("spotSend");
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

	const decimals = useMemo(() => getToken(selectedToken)?.transferDecimals ?? 2, [getToken, selectedToken]);

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

	function handleAccountTypeChange(value: string | null) {
		if (!value) return;
		const v = value as AccountType;
		setAccountType(v);
		if (v === "perp") {
			setSelectedToken(DEFAULT_QUOTE_TOKEN);
		} else if (!availableSpotTokens.some((t) => t.asset === selectedToken)) {
			setSelectedToken(availableSpotTokens[0]?.asset ?? DEFAULT_QUOTE_TOKEN);
		}
		setAmount("");
	}

	function handleTokenChange(value: string | null) {
		if (!value) return;
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

	const accountTypeOptions = [
		{ value: "perp", label: t`Perps Account` },
		{ value: "spot", label: t`Spot Account` },
	];

	const tokenSelectOptions = tokenOptions.map((tokenName) => ({
		value: tokenName,
		label: tokenName,
	}));

	return (
		<Modal open={open} onOpenChange={handleOpenChange}>
			<ModalPopup size="sm">
				<ModalHeader>
					<ModalTitle>{t`Send Tokens`}</ModalTitle>
					<ModalDescription>{t`Send tokens to another account on the Hyperliquid L1.`}</ModalDescription>
				</ModalHeader>

				<ModalContent>
					<div className="space-y-4">
						<div className="space-y-1.5">
							<TextInput
								placeholder={t`Destination`}
								value={destination}
								onChange={(e) => setDestination(e.target.value)}
								size="lg"
								className={cn(
									destination &&
										!isValidDestination &&
										"border-stroke-error-strong focus-visible:border-stroke-error-strong",
								)}
							/>
						</div>

						<div className="flex gap-2">
							<Select
								value={accountType}
								onValueChange={handleAccountTypeChange}
								options={accountTypeOptions}
								className="flex-1"
							/>

							<Select
								value={selectedToken}
								onValueChange={handleTokenChange}
								options={tokenSelectOptions}
								className="flex-1"
							/>
						</div>

						<NumberInput
							placeholder={t`Amount`}
							value={amount}
							onChange={(e) => handleAmountChange(e.target.value)}
							maxLabel={
								<>
									{t`MAX`}: {formatToken(availableBalanceStr, 2)}
								</>
							}
							onMaxClick={handleMaxClick}
							className={cn(
								"w-full h-10 text-sm bg-bg-sunken/50 border-stroke-weak/60 tabular-nums",
								exceedsBalance(amount, availableBalance) &&
									"border-stroke-error-strong focus:border-stroke-error-strong",
							)}
						/>

						{error && (
							<div className="flex items-center gap-2 p-2.5 rounded-8 bg-fill-error-weak border border-stroke-error-strong/20 text-xs text-text-error">
								<WarningCircleIcon className="size-3.5 shrink-0" />
								<span className="flex-1">{error}</span>
							</div>
						)}

						<Button onClick={handleSend} disabled={!canSend} size="lg" className="w-full">
							{isPending && <SpinnerGapIcon className="size-3.5 animate-spin mr-2" />}
							<PaperPlaneTiltIcon className="size-3.5 mr-2" />
							{isPending ? t`Sending...` : t`Send`}
						</Button>
					</div>
				</ModalContent>
			</ModalPopup>
		</Modal>
	);
}
