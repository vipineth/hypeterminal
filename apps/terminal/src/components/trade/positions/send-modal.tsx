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
import { type ChangeEvent, useCallback, useMemo, useState } from "react";
import { isAddress } from "viem";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import { exceedsBalance, getTokenTransferDecimals, isAmountWithinBalance } from "@/domain/market";
import { type BalanceRow, getPerpAvailable, getSpotAvailable, getSpotAvailableValue } from "@/domain/trade/balances";
import { useDefaultDexBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { useExchange } from "@/lib/hyperliquid";
import { useMarkets } from "@/lib/hyperliquid/markets/use-markets";
import { floorToString, limitDecimalInput } from "@/lib/trade/numbers";
import { formatTokenId } from "@/lib/trade/token-id";

type AccountType = "perp" | "spot";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialAsset?: string;
	initialAccountType?: AccountType;
}

export function SendModal({
	open,
	onOpenChange,
	initialAsset = DEFAULT_QUOTE_TOKEN,
	initialAccountType = "spot",
}: Props) {
	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size="sm">
				<SendModalBody
					key={`${initialAsset}:${initialAccountType}:${open ? "open" : "closed"}`}
					onOpenChange={onOpenChange}
					initialAsset={initialAsset}
					initialAccountType={initialAccountType}
				/>
			</ModalPopup>
		</Modal>
	);
}

interface BodyProps {
	onOpenChange: (open: boolean) => void;
	initialAsset: string;
	initialAccountType: AccountType;
}

function SendModalBody({ onOpenChange, initialAsset, initialAccountType }: BodyProps) {
	const [destination, setDestination] = useState("");
	const [accountType, setAccountType] = useState<AccountType>(initialAccountType);
	const [selectedToken, setSelectedToken] = useState(initialAsset);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { getToken } = useMarkets();
	const { mutateAsync: sendAsset, isPending: isSendAssetPending } = useExchange("sendAsset");
	const { mutateAsync: spotSend, isPending: isSpotSendPending } = useExchange("spotSend");
	const { perpSummary, spotBalances, spotAvailableAfterMaintenance } = useDefaultDexBalances();

	const isPending = isSendAssetPending || isSpotSendPending;

	const availableSpotTokens = useMemo((): BalanceRow[] => {
		if (!spotBalances?.length) return [];
		return spotBalances
			.filter((b) => {
				const available = getSpotAvailable(b, spotAvailableAfterMaintenance);
				return available > 0;
			})
			.map((b) => ({
				asset: b.coin,
				type: "spot" as const,
				available: getSpotAvailableValue(b, spotAvailableAfterMaintenance),
				inOrder: b.hold,
				total: b.total,
				usdValue: b.coin === DEFAULT_QUOTE_TOKEN ? b.total : b.entryNtl,
				entryNtl: b.entryNtl,
			}));
	}, [spotBalances, spotAvailableAfterMaintenance]);

	const tokenOptions = useMemo(() => {
		if (accountType === "perp") {
			return [DEFAULT_QUOTE_TOKEN];
		}
		return availableSpotTokens.map((b) => b.asset);
	}, [accountType, availableSpotTokens]);

	const tokenInfo = getToken(selectedToken);
	const tokenId = tokenInfo ? formatTokenId(tokenInfo) : "";

	const decimals = getTokenTransferDecimals(tokenInfo);

	const availableBalance = useMemo(() => {
		if (accountType === "perp") {
			return getPerpAvailable(perpSummary?.accountValue, perpSummary?.totalMarginUsed);
		}
		const balance = spotBalances?.find((b) => b.coin === selectedToken);
		return getSpotAvailable(balance, spotAvailableAfterMaintenance);
	}, [accountType, perpSummary, spotBalances, selectedToken, spotAvailableAfterMaintenance]);

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

	const accountTypeOptions = [
		{ value: "perp", label: t`Perps Account` },
		{ value: "spot", label: t`Spot Account` },
	];

	const tokenSelectOptions = tokenOptions.map((tokenName) => ({
		value: tokenName,
		label: tokenName,
	}));

	return (
		<>
			<ModalHeader>
				<ModalTitle>{t`Send Tokens`}</ModalTitle>
				<ModalDescription>{t`Send tokens to another account on the Hyperliquid L1.`}</ModalDescription>
			</ModalHeader>

			<ModalContent>
				<div className="space-y-4">
					<TextInput
						placeholder={t`Destination address`}
						value={destination}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
						autoComplete="off"
						spellCheck={false}
						className={cn(
							destination &&
								!isValidDestination &&
								"border-stroke-error-strong focus-visible:border-stroke-error-strong",
						)}
					/>

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
						label={t`Amount`}
						labelValue={
							<>
								Available:{" "}
								<span className="underline decoration-dashed underline-offset-2 decoration-fg-muted/50">
									{floorToString(availableBalance, decimals)} {selectedToken}
								</span>
							</>
						}
						onLabelValueClick={handleMaxClick}
						placeholder="0.00"
						value={amount}
						onChange={(e: ChangeEvent<HTMLInputElement>) => handleAmountChange(e.target.value)}
						className={cn(
							"w-full tabular-nums",
							exceedsBalance(amount, availableBalance) && "border-stroke-error-strong focus:border-stroke-error-strong",
						)}
					/>

					{error && (
						<div className="flex items-center gap-2 p-2.5 rounded-8 bg-error-soft border border-stroke-error-strong/20 text-xs text-error">
							<WarningCircleIcon className="size-3.5 shrink-0" />
							<span className="flex-1">{error}</span>
						</div>
					)}

					<Button variant="filled" intent="neutral" onClick={handleSend} disabled={!canSend} className="w-full">
						{isPending && <SpinnerGapIcon className="size-3.5 animate-spin mr-2" />}
						<PaperPlaneTiltIcon className="size-3.5 mr-2" />
						{isPending ? t`Sending...` : t`Send`}
					</Button>
				</div>
			</ModalContent>
		</>
	);
}
