import { Button, Modal, ModalContent, ModalDescription, ModalHeader, ModalPopup, ModalTitle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowsDownUpIcon, CheckIcon, SpinnerGapIcon, WarningIcon } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { labelTypographyClass } from "@/components/ui/field-label";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import { SWAP_SUCCESS_DURATION_MS } from "@/config/time";
import { getSpotAvailable, getSpotBalance } from "@/domain/trade/balances";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { findSpotPair, getAvailablePairTokens, getSwapSide } from "@/domain/trade/swap";
import { useDefaultDexBalances } from "@/hooks/trade/use-account-balances";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { useAutoCloseSuccess } from "@/hooks/ui/use-auto-close-success";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useMarketsInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import {
	useSwapModalActions,
	useSwapModalFromToken,
	useSwapModalOpen,
	useSwapModalToToken,
} from "@/stores/use-global-modal-store";
import { AssetDisplay } from "./asset-display";
import { TokenSelectorDropdown } from "./token-selector-dropdown";
import { TradingActionButton } from "./trading-action-button";

const DEFAULT_SLIPPAGE_BPS = 100;

export function SpotSwapModal() {
	const isOpen = useSwapModalOpen();
	const initialFromToken = useSwapModalFromToken() ?? DEFAULT_QUOTE_TOKEN;
	const initialToToken = useSwapModalToToken();
	const { close } = useSwapModalActions();

	if (!isOpen) return null;

	return <SpotSwapModalContent initialFromToken={initialFromToken} initialToToken={initialToToken} onClose={close} />;
}

interface Props {
	initialFromToken: string;
	initialToToken?: string;
	onClose: () => void;
}

