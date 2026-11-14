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
import { type ChangeEvent, useCallback, useState } from "react";
import { isAddress } from "viem";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { exceedsBalance, getTokenTransferDecimals } from "@/domain/market";
import { getSpendableSpotTokens, getSpendLimit, isWithinSpendLimit } from "@/domain/trade/balances";
import { useAccountState } from "@/hooks/trade/use-account-balances";
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
	const account = useAccountState();

	const isPending = isSendAssetPending || isSpotSendPending;

	const spendableSpotTokens = account.status === "ready" ? getSpendableSpotTokens(account) : [];
	const tokenOptions = accountType === "perp" ? [DEFAULT_QUOTE_TOKEN] : spendableSpotTokens;

	const tokenInfo = getToken(selectedToken);
	const tokenId = tokenInfo ? formatTokenId(tokenInfo) : "";

	const decimals = getTokenTransferDecimals(tokenInfo);

	const limit = getSpendLimit(account, accountType, selectedToken);
	const available = limit.status === "ready" ? limit.amount : null;

	const isValidDestination = isAddress(destination);
	const isValidAmount = isWithinSpendLimit(amount, limit);
	const canSend = isValidDestination && isValidAmount && !!tokenId && !isPending;

	function handleAccountTypeChange(value: string | null) {
		if (!value) return;
		const v = value as AccountType;
		setAccountType(v);
		if (v === "perp") {
			setSelectedToken(DEFAULT_QUOTE_TOKEN);
		} else if (!spendableSpotTokens.includes(selectedToken)) {
			setSelectedToken(spendableSpotTokens[0] ?? DEFAULT_QUOTE_TOKEN);
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
		if (available === null) return;
		setAmount(floorToString(available, decimals));
	}

	function renderAvailable() {
		if (limit.status === "unverifiedTransferLimit") return t`Max unavailable. The exchange checks this amount.`;
		return (
			<>
				{t`Available`}:{" "}
				<span className="underline decoration-dashed underline-offset-2 decoration-fg-muted/50">
					{available === null ? FALLBACK_VALUE_PLACEHOLDER : `${floorToString(available, decimals)} ${selectedToken}`}
				</span>
			</>
		);
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
						labelValue={renderAvailable()}
						onLabelValueClick={handleMaxClick}
						placeholder="0.00"
						value={amount}
						onChange={(e: ChangeEvent<HTMLInputElement>) => handleAmountChange(e.target.value)}
						className={cn(
							"w-full tabular-nums",
							available !== null &&
								exceedsBalance(amount, available) &&
								"border-stroke-error-strong focus:border-stroke-error-strong",
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
