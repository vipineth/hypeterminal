import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { AlertTriangle, ArrowDownUp, Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { getAvailableFromTotals, getSpotBalance } from "@/domain/trade/balances";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { findSpotPair, getAvailablePairTokens, getSwapSide } from "@/domain/trade/swap";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useMarketsInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toNumber } from "@/lib/trade/numbers";
import {
	useSwapModalActions,
	useSwapModalFromToken,
	useSwapModalOpen,
	useSwapModalToToken,
} from "@/stores/use-global-modal-store";
import { AssetDisplay } from "./asset-display";
import { TokenSelectorDropdown } from "./token-selector-dropdown";
import { TradingActionButton } from "./trading-action-button";

const SUCCESS_DISPLAY_DURATION_MS = 1500;
const DEFAULT_SLIPPAGE_BPS = 100;

export function SpotSwapModal() {
	const isOpen = useSwapModalOpen();
	const initialFromToken = useSwapModalFromToken() ?? DEFAULT_QUOTE_TOKEN;
	const initialToToken = useSwapModalToToken();
	const { close } = useSwapModalActions();

	if (!isOpen) return null;

	return (
		<SpotSwapModalContent
			initialFromToken={initialFromToken}
			initialToToken={initialToToken}
			onClose={close}
		/>
	);
}

interface Props {
	initialFromToken: string;
	initialToToken?: string;
	onClose: () => void;
}

