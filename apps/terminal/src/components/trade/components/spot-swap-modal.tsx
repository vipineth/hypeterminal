import { Button, Modal, ModalContent, ModalDescription, ModalHeader, ModalPopup, ModalTitle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ArrowsDownUpIcon, CheckIcon, SpinnerGapIcon, WarningIcon } from "@phosphor-icons/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { SWAP_SUCCESS_DURATION_MS } from "@/config/time";
import { getAvailableFromTotals, getSpotBalance } from "@/domain/trade/balances";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { findSpotPair, getAvailablePairTokens, getSwapSide } from "@/domain/trade/swap";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchange } from "@/lib/hyperliquid";
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
	const { spotBalances } = useAccountBalances();
	const { mutateAsync: placeOrder, isPending: isSubmitting } = useExchange("order");

	const defaultToToken = useMemo(() => {
		if (initialToToken) return initialToToken;
		const pairs = getAvailablePairTokens(initialFromToken, spotMarkets);
		return pairs[0]?.name ?? "";
	}, [initialFromToken, initialToToken, spotMarkets]);

	const [fromToken, setFromToken] = useState(initialFromToken);
	const [toToken, setToToken] = useState(defaultToToken);
	const [amount, setAmount] = useState("");
	const [showSuccess, setShowSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

	const getTokenBalance = useCallback(
		(token: string) => {
			const balance = getSpotBalance(spotBalances, token);
			return getAvailableFromTotals(balance?.total, balance?.hold);
		},
		[spotBalances],
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

	const handleClose = useCallback(
		(open: boolean) => {
			if (!open) {
				if (autoCloseTimerRef.current) {
					clearTimeout(autoCloseTimerRef.current);
					autoCloseTimerRef.current = null;
				}
				onClose();
			}
		},
		[onClose],
	);

	const handleSubmit = useCallback(async () => {
		if (!spotMarket || orderSize <= 0 || isSubmitting) return;

		setError(null);

		const slippageMultiplier = 1 + DEFAULT_SLIPPAGE_BPS / 10000;
		const price = isBuying ? markPx * slippageMultiplier : markPx / slippageMultiplier;

		const order = {
			a: spotMarket.assetId,
			b: isBuying,
			p: formatPriceForOrder(price),
			s: formatSizeForOrder(orderSize, szDecimals),
			r: false,
			t: { limit: { tif: "FrontendMarket" as const } },
		};

		try {
			const result = await placeOrder({ orders: [order], grouping: "na" });
			throwIfResponseError(result.response?.data?.statuses?.[0]);

			setShowSuccess(true);
			autoCloseTimerRef.current = setTimeout(() => {
				handleClose(false);
			}, SWAP_SUCCESS_DURATION_MS);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`Swap failed`;
			setError(message);
		}
	}, [spotMarket, orderSize, isSubmitting, isBuying, markPx, szDecimals, placeOrder, handleClose]);

	const insufficientBalance = amountValue > fromBalance;
	const noPairAvailable = fromToken && toToken && !spotMarket;
	const canSubmit = amountValue > 0 && !insufficientBalance && orderSize > 0 && !showSuccess && spotMarket;
	const isDisabled = isSubmitting || showSuccess;

	return (
		<Modal open onOpenChange={handleClose}>
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
									className="size-8 rounded-full bg-bg-base border-stroke-weak hover:border-stroke-brand-strong hover:bg-fill-hover transition-colors"
									aria-label={t`Swap direction`}
								>
									<ArrowsDownUpIcon className="size-3.5" />
								</Button>
							</div>

							<TokenPanel
								label={t`To`}
								balance={toBalance}
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

					<div className="flex items-center justify-between text-xs text-text-strong px-1">
						<span>
							<Trans>Rate</Trans>
						</span>
						<span className="tabular-nums">
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

					<div className="flex items-center justify-between text-xs text-text-strong px-1">
						<span>
							<Trans>Slippage tolerance</Trans>
						</span>
						<span className="tabular-nums">{DEFAULT_SLIPPAGE_BPS / 100}%</span>
					</div>

					{insufficientBalance && !showSuccess && (
						<div className="flex items-start gap-2 p-2.5 bg-fill-warning-weak border border-stroke-warning-strong/20 rounded-8">
							<WarningIcon className="size-3.5 text-text-warning shrink-0 mt-0.5" />
							<p className="text-xs text-text-warning">
								<Trans>
									Insufficient <AssetDisplay coin={fromToken} hideIcon /> balance
								</Trans>
							</p>
						</div>
					)}

					{noPairAvailable && !showSuccess && (
						<div className="flex items-start gap-2 p-2.5 bg-fill-warning-weak border border-stroke-warning-strong/20 rounded-8">
							<WarningIcon className="size-3.5 text-text-warning shrink-0 mt-0.5" />
							<p className="text-xs text-text-warning">
								<Trans>
									No trading pair available for <AssetDisplay coin={fromToken} hideIcon />/
									<AssetDisplay coin={toToken} hideIcon />
								</Trans>
							</p>
						</div>
					)}

					{error && !showSuccess && (
						<div className="flex items-center gap-2 p-2.5 bg-fill-error-weak border border-stroke-error-strong/20 rounded-8 text-xs text-text-error">
							<WarningIcon className="size-3.5 shrink-0" />
							<span className="flex-1">{error}</span>
						</div>
					)}

					{showSuccess && (
						<div className="flex flex-col items-center gap-1.5 p-3 bg-fill-success-weak border border-stroke-success-strong/20 rounded-8 text-text-success">
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

					<TradingActionButton
						variant="filled"
						intent="brand"
						size="lg"
						onClick={handleSubmit}
						disabled={!canSubmit || isSubmitting}
						className="w-full"
					>
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
				"p-3 rounded-8 border transition-colors",
				hasError ? "border-stroke-warning-strong/40 bg-fill-warning-weak/50" : "border-stroke-weak/40 bg-bg-overlay/30",
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs text-text-strong uppercase tracking-wider">{label}</span>
				<span className="text-xs text-text-strong tabular-nums">
					<Trans>Balance</Trans>: {formatToken(balance, 4)}
				</span>
			</div>

			<div className="flex items-center gap-3">
				{tokenSelector}

				<div className="flex-1">
					{editable ? (
						<NumberInput
							placeholder="0.00"
							value={amount}
							onChange={(e) => onAmountChange?.(e.target.value)}
							maxLabel={
								<>
									{t`MAX`}: {formatToken(balance, 4)}
								</>
							}
							onMaxClick={onMaxClick}
							className={cn(
								"w-full h-9 text-base font-medium bg-transparent border-stroke-weak/40 focus:border-stroke-brand-strong/60 tabular-nums text-right",
								hasError && "text-text-warning border-stroke-warning-strong/40 focus:border-stroke-warning-strong",
							)}
							disabled={disabled}
						/>
					) : (
						<div className="h-9 flex items-center justify-end text-base font-medium text-text-weak tabular-nums pr-2">
							{amount || "0.00"}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
