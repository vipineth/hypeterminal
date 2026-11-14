import { useConnection } from "wagmi";
import { getTradeCollateral } from "@/domain/trade/account-mode";
import { deriveOrderEntry, type OrderEntryDerived } from "@/domain/trade/order/derive";
import { getOrderPrice } from "@/domain/trade/order/price";
import {
	getSizeForPercent as getSizeForPercentCalc,
	getSizeUnit,
	getSizeValueForModeToggle,
} from "@/domain/trade/order/size";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side } from "@/lib/trade/types";
import {
	useLimitPrice,
	useOrderEntryActions,
	useOrderSize,
	useOrderSizeUnit,
	useOrderType,
	useScaleEnd,
	useScaleStart,
	useSizeMode,
	useTriggerPrice,
} from "@/stores/use-order-entry-store";
import { useAccountState } from "./use-account-balances";
import { useAssetLeverage } from "./use-asset-leverage";

interface OrderEntryData extends OrderEntryDerived {
	isConnected: boolean;

	setSizeInput: (size: string) => void;
	toggleSizeMode: () => void;
	getSizeForPercent: (pct: number) => string;

	leverage: number;
	currentLeverage: number;
	pendingLeverage: number | null;
	maxLeverage: number;
	setPendingLeverage: (value: number) => void;
	resetPendingLeverage: () => void;
	marginMode: "cross" | "isolated";
	hasPosition: boolean;
	switchMarginMode: (mode: "cross" | "isolated") => Promise<void>;
	applyMarginAndLeverage: (mode: "cross" | "isolated", leverageValue: number) => Promise<void>;
	isSwitchingMode: boolean;
	switchModeError: Error | null;
	isOnlyIsolated: boolean;
	allowsCrossMargin: boolean;
}

interface UseOrderEntryDataOptions {
	market: UnifiedMarketInfo | undefined;
	side: Side;
	markPx: number;
}

export function useOrderEntryData({ market, side, markPx }: UseOrderEntryDataOptions): OrderEntryData {
	const { isConnected } = useConnection();
	const account = useAccountState();
	const {
		displayLeverage: leverage,
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		setPendingLeverage,
		resetPending: resetPendingLeverage,
		quote,
		marginMode,
		hasPosition,
		switchMarginMode,
		applyMarginAndLeverage,
		isSwitchingMode,
		switchModeError,
		isOnlyIsolated,
		allowsCrossMargin,
	} = useAssetLeverage();

	const sizeMode = useSizeMode();
	const size = useOrderSize();
	const sizeUnit = useOrderSizeUnit();
	const { setSize, setSizeMode } = useOrderEntryActions();
	const orderType = useOrderType();
	const limitPriceInput = useLimitPrice();
	const triggerPriceInput = useTriggerPrice();
	const scaleStartPriceInput = useScaleStart();
	const scaleEndPriceInput = useScaleEnd();

	const orderPrice = getOrderPrice(
		orderType,
		markPx,
		limitPriceInput,
		triggerPriceInput,
		scaleStartPriceInput,
		scaleEndPriceInput,
	);
	const conversionPrice = orderPrice > 0 ? orderPrice : Math.max(markPx, 0);

	const derived = deriveOrderEntry({
		isConnected,
		market,
		side,
		conversionPrice,
		sizeMode,
		size,
		sizeUnit,
		collateral: market ? getTradeCollateral(account, market, side, quote) : { status: "pending", reason: "account" },
	});

	function getSizeForPercent(pct: number): string {
		return getSizeForPercentCalc({
			pct,
			isSpotMarket: derived.isSpotMarket,
			side,
			sizeMode,
			price: conversionPrice,
			maxSize: derived.maxSize,
			spotBalance: derived.spotBalance,
			szDecimals: derived.szDecimals,
		});
	}

	function setSizeInput(nextSize: string) {
		setSize(nextSize, getSizeUnit(market, sizeMode));
	}

	function toggleSizeMode() {
		const nextMode = sizeMode === "base" ? "quote" : "base";
		const converted = getSizeValueForModeToggle({
			sizeValue: derived.sizeValue,
			sizeMode,
			price: conversionPrice,
			szDecimals: derived.szDecimals,
		});
		setSize(converted, getSizeUnit(market, nextMode));
		setSizeMode(nextMode);
	}

	return {
		isConnected,
		...derived,
		setSizeInput,
		toggleSizeMode,
		getSizeForPercent,
		leverage,
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		setPendingLeverage,
		resetPendingLeverage,
		marginMode,
		hasPosition,
		switchMarginMode,
		applyMarginAndLeverage,
		isSwitchingMode,
		switchModeError,
		isOnlyIsolated,
		allowsCrossMargin,
	};
}