function SpotSwapModalContent({ initialFromToken, initialToToken, onClose }: Props) {
	const { spotMarkets } = useMarketsInfo();
	const { spotBalances, spotAvailableAfterMaintenance } = useDefaultDexBalances();
	const { submitPlan, isSubmitting } = useSubmitPlan();

	const defaultToToken = useMemo(() => {
		if (initialToToken) return initialToToken;
		const pairs = getAvailablePairTokens(initialFromToken, spotMarkets);
		return pairs[0]?.name ?? "";
	}, [initialFromToken, initialToToken, spotMarkets]);

	const [fromToken, setFromToken] = useState(initialFromToken);
	const [toToken, setToToken] = useState(defaultToToken);
	const [amount, setAmount] = useState("");
	const [error, setError] = useState<string | null>(null);
	const { showSuccess, trigger: triggerAutoClose } = useAutoCloseSuccess(onClose, SWAP_SUCCESS_DURATION_MS);

	const getTokenBalance = useCallback(
		(token: string) => {
			const balance = getSpotBalance(spotBalances, token);
			return getSpotAvailable(balance, spotAvailableAfterMaintenance);
		},
		[spotBalances, spotAvailableAfterMaintenance],
	);

	const fromBalance = getTokenBalance(fromToken);
	const toBalance = getTokenBalance(toToken);

	const availableFromTokens = useMemo(() => {
		if (!toToken) return [];
		return getAvailablePairTokens(toToken, spotMarkets);
	}, [toToken, spotMarkets]);

	const availableToTokens = useMemo(() => {
		if (!fromToken) return [];
		return getAvailablePairTokens(fromToken, spotMarkets);
	}, [fromToken, spotMarkets]);

	const spotMarket = useMemo(() => {
		if (!fromToken || !toToken) return null;
		return findSpotPair(fromToken, toToken, spotMarkets);
	}, [fromToken, toToken, spotMarkets]);

	const markPx = toNumberOrZero(spotMarket?.markPx);
	const szDecimals = spotMarket?.szDecimals ?? 2;
	const baseToken = spotMarket?.tokensInfo[0]?.name ?? "";
	const isBuying = spotMarket ? getSwapSide(fromToken, spotMarket) : false;

	const amountValue = toNumber(amount) ?? 0;

	const { estimatedReceive, orderSize } = useMemo(() => {
		if (amountValue <= 0 || markPx <= 0) {
			return { estimatedReceive: 0, orderSize: 0 };
		}

		if (isBuying) {
			const size = amountValue / markPx;
			return { estimatedReceive: size, orderSize: size };
		}
		const receive = amountValue * markPx;
		return { estimatedReceive: receive, orderSize: amountValue };
	}, [amountValue, markPx, isBuying]);

	const rate = useMemo(() => {
		if (markPx <= 0) return 0;
		if (fromToken === baseToken) {
			return markPx;
		}
		return 1 / markPx;
	}, [markPx, fromToken, baseToken]);

	function handleFlip() {
		const newFrom = toToken;
		const newTo = fromToken;
		setFromToken(newFrom);
		setToToken(newTo);
		setAmount("");
		setError(null);
	}

	function handleFromTokenChange(token: string) {
		setFromToken(token);
		setAmount("");
		setError(null);

		const pairs = getAvailablePairTokens(token, spotMarkets);
		if (!pairs.some((p) => p.name === toToken)) {
			setToToken(pairs[0]?.name ?? "");
		}
	}

	function handleToTokenChange(token: string) {
		setToToken(token);
		setError(null);

		const pairs = getAvailablePairTokens(token, spotMarkets);
		if (!pairs.some((p) => p.name === fromToken)) {
			setFromToken(pairs[0]?.name ?? "");
			setAmount("");
		}
	}

	function handleMaxClick() {
		setAmount(String(fromBalance));
	}

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) onClose();
		},
		[onClose],
	);

	const handleSubmit = useCallback(async () => {
		if (!spotMarket || orderSize <= 0 || isSubmitting) return;

		setError(null);

		const plan = buildOrderPlan({
			kind: "swap",
			assetId: spotMarket.assetId,
			isBuy: isBuying,
			sizeValue: orderSize,
			szDecimals,
			markPx,
			slippageBps: DEFAULT_SLIPPAGE_BPS,
		});

		const result = await submitPlan(plan);
		if (result.ok) {
			triggerAutoClose();
		} else {
			setError(result.error || t`Swap failed`);
		}
	}, [spotMarket, orderSize, isSubmitting, isBuying, markPx, szDecimals, submitPlan, triggerAutoClose]);

	const insufficientBalance = amountValue > fromBalance;
	const noPairAvailable = fromToken && toToken && !spotMarket;
	const canSubmit = amountValue > 0 && !insufficientBalance && orderSize > 0 && !showSuccess && spotMarket;
	const isDisabled = isSubmitting || showSuccess;

	return (
		<Modal open onOpenChange={handleOpenChange}>
			<ModalPopup size="sm">
				<ModalHeader>
					<ModalTitle>
						<Trans>Swap</Trans>
					</ModalTitle>
					<ModalDescription>
						{spotMarket ? (
							<Trans>Trade via {spotMarket.pairName} spot market</Trans>
						) : (
							<Trans>Select tokens to swap</Trans>
						)}
					</ModalDescription>
				</ModalHeader>

				<ModalContent className="space-y-3">
					<div className="relative">
						<div className="space-y-1">
							<TokenPanel
								label={t`From`}
								balance={fromBalance}
								balanceToken={fromToken}
								amount={amount}
								onAmountChange={setAmount}
								onMaxClick={handleMaxClick}
								disabled={isDisabled}
								hasError={insufficientBalance}
								editable
								tokenSelector={
									<TokenSelectorDropdown
										tokens={availableFromTokens}
										selectedToken={fromToken}
										onSelect={handleFromTokenChange}
										getBalance={getTokenBalance}
										disabled={isDisabled}
									/>
								}
							/>

							<div className="relative h-0 flex items-center justify-center z-10">
								<Button
									variant="outline"
									intent="neutral"
									size="sm"
									onClick={handleFlip}
									disabled={isDisabled}
									className="size-8 rounded-full bg-background border-stroke-weak hover:border-stroke-brand-strong hover:bg-fill-hover transition-colors"
									aria-label={t`Swap direction`}
								>
									<ArrowsDownUpIcon className="size-3.5" />
								</Button>
							</div>

							<TokenPanel
								label={t`To`}
								balance={toBalance}
								balanceToken={toToken}
								amount={estimatedReceive > 0 ? `~${formatToken(estimatedReceive, 6)}` : ""}
								disabled
								editable={false}
								tokenSelector={
									<TokenSelectorDropdown
										tokens={availableToTokens}
										selectedToken={toToken}
										onSelect={handleToTokenChange}
										getBalance={getTokenBalance}
										disabled={isDisabled}
									/>
								}
							/>
						</div>
					</div>

					<div className="rounded-8 border border-stroke-weak/35 bg-fill-weak/40 px-3 py-2.5 space-y-2">
						<div className="flex items-center justify-between text-xs text-fg-muted">
							<span>
								<Trans>Rate</Trans>
							</span>
							<span className="tabular-nums text-fg">
								{rate > 0 ? (
									<>
										1 <AssetDisplay coin={fromToken} hideIcon /> ≈ {formatToken(rate, 6)}{" "}
										<AssetDisplay coin={toToken} hideIcon />
									</>
								) : (
									"-"
								)}
							</span>
						</div>
						<div className="h-px bg-stroke-weak/30" />
						<div className="flex items-center justify-between text-xs text-fg-muted">
							<span>
								<Trans>Slippage tolerance</Trans>
							</span>
							<span className="tabular-nums text-fg">{DEFAULT_SLIPPAGE_BPS / 100}%</span>
						</div>
					</div>

					{insufficientBalance && !showSuccess && (
						<div className="flex items-start gap-2 p-2.5 bg-warning-soft border border-stroke-warning-strong/20 rounded-8">
							<WarningIcon className="size-3.5 text-warning shrink-0 mt-0.5" />
							<p className="text-xs text-warning">
								<Trans>
									Insufficient <AssetDisplay coin={fromToken} hideIcon /> balance
								</Trans>
							</p>
						</div>
					)}

					{noPairAvailable && !showSuccess && (
						<div className="flex items-start gap-2 p-2.5 bg-warning-soft border border-stroke-warning-strong/20 rounded-8">
							<WarningIcon className="size-3.5 text-warning shrink-0 mt-0.5" />
							<p className="text-xs text-warning">
								<Trans>
									No trading pair available for <AssetDisplay coin={fromToken} hideIcon />/
									<AssetDisplay coin={toToken} hideIcon />
								</Trans>
							</p>
						</div>
					)}

					{error && !showSuccess && (
						<div className="flex items-center gap-2 p-2.5 bg-error-soft border border-stroke-error-strong/20 rounded-8 text-xs text-error">
							<WarningIcon className="size-3.5 shrink-0" />
							<span className="flex-1">{error}</span>
						</div>
					)}

					{showSuccess && (
						<div className="flex flex-col items-center gap-1.5 p-3 bg-success-soft border border-stroke-success-strong/20 rounded-8 text-success">
							<div className="flex items-center gap-2 text-xs">
								<CheckIcon className="size-3.5" />
								<Trans>Swap submitted</Trans>
							</div>
							<div className="text-sm font-medium tabular-nums">
								{amount} <AssetDisplay coin={fromToken} hideIcon /> → ~{formatToken(estimatedReceive, 6)}{" "}
								<AssetDisplay coin={toToken} hideIcon />
							</div>
						</div>
					)}

					<TradingActionButton onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className="w-full">
						{isSubmitting ? (
							<>
								<SpinnerGapIcon className="size-3.5 animate-spin" />
								<Trans>Swapping...</Trans>
							</>
						) : (
							<Trans>Swap</Trans>
						)}
					</TradingActionButton>
				</ModalContent>
			</ModalPopup>
		</Modal>
	);
}