function SpotSwapModalContent({ initialFromToken, initialToToken, onClose }: Props) {
	const { spotMarkets } = useMarketsInfo();
	const { spotBalances } = useAccountBalances();
	const { mutateAsync: placeOrder, isPending: isSubmitting } = useExchangeOrder();

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

	const markPx = spotMarket?.markPx ?? 0;
	const szDecimals = spotMarket?.szDecimals ?? 2;
	const baseToken = spotMarket?.tokensInfo[0]?.name ?? "";
	const isBuying = spotMarket ? getSwapSide(fromToken, spotMarket) : false;

	const fromTokenInfo = availableFromTokens.find((t) => t.name === fromToken) ?? spotMarket?.tokensInfo.find((t) => t.name === fromToken);
	const toTokenInfo = availableToTokens.find((t) => t.name === toToken) ?? spotMarket?.tokensInfo.find((t) => t.name === toToken);
	const fromAsset = fromTokenInfo ?? { displayName: fromToken, iconUrl: undefined };
	const toAsset = toTokenInfo ?? { displayName: toToken, iconUrl: undefined };

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

	function handleClose(open: boolean) {
		if (!open) {
			if (autoCloseTimerRef.current) {
				clearTimeout(autoCloseTimerRef.current);
				autoCloseTimerRef.current = null;
			}
			onClose();
		}
	}

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
			}, SUCCESS_DISPLAY_DURATION_MS);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`Swap failed`;
			setError(message);
		}
	}, [spotMarket, orderSize, isSubmitting, isBuying, markPx, szDecimals, placeOrder]);

	const insufficientBalance = amountValue > fromBalance;
	const noPairAvailable = fromToken && toToken && !spotMarket;
	const canSubmit = amountValue > 0 && !insufficientBalance && orderSize > 0 && !showSuccess && spotMarket;
	const isDisabled = isSubmitting || showSuccess;

	return (
		<Dialog open onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[400px] gap-0 p-0 overflow-hidden">
				<DialogHeader className="p-4 pb-3 border-b border-border/40">
					<DialogTitle className="text-sm font-medium">
						<Trans>Swap</Trans>
					</DialogTitle>
					<DialogDescription className="text-3xs">
						{spotMarket ? (
							<Trans>Trade via {spotMarket.displayName} spot market</Trans>
						) : (
							<Trans>Select tokens to swap</Trans>
						)}
					</DialogDescription>
				</DialogHeader>

				<div className="p-4 space-y-3">
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
									size="none"
									onClick={handleFlip}
									disabled={isDisabled}
									className="size-8 rounded-full bg-bg border-border/60 hover:border-info hover:bg-info/10 transition-colors disabled:opacity-50"
									aria-label={t`Swap direction`}
								>
									<ArrowDownUp className="size-3.5" />
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

					<div className="flex items-center justify-between text-3xs text-muted-fg px-1">
						<span>
							<Trans>Rate</Trans>
						</span>
						<span className="tabular-nums">
							{rate > 0 ? (
								<>
									1 <AssetDisplay asset={fromAsset} hideIcon /> ≈ {formatToken(rate, 6)} <AssetDisplay asset={toAsset} hideIcon />
								</>
							) : (
								"-"
							)}
						</span>
					</div>

					<div className="flex items-center justify-between text-3xs text-muted-fg px-1">
						<span>
							<Trans>Slippage tolerance</Trans>
						</span>
						<span className="tabular-nums">{DEFAULT_SLIPPAGE_BPS / 100}%</span>
					</div>

					{insufficientBalance && (
						<div className="flex items-start gap-2 p-2.5 bg-warning/10 border border-warning/20 rounded-sm">
							<AlertTriangle className="size-3.5 text-warning shrink-0 mt-0.5" />
							<p className="text-xs text-warning">
								<Trans>
									Insufficient <AssetDisplay asset={fromAsset} hideIcon /> balance
								</Trans>
							</p>
						</div>
					)}

					{noPairAvailable && (
						<div className="flex items-start gap-2 p-2.5 bg-warning/10 border border-warning/20 rounded-sm">
							<AlertTriangle className="size-3.5 text-warning shrink-0 mt-0.5" />
							<p className="text-xs text-warning">
								<Trans>
									No trading pair available for <AssetDisplay asset={fromAsset} hideIcon />/<AssetDisplay asset={toAsset} hideIcon />
								</Trans>
							</p>
						</div>
					)}

					{error && (
						<div className="flex items-center gap-2 p-2.5 bg-negative/10 border border-negative/20 rounded-sm text-xs text-negative">
							<AlertTriangle className="size-3.5 shrink-0" />
							<span className="flex-1">{error}</span>
						</div>
					)}

					{showSuccess && (
						<div className="flex items-center justify-center gap-2 p-2.5 bg-positive/10 border border-positive/20 rounded-sm text-xs text-positive">
							<Check className="size-3.5" />
							<Trans>Swap submitted</Trans>
						</div>
					)}

					<TradingActionButton
						variant="terminal"
						size="sm"
						onClick={handleSubmit}
						disabled={!canSubmit || isSubmitting}
						className="w-full h-10 gap-1.5"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								<Trans>Swapping...</Trans>
							</>
						) : (
							<Trans>Swap</Trans>
						)}
					</TradingActionButton>
				</div>
			</DialogContent>
		</Dialog>
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
				"p-3 rounded-sm border transition-colors",
				hasError ? "border-warning/40 bg-warning/5" : "border-border/40 bg-surface/30",
			)}
		>
			<div className="flex items-center justify-between mb-2">
				<span className="text-3xs text-muted-fg uppercase tracking-wider">{label}</span>
				{editable ? (
					<button
						type="button"
						onClick={onMaxClick}
						disabled={disabled}
						className={cn(
							"text-3xs text-muted-fg tabular-nums transition-colors",
							!disabled && "hover:text-info cursor-pointer",
						)}
					>
						<Trans>Balance</Trans>: {formatToken(balance, 4)}
					</button>
				) : (
					<span className="text-3xs text-muted-fg tabular-nums">
						<Trans>Balance</Trans>: {formatToken(balance, 4)}
					</span>
				)}
			</div>

			<div className="flex items-center gap-3">
				{tokenSelector}

				<div className="flex-1">
					{editable ? (
						<NumberInput
							placeholder="0.00"
							value={amount}
							onChange={(e) => onAmountChange?.(e.target.value)}
							className={cn(
								"w-full h-9 text-base font-medium bg-transparent border-border/40 focus:border-info/60 tabular-nums text-right",
								hasError && "text-warning border-warning/40 focus:border-warning",
							)}
							disabled={disabled}
						/>
					) : (
						<div className="h-9 flex items-center justify-end text-base font-medium text-muted-fg tabular-nums pr-2">
							{amount || "0.00"}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
