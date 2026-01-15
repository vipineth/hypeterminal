import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { DEFAULT_MAX_LEVERAGE } from "@/config/constants";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { useExchangeUpdateLeverage } from "@/lib/hyperliquid/hooks/exchange/useExchangeUpdateLeverage";
import { useSubActiveAssetData, useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import { getMarginModeFromLeverage, type MarginMode } from "@/lib/trade/margin-mode";
import { parseNumber } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, useMarginMode } from "@/stores/use-global-settings-store";

interface UseAssetLeverageReturn {
	currentLeverage: number;
	pendingLeverage: number | null;
	maxLeverage: number;
	displayLeverage: number;
	isDirty: boolean;
	isConnected: boolean;
	setPendingLeverage: (value: number) => void;
	confirmLeverage: () => Promise<void>;
	resetPending: () => void;
	availableToSell: number | null;
	availableToBuy: number | null;
	maxTradeSzs: [number, number] | null;
	isUpdating: boolean;
	updateError: Error | null;
	subscriptionStatus: "idle" | "loading" | "success" | "error";
	marginMode: MarginMode;
	hasPosition: boolean;
	switchMarginMode: (mode: MarginMode) => Promise<void>;
	isSwitchingMode: boolean;
	switchModeError: Error | null;
}

function getDefaultLeverage(maxLeverage: number): number {
	return Math.min(10, maxLeverage);
}

export function useAssetLeverage(): UseAssetLeverageReturn {
	const { address, isConnected } = useConnection();
	const { data: market } = useSelectedResolvedMarket({ ctxMode: "realtime" });

	const storedMarginMode = useMarginMode();
	const { setMarginMode: setStoredMarginMode } = useGlobalSettingsActions();

	const maxLeverage = market?.maxLeverage ?? DEFAULT_MAX_LEVERAGE;
	const coin = market?.coin;
	const assetIndex = market?.assetIndex;

	const { data: activeAssetData, status: subscriptionStatus } = useSubActiveAssetData(
		{ coin: coin ?? "", user: address ?? "" },
		{ enabled: isConnected && !!address && !!coin },
	);

	const { data: clearinghouseEvent } = useSubClearinghouseState(
		{ user: address ?? "" },
		{ enabled: isConnected && !!address },
	);

	const {
		mutateAsync: updateLeverage,
		isPending: isUpdating,
		error: updateError,
		reset: resetMutation,
	} = useExchangeUpdateLeverage();

	const {
		mutateAsync: updateLeverageForMode,
		isPending: isSwitchingMode,
		error: switchModeError,
		reset: resetModeMutation,
	} = useExchangeUpdateLeverage();

	const [pendingLeverage, setPendingLeverageState] = useState<number | null>(null);
	const [disconnectedLeverage, setDisconnectedLeverage] = useState<number | null>(null);

	const onChainLeverage = activeAssetData?.leverage?.value ?? null;
	const onChainMarginMode = getMarginModeFromLeverage(activeAssetData?.leverage);

	const marginMode = useMemo((): MarginMode => {
		if (isConnected && activeAssetData?.leverage) {
			return onChainMarginMode;
		}
		return storedMarginMode;
	}, [isConnected, activeAssetData?.leverage, onChainMarginMode, storedMarginMode]);

	const hasPosition = useMemo(() => {
		if (!coin || !clearinghouseEvent?.clearinghouseState?.assetPositions) return false;
		const position = clearinghouseEvent.clearinghouseState.assetPositions.find((p) => p.position.coin === coin);
		if (!position) return false;
		const size = parseNumber(position.position.szi);
		return Number.isFinite(size) && size !== 0;
	}, [coin, clearinghouseEvent?.clearinghouseState?.assetPositions]);

	const currentLeverage = useMemo(() => {
		if (isConnected && onChainLeverage !== null) {
			return onChainLeverage;
		}
		if (disconnectedLeverage !== null) {
			return disconnectedLeverage;
		}
		return getDefaultLeverage(maxLeverage);
	}, [isConnected, onChainLeverage, disconnectedLeverage, maxLeverage]);

	const displayLeverage = pendingLeverage ?? currentLeverage;
	const isDirty = pendingLeverage !== null && pendingLeverage !== currentLeverage;

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset state when coin changes
	useEffect(() => {
		setPendingLeverageState(null);
		resetMutation();
		resetModeMutation();
	}, [coin, resetMutation, resetModeMutation]);

	const setPendingLeverage = useCallback(
		(value: number) => {
			const clamped = Math.max(1, Math.min(value, maxLeverage));
			if (!isConnected) {
				setDisconnectedLeverage(clamped);
				setPendingLeverageState(null);
				return;
			}
			if (clamped === currentLeverage) {
				setPendingLeverageState(null);
			} else {
				setPendingLeverageState(clamped);
			}
		},
		[maxLeverage, isConnected, currentLeverage],
	);

	const resetPending = useCallback(() => {
		setPendingLeverageState(null);
		resetMutation();
	}, [resetMutation]);

	const confirmLeverage = useCallback(async () => {
		if (pendingLeverage === null || typeof assetIndex !== "number") {
			return;
		}

		await updateLeverage({
			asset: assetIndex,
			isCross: marginMode === "cross",
			leverage: pendingLeverage,
		});

		setPendingLeverageState(null);
	}, [pendingLeverage, assetIndex, updateLeverage, marginMode]);

	const switchMarginMode = useCallback(
		async (mode: MarginMode) => {
			if (typeof assetIndex !== "number") return;
			if (!isConnected) {
				setStoredMarginMode(mode);
				return;
			}

			await updateLeverageForMode({
				asset: assetIndex,
				isCross: mode === "cross",
				leverage: currentLeverage,
			});

			setStoredMarginMode(mode);
		},
		[assetIndex, isConnected, currentLeverage, updateLeverageForMode, setStoredMarginMode],
	);

	const availableToSell = useMemo(() => {
		const raw = activeAssetData?.availableToTrade?.[0];
		return raw !== undefined ? parseNumber(raw) : null;
	}, [activeAssetData?.availableToTrade]);

	const availableToBuy = useMemo(() => {
		const raw = activeAssetData?.availableToTrade?.[1];
		return raw !== undefined ? parseNumber(raw) : null;
	}, [activeAssetData?.availableToTrade]);

	const maxTradeSzs = useMemo(() => {
		const raw = activeAssetData?.maxTradeSzs;
		if (!raw) return null;
		const min = parseNumber(raw[0]);
		const max = parseNumber(raw[1]);
		return min !== null && max !== null ? ([min, max] as [number, number]) : null;
	}, [activeAssetData?.maxTradeSzs]);

	const normalizedStatus = useMemo((): "idle" | "loading" | "success" | "error" => {
		if (!isConnected || !coin) return "idle";
		if (subscriptionStatus === "subscribing") return "loading";
		if (subscriptionStatus === "error") return "error";
		if (subscriptionStatus === "active") return "success";
		return "idle";
	}, [isConnected, coin, subscriptionStatus]);

	return {
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		displayLeverage,
		isDirty,
		isConnected,
		setPendingLeverage,
		confirmLeverage,
		resetPending,
		availableToSell,
		availableToBuy,
		maxTradeSzs,
		isUpdating,
		updateError: updateError as Error | null,
		subscriptionStatus: normalizedStatus,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError: switchModeError as Error | null,
	};
}
