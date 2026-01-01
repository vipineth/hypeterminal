import { ChevronDown, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { useTradingAgent } from "@/hooks/use-trading-agent";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import {
	ensureLeverage,
	getHttpTransport,
	makeExchangeConfig,
	placeSingleOrder,
} from "@/lib/hyperliquid";
import { floorToDecimals, formatDecimalFloor, parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import {
	useDefaultLeverageByMode,
	useMarketLeverageByMode,
	useMarketOrderSlippageBps,
	useTradeSettingsActions,
} from "@/stores/use-trade-settings-store";
import { DepositModal } from "./deposit-modal";
import { OrderToast } from "./order-toast";
import { WalletDialog } from "../header/wallet-dialog";

type OrderType = "market" | "limit";
type Side = "buy" | "sell";
type SizeMode = "asset" | "usd";

function getDefaultLeverage(maxLeverage: number): number {
	if (maxLeverage <= 5) return maxLeverage;
	return Math.floor(maxLeverage / 2);
}

/**
 * Format price according to Hyperliquid's tick size rules.
 * Prices must have at most 5 significant figures.
 * The number of decimal places depends on the price magnitude.
 */
function formatPriceForOrder(price: number): string {
	if (!Number.isFinite(price) || price <= 0) return "0";

	// Hyperliquid uses 5 significant figures for prices
	const MAX_SIGNIFICANT_FIGURES = 5;

	// Calculate the number of decimal places based on price magnitude
	// For price >= 1: decimals = max(0, 5 - floor(log10(price)) - 1)
	// For price < 1: we need more decimals
	const log10Price = Math.log10(price);
	const integerDigits = Math.floor(log10Price) + 1;

	let decimals: number;
	if (price >= 1) {
		decimals = Math.max(0, MAX_SIGNIFICANT_FIGURES - integerDigits);
	} else {
		// For prices < 1, count leading zeros after decimal
		// e.g., 0.001234 has 2 leading zeros, so we allow more decimals
		decimals = MAX_SIGNIFICANT_FIGURES - integerDigits;
	}

	// Cap at reasonable maximum
	decimals = Math.min(decimals, 8);

	// Round to tick size (floor for sells would be safer, but round is standard)
	const multiplier = Math.pow(10, decimals);
	const rounded = Math.round(price * multiplier) / multiplier;

	// Format with the correct number of decimals
	// Only strip trailing zeros after decimal point, not from integers
	if (decimals === 0) {
		return rounded.toFixed(0);
	}
	// Strip trailing zeros after decimal, and the decimal point if no decimals remain
	return rounded.toFixed(decimals).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function formatSizeForOrder(size: number, szDecimals: number): string {
	return formatDecimalFloor(size, szDecimals);
}

export function OrderEntryPanel() {
	// IDs for accessibility
	const reduceOnlyId = useId();
	const tpSlId = useId();

	// Connection state
	const { address, isConnected } = useConnection();
	// Don't pass account - let wagmi use the connected account automatically
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	// Check if we need to switch chains (error indicates chain mismatch)
	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	// Market data
	const { data: market } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const { data: clearinghouse } = useClearinghouseState({ user: address });

	// Trading agent (API wallet for signing)
	const {
		isApproved: isAgentApproved,
		apiWalletSigner,
		approveAgent,
		canApprove,
	} = useTradingAgent({
		user: address,
		walletClient,
		enabled: isConnected,
	});

	// Trade settings
	const defaultLeverageByMode = useDefaultLeverageByMode();
	const marketLeverageByMode = useMarketLeverageByMode();
	const slippageBps = useMarketOrderSlippageBps();
	const { setMarketLeverage } = useTradeSettingsActions();

	// Order queue
	const { addOrder, updateOrder } = useOrderQueueActions();

	// Local form state
	const [type, setType] = useState<OrderType>("market");
	const [side, setSide] = useState<Side>("buy");
	const [sizeInput, setSizeInput] = useState("");
	const [sizeMode, setSizeMode] = useState<SizeMode>("asset");
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isApproving, setIsApproving] = useState(false);
	const [approvalError, setApprovalError] = useState<string | null>(null);

	// Modal state
	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [depositModalOpen, setDepositModalOpen] = useState(false);

	// Track previous market to clear form on market change
	const [prevMarketKey, setPrevMarketKey] = useState<string | undefined>(undefined);

	// Clear size when market changes
	useEffect(() => {
		if (market?.marketKey && market.marketKey !== prevMarketKey) {
			setSizeInput("");
			setLimitPriceInput("");
			setPrevMarketKey(market.marketKey);
		}
	}, [market?.marketKey, prevMarketKey]);

	// Derived values
	// Available balance for trading = accountValue - totalMarginUsed
	// (withdrawable is only for actual withdrawals from the exchange)
	const availableBalance = useMemo(() => {
		const accountValue = parseNumber(clearinghouse?.crossMarginSummary?.accountValue) || 0;
		const marginUsed = parseNumber(clearinghouse?.crossMarginSummary?.totalMarginUsed) || 0;
		return Math.max(0, accountValue - marginUsed);
	}, [clearinghouse?.crossMarginSummary?.accountValue, clearinghouse?.crossMarginSummary?.totalMarginUsed]);

	const position = useMemo(() => {
		if (!clearinghouse?.assetPositions || !market?.coin) return null;
		return clearinghouse.assetPositions.find((p) => p.position.coin === market.coin);
	}, [clearinghouse?.assetPositions, market?.coin]);

	const positionSize = useMemo(() => {
		return parseNumber(position?.position?.szi) || 0;
	}, [position?.position?.szi]);

	const maxLeverage = market?.maxLeverage || 50;

	const leverage = useMemo(() => {
		if (!market?.marketKey) return getDefaultLeverage(maxLeverage);
		const marketSpecific = marketLeverageByMode[market.marketKey]?.cross;
		if (marketSpecific) return Math.min(marketSpecific, maxLeverage);
		const defaultLev = defaultLeverageByMode.cross ?? getDefaultLeverage(maxLeverage);
		return Math.min(defaultLev, maxLeverage);
	}, [market?.marketKey, marketLeverageByMode, defaultLeverageByMode.cross, maxLeverage]);

	const markPx = useMemo(() => {
		const ctxMarkPx = market?.ctx?.markPx;
		const midPx = market?.midPx;
		const result = parseNumber(ctxMarkPx || midPx) || 0;
		console.log("[OrderEntry] markPx calculation:", { ctxMarkPx, midPx, result });
		return result;
	}, [market?.ctx?.markPx, market?.midPx]);

	const price = useMemo(() => {
		if (type === "market") return markPx;
		return parseNumber(limitPriceInput) || 0;
	}, [type, markPx, limitPriceInput]);

	const maxSize = useMemo(() => {
		if (!price || price <= 0 || !leverage) return 0;
		const maxNotional = availableBalance * leverage;
		let maxSizeRaw = maxNotional / price;

		// Position-aware: can close existing position + open opposite
		if (side === "sell" && positionSize > 0) {
			maxSizeRaw += positionSize;
		} else if (side === "buy" && positionSize < 0) {
			maxSizeRaw += Math.abs(positionSize);
		}

		return floorToDecimals(maxSizeRaw, market?.szDecimals ?? 0);
	}, [availableBalance, leverage, price, side, positionSize, market?.szDecimals]);

	const sizeValue = useMemo(() => {
		const inputValue = parseNumber(sizeInput) || 0;
		if (sizeMode === "usd" && price > 0) {
			return inputValue / price;
		}
		return inputValue;
	}, [sizeInput, sizeMode, price]);

	const orderValue = useMemo(() => {
		return sizeValue * price;
	}, [sizeValue, price]);

	const marginRequired = useMemo(() => {
		if (!leverage) return 0;
		return orderValue / leverage;
	}, [orderValue, leverage]);

	const estimatedFee = useMemo(() => {
		const feeRate = type === "market" ? 0.00045 : 0.00015;
		return orderValue * feeRate;
	}, [orderValue, type]);

	// Liquidation price calculation (simplified)
	const liqPrice = useMemo(() => {
		if (!price || !sizeValue || !leverage) return null;
		// Simplified estimate: entry price +/- (entry * (1/leverage) * 0.9)
		// Real calculation requires maintenance margin tiers
		const buffer = price * (1 / leverage) * 0.9;
		return side === "buy" ? price - buffer : price + buffer;
	}, [price, sizeValue, leverage, side]);

	const liqWarning = useMemo(() => {
		if (!liqPrice || !price) return false;
		return Math.abs(liqPrice - price) / price < 0.05;
	}, [liqPrice, price]);

	// Check if we can sign (either agent approved or wallet client available)
	const canSign = isAgentApproved ? !!apiWalletSigner : !!walletClient;

	// Validation
	const validation = useMemo(() => {
		const errors: string[] = [];

		if (!isConnected) return { valid: false, errors: ["Not connected"], canSubmit: false, needsApproval: false };
		if (isWalletLoading) return { valid: false, errors: ["Loading wallet..."], canSubmit: false, needsApproval: false };
		if (availableBalance <= 0) return { valid: false, errors: ["No balance"], canSubmit: false, needsApproval: false };
		if (!market) return { valid: false, errors: ["No market"], canSubmit: false, needsApproval: false };
		if (typeof market.assetIndex !== "number") return { valid: false, errors: ["Market not ready"], canSubmit: false, needsApproval: false };

		// Check if agent approval is needed
		if (!isAgentApproved) {
			return { valid: false, errors: [], canSubmit: false, needsApproval: true };
		}

		if (!canSign) return { valid: false, errors: ["Signer not ready"], canSubmit: false, needsApproval: false };
		if (type === "market" && !markPx) return { valid: false, errors: ["No mark price"], canSubmit: false, needsApproval: false };
		if (type === "limit" && !price) {
			errors.push("Enter limit price");
		}
		if (!sizeValue || sizeValue <= 0) {
			errors.push("Enter size");
		}
		if (orderValue > 0 && orderValue < 10) {
			errors.push("Min order $10");
		}
		if (sizeValue > maxSize && maxSize > 0) {
			errors.push("Exceeds max size");
		}

		return { valid: errors.length === 0, errors, canSubmit: errors.length === 0, needsApproval: false };
	}, [isConnected, isWalletLoading, availableBalance, market, type, markPx, price, sizeValue, orderValue, maxSize, isAgentApproved, canSign]);

	const sizeHasError = sizeValue > maxSize && maxSize > 0;
	const orderValueTooLow = orderValue > 0 && orderValue < 10;

	// Leverage options
	const leverageOptions = useMemo(() => {
		const options: number[] = [];
		const steps = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200];
		for (const step of steps) {
			if (step <= maxLeverage) {
				options.push(step);
			}
		}
		if (!options.includes(maxLeverage)) {
			options.push(maxLeverage);
		}
		return options.sort((a, b) => a - b);
	}, [maxLeverage]);

	const handleLeverageChange = useCallback(
		(newLeverage: number) => {
			if (market?.marketKey) {
				setMarketLeverage(market.marketKey, "cross", newLeverage, maxLeverage);
			}
		},
		[market?.marketKey, maxLeverage, setMarketLeverage],
	);

	const handleSliderChange = useCallback(
		(values: number[]) => {
			const pct = values[0];
			if (maxSize > 0) {
				const newSize = maxSize * (pct / 100);
				const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
				if (sizeMode === "usd" && price > 0) {
					const usdValue = newSize * price;
					setSizeInput(usdValue > 0 ? usdValue.toFixed(2) : "");
				} else {
					setSizeInput(formatted || "");
				}
			}
		},
		[maxSize, market?.szDecimals, sizeMode, price],
	);

	const handlePercentClick = useCallback(
		(pct: number) => {
			if (maxSize > 0) {
				const newSize = maxSize * (pct / 100);
				const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
				if (sizeMode === "usd" && price > 0) {
					const usdValue = newSize * price;
					setSizeInput(usdValue > 0 ? usdValue.toFixed(2) : "");
				} else {
					setSizeInput(formatted || "");
				}
			}
		},
		[maxSize, market?.szDecimals, sizeMode, price],
	);

	const handleSizeModeToggle = useCallback(() => {
		if (sizeMode === "asset" && price > 0 && sizeValue > 0) {
			// Convert to USD
			const usdValue = sizeValue * price;
			setSizeInput(usdValue.toFixed(2));
			setSizeMode("usd");
		} else if (sizeMode === "usd" && price > 0 && sizeValue > 0) {
			// Convert to asset
			const formatted = formatDecimalFloor(sizeValue, market?.szDecimals ?? 0);
			setSizeInput(formatted || "");
			setSizeMode("asset");
		} else {
			setSizeMode(sizeMode === "asset" ? "usd" : "asset");
		}
	}, [sizeMode, price, sizeValue, market?.szDecimals]);

	const handleMarkPriceClick = useCallback(() => {
		if (markPx > 0) {
			// Use szDecimals to derive price decimals for input
			const decimals = szDecimalsToPriceDecimals(market?.szDecimals ?? 4);
			setLimitPriceInput(markPx.toFixed(decimals));
		}
	}, [markPx, market?.szDecimals]);

	// Handle chain switch
	const handleSwitchChain = useCallback(() => {
		switchChain({ chainId: 42161 }); // Arbitrum One
	}, [switchChain]);

	// Handle agent approval
	const handleApprove = useCallback(async () => {
		console.log("[OrderEntry] handleApprove called", {
			isApproving,
			hasWalletClient: !!walletClient,
			isWalletLoading,
		});

		if (isApproving) return;

		setIsApproving(true);
		setApprovalError(null);

		try {
			await approveAgent();
		} catch (error) {
			console.error("[OrderEntry] Approval failed:", error);
			const message = error instanceof Error ? error.message : "Failed to enable trading";
			setApprovalError(message);
		} finally {
			setIsApproving(false);
		}
	}, [isApproving, approveAgent, walletClient, isWalletLoading]);

	const handleSubmit = useCallback(async () => {
		console.log("[OrderEntry] handleSubmit called", {
			canSubmit: validation.canSubmit,
			isSubmitting,
			isAgentApproved,
			hasApiWalletSigner: !!apiWalletSigner,
			assetIndex: market?.assetIndex,
			sizeValue,
			orderValue,
			errors: validation.errors,
		});

		if (!validation.canSubmit || isSubmitting) return;
		if (!apiWalletSigner || typeof market?.assetIndex !== "number") return;

		setIsSubmitting(true);

		// Calculate order price with slippage for market orders
		let orderPrice = price;
		if (type === "market") {
			if (side === "buy") {
				orderPrice = markPx * (1 + slippageBps / 10000);
			} else {
				orderPrice = markPx * (1 - slippageBps / 10000);
			}
		}

		const szDecimals = market.szDecimals ?? 0;
		const formattedPrice = formatPriceForOrder(orderPrice);
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);

		console.log("[OrderEntry] Order params:", {
			markPx,
			orderPrice,
			formattedPrice,
			slippageBps,
			sizeValue,
			formattedSize,
		});

		// Add to order queue
		const orderId = addOrder({
			market: market.coin,
			side,
			size: formattedSize,
			status: "pending",
		});

		try {
			const transport = getHttpTransport();
			const config = makeExchangeConfig(transport, apiWalletSigner);

			// Ensure leverage is set correctly
			await ensureLeverage(config, {
				asset: market.assetIndex,
				isCross: true,
				leverage,
			});

			// Build order
			const order = {
				a: market.assetIndex,
				b: side === "buy",
				p: formattedPrice,
				s: formattedSize,
				r: false,
				t: type === "market" ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: "Gtc" as const } },
			};

			const result = await placeSingleOrder(config, { order });

			// Check for errors in response
			const status = result.response?.data?.statuses?.[0];
			if (status && "error" in status && typeof status.error === "string") {
				throw new Error(status.error);
			}

			// Success
			updateOrder(orderId, { status: "success", fillPercent: 100 });

			// Reset form
			setSizeInput("");
			setLimitPriceInput("");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Order failed";
			updateOrder(orderId, { status: "failed", error: errorMessage });
		} finally {
			setIsSubmitting(false);
		}
	}, [
		validation.canSubmit,
		isSubmitting,
		apiWalletSigner,
		isAgentApproved,
		market,
		type,
		side,
		price,
		markPx,
		slippageBps,
		sizeValue,
		leverage,
		addOrder,
		updateOrder,
	]);

	// Handle Enter key
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && validation.canSubmit && !isSubmitting) {
				handleSubmit();
			}
		},
		[validation.canSubmit, isSubmitting, handleSubmit],
	);

	// Slider value (0-100)
	const sliderValue = useMemo(() => {
		if (!maxSize || maxSize <= 0) return 0;
		return Math.min(100, (sizeValue / maxSize) * 100);
	}, [sizeValue, maxSize]);

	// Button text and action
	const buttonContent = useMemo(() => {
		if (!isConnected) {
			return { text: "Connect Wallet", action: () => setWalletDialogOpen(true), disabled: false, variant: "cyan" as const };
		}
		// Handle chain mismatch - prompt user to switch to Arbitrum
		if (needsChainSwitch) {
			return {
				text: isSwitchingChain ? "Switching..." : "Switch to Arbitrum",
				action: handleSwitchChain,
				disabled: isSwitchingChain,
				variant: "cyan" as const,
			};
		}
		if (availableBalance <= 0) {
			return { text: "Deposit", action: () => setDepositModalOpen(true), disabled: false, variant: "cyan" as const };
		}
		if (validation.needsApproval) {
			return {
				text: isApproving ? "Signing..." : !canApprove ? "Loading..." : "Enable Trading",
				action: handleApprove,
				disabled: isApproving || !canApprove,
				variant: "cyan" as const,
			};
		}
		return {
			text: side === "buy" ? "Buy" : "Sell",
			action: handleSubmit,
			disabled: !validation.canSubmit || isSubmitting,
			variant: side as "buy" | "sell",
		};
	}, [isConnected, needsChainSwitch, isSwitchingChain, handleSwitchChain, availableBalance, side, validation.canSubmit, validation.needsApproval, isSubmitting, isApproving, canApprove, handleSubmit, handleApprove]);

	const isFormDisabled = !isConnected || availableBalance <= 0;

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20" onKeyDown={handleKeyDown}>
			{/* Header: Mode tabs + Leverage dropdown */}
			<div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
				<Tabs value="cross">
					<TabsList>
						<TabsTrigger value="cross">Cross</TabsTrigger>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TabsTrigger value="isolated" disabled className="opacity-50 cursor-not-allowed">
										Isolated
									</TabsTrigger>
								</span>
							</TooltipTrigger>
							<TooltipContent>Coming soon</TooltipContent>
						</Tooltip>
					</TabsList>
				</Tabs>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="px-2 py-0.5 text-3xs border border-terminal-cyan/40 text-terminal-cyan inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Select leverage"
						>
							{leverage}x <ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-20 font-mono text-xs max-h-48 overflow-y-auto">
						{leverageOptions.map((lv) => (
							<DropdownMenuItem
								key={lv}
								onClick={() => handleLeverageChange(lv)}
								className={cn(lv === leverage && "bg-terminal-cyan/20")}
							>
								{lv}x
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="p-2 space-y-2 overflow-y-auto flex-1">
				{/* Order type tabs */}
				<Tabs value={type} onValueChange={(v) => setType(v as OrderType)}>
					<TabsList>
						<TabsTrigger value="market" variant="underline">
							Market
						</TabsTrigger>
						<TabsTrigger value="limit" variant="underline">
							Limit
						</TabsTrigger>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TabsTrigger value="stop" variant="underline" disabled className="opacity-50 cursor-not-allowed">
										Stop
									</TabsTrigger>
								</span>
							</TooltipTrigger>
							<TooltipContent>Coming soon</TooltipContent>
						</Tooltip>
					</TabsList>
				</Tabs>

				{/* Buy/Sell buttons */}
				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						onClick={() => setSide("buy")}
						className={cn(
							"py-2 text-2xs font-semibold uppercase tracking-wider transition-all border",
							side === "buy"
								? "bg-terminal-green/20 border-terminal-green text-terminal-green terminal-glow-green"
								: "border-border/60 text-muted-foreground hover:border-terminal-green/40 hover:text-terminal-green",
						)}
						tabIndex={0}
						aria-label="Buy Long"
					>
						<TrendingUp className="size-3 inline mr-1" />
						Long
					</button>
					<button
						type="button"
						onClick={() => setSide("sell")}
						className={cn(
							"py-2 text-2xs font-semibold uppercase tracking-wider transition-all border",
							side === "sell"
								? "bg-terminal-red/20 border-terminal-red text-terminal-red terminal-glow-red"
								: "border-border/60 text-muted-foreground hover:border-terminal-red/40 hover:text-terminal-red",
						)}
						tabIndex={0}
						aria-label="Sell Short"
					>
						<TrendingDown className="size-3 inline mr-1" />
						Short
					</button>
				</div>

				{/* Balance + Deposit */}
				<div className="space-y-0.5 text-3xs">
					<div className="flex items-center justify-between text-muted-foreground">
						<span>Available</span>
						<div className="flex items-center gap-2">
							<span className={cn("tabular-nums", availableBalance > 0 ? "text-terminal-green" : "text-muted-foreground")}>
								{isConnected ? formatUSD(availableBalance) : "-"}
							</span>
							{isConnected && (
								<button
									type="button"
									onClick={() => setDepositModalOpen(true)}
									className="text-terminal-cyan hover:underline text-4xs uppercase"
								>
									Deposit
								</button>
							)}
						</div>
					</div>
					{/* Position (if exists) */}
					{positionSize !== 0 && (
						<div className="flex items-center justify-between text-muted-foreground">
							<span>Position</span>
							<span
								className={cn("tabular-nums", positionSize > 0 ? "text-terminal-green" : "text-terminal-red")}
							>
								{positionSize > 0 ? "+" : ""}
								{formatDecimalFloor(positionSize, market?.szDecimals ?? 2)} {market?.coin}
							</span>
						</div>
					)}
				</div>

				{/* Size input */}
				<div className="space-y-1.5">
					<div className="text-4xs uppercase tracking-wider text-muted-foreground">Size</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handleSizeModeToggle}
							className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Toggle size mode"
							disabled={isFormDisabled}
						>
							{sizeMode === "asset" ? market?.coin || "---" : "USD"} <ChevronDown className="size-2.5" />
						</button>
						<Input
							placeholder="0.00"
							value={sizeInput}
							onChange={(e) => setSizeInput(e.target.value)}
							className={cn(
								"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								(sizeHasError || orderValueTooLow) && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>

					{/* Slider */}
					<Slider
						value={[sliderValue]}
						onValueChange={handleSliderChange}
						max={100}
						step={0.1}
						className="py-1"
						disabled={isFormDisabled || maxSize <= 0}
					/>

					{/* Percent buttons */}
					<div className="grid grid-cols-4 gap-1">
						{[25, 50, 75, 100].map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => handlePercentClick(p)}
								className="py-1 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/40 hover:text-terminal-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								tabIndex={0}
								aria-label={`Set ${p}%`}
								disabled={isFormDisabled || maxSize <= 0}
							>
								{p === 100 ? "Max" : `${p}%`}
							</button>
						))}
					</div>
				</div>

				{/* Limit price (conditional) */}
				{type === "limit" && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">Limit Price</div>
							{markPx > 0 && (
								<button
									type="button"
									onClick={handleMarkPriceClick}
									className="text-4xs text-muted-foreground hover:text-terminal-cyan tabular-nums"
								>
									Mark: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
								</button>
							)}
						</div>
						<Input
							placeholder="0.00"
							value={limitPriceInput}
							onChange={(e) => setLimitPriceInput(e.target.value)}
							className={cn(
								"h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								type === "limit" && !price && sizeValue > 0 && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				{/* Reduce Only + TP/SL (disabled) */}
				<div className="flex items-center gap-3 text-3xs">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="inline-flex items-center gap-1.5 cursor-not-allowed opacity-50">
								<Checkbox id={reduceOnlyId} className="size-3.5" aria-label="Reduce Only" disabled />
								<label htmlFor={reduceOnlyId} className="text-muted-foreground cursor-not-allowed">
									Reduce Only
								</label>
							</div>
						</TooltipTrigger>
						<TooltipContent>Coming soon</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="inline-flex items-center gap-1.5 cursor-not-allowed opacity-50">
								<Checkbox id={tpSlId} className="size-3.5" aria-label="Take Profit / Stop Loss" disabled />
								<label htmlFor={tpSlId} className="text-muted-foreground cursor-not-allowed">
									TP/SL
								</label>
							</div>
						</TooltipTrigger>
						<TooltipContent>Coming soon</TooltipContent>
					</Tooltip>
				</div>

				<div className="h-4" />

				{/* Validation errors */}
				{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
					<div className="text-4xs text-terminal-red">
						{validation.errors.join(" • ")}
					</div>
				)}

				{/* Approval error */}
				{approvalError && (
					<div className="text-4xs text-terminal-red">
						{approvalError}
					</div>
				)}

				{/* Submit button */}
				<button
					type="button"
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					className={cn(
						"w-full py-2.5 text-2xs font-semibold uppercase tracking-wider transition-all border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
						buttonContent.variant === "cyan"
							? "bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30"
							: buttonContent.variant === "buy"
								? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30"
								: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
					)}
					tabIndex={0}
					aria-label={buttonContent.text}
				>
					{(isSubmitting || isApproving) && <Loader2 className="size-3 animate-spin" />}
					{buttonContent.text}
				</button>

				{/* Order summary */}
				<div className="border border-border/40 divide-y divide-border/40 text-3xs">
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">Liq. Price</span>
						<span className={cn("tabular-nums", liqWarning ? "text-terminal-red" : "text-terminal-red/70")}>
							{liqPrice ? formatPrice(liqPrice, { szDecimals: market?.szDecimals }) : "-"}
						</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">Order Value</span>
						<span className="tabular-nums">{orderValue > 0 ? formatUSD(orderValue) : "-"}</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">Margin Req.</span>
						<span className="tabular-nums">{marginRequired > 0 ? formatUSD(marginRequired) : "-"}</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">Slippage</span>
						<span className="tabular-nums text-terminal-amber">{(slippageBps / 100).toFixed(2)}%</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">Est. Fee</span>
						<span className="tabular-nums text-muted-foreground">
							{estimatedFee > 0 ? formatUSD(estimatedFee) : "-"}
						</span>
					</div>
				</div>
			</div>

			{/* Modals */}
			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />

			{/* Order toast */}
			<OrderToast />
		</div>
	);
}