interface TokenPanelProps {
	label: string;
	balance: number;
	balanceToken: string;
	amount: string;
	onAmountChange?: (value: string) => void;
	onMaxClick?: () => void;
	disabled?: boolean;
	hasError?: boolean;
	editable: boolean;
	tokenSelector: React.ReactNode;
}

function TokenPanel({
	label,
	balance,
	balanceToken,
	amount,
	onAmountChange,
	onMaxClick,
	disabled,
	hasError,
	editable,
	tokenSelector,
}: TokenPanelProps) {
	return (
		<div
			className={cn(
				"rounded-10 border p-3 space-y-2 transition-colors",
				hasError ? "border-stroke-warning-strong/40 bg-warning-soft/50" : "border-stroke-weak/40 bg-fill-weak",
			)}
		>
			<div className="flex items-center justify-between">
				<span className={labelTypographyClass}>{label}</span>
				{editable ? (
					<button
						type="button"
						onClick={onMaxClick}
						disabled={disabled}
						className="text-3xs text-fg-muted tabular-nums leading-none hover:text-fg transition-colors disabled:pointer-events-none"
					>
						Available:{" "}
						<span className="underline decoration-dashed underline-offset-2 decoration-fg-muted/50">
							{formatToken(balance, { decimals: 4, symbol: balanceToken })}
						</span>
					</button>
				) : (
					<span className="text-3xs text-fg-muted tabular-nums leading-none">
						{`Available: ${formatToken(balance, { decimals: 4, symbol: balanceToken })}`}
					</span>
				)}
			</div>

			<div className="flex items-center gap-2">
				<div className="shrink-0">{tokenSelector}</div>
				<div className="flex-1 min-w-0">
					{editable ? (
						<NumberInput
							placeholder="0.00"
							value={amount}
							onChange={(e) => onAmountChange?.(e.target.value)}
							className={cn(
								"w-full tabular-nums",
								hasError && "border-stroke-warning-strong/40 text-warning focus:border-stroke-warning-strong",
							)}
							disabled={disabled}
						/>
					) : (
						<div className="flex h-7 items-center justify-end text-xs tabular-nums text-fg-muted">
							{amount || "0.00"}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
