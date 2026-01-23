import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { DEFAULT_MAX_LEVERAGE } from "@/config/constants";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { getBaseToken } from "@/lib/market";
import { useExchangeUpdateLeverage } from "@/lib/hyperliquid/hooks/exchange/useExchangeUpdateLeverage";
import { useSubActiveAssetData, useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import { getMarginModeFromLeverage, type MarginMode } from "@/lib/trade/margin-mode";
import { parseNumber, toNumber } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, useMarginMode } from "@/stores/use-global-settings-store";

type OperationType = "leverage" | "mode" | null;

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
	const { data: market } = useSelectedMarketInfo();

	const storedMarginMode = useMarginMode();
	const { setMarginMode: setStoredMarginMode } = useGlobalSettingsActions();

	const maxLeverage = market?.kind === "spot" ? 1 : (market?.maxLeverage ?? DEFAULT_MAX_LEVERAGE);
	const baseToken = market ? getBaseToken(market.displayName, market.kind) : undefined;
	const assetId = market?.assetId;

	const { data: activeAssetData, status: subscriptionStatus } = useSubActiveAssetData(
		{ coin: baseToken ?? "", user: address ?? "" },
		{ enabled: isConnected && !!address && !!baseToken },
	);

	const { data: clearinghouseEvent } = useSubClearinghouseState(
		{ user: address ?? "" },
		{ enabled: isConnected && !!address },
	);

	const { mutateAsync: updateLeverage, isPending, error, reset: resetMutation } = useExchangeUpdateLeverage();

	const operationTypeRef = useRef<OperationType>(null);
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
		if (!baseToken || !clearinghouseEvent?.clearinghouseState?.assetPositions) return false;
		const position = clearinghouseEvent.clearinghouseState.assetPositions.find((p) => p.position.coin === baseToken);
		if (!position) return false;
		const size = toNumber(position.position.szi);
		return size !== null && size !== 0;
	}, [baseToken, clearinghouseEvent?.clearinghouseState?.assetPositions]);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: baseToken change triggers reset
	useEffect(() => {
		setPendingLeverageState(null);
		operationTypeRef.current = null;
		resetMutation();
	}, [baseToken, resetMutation]);

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
		operationTypeRef.current = null;
		resetMutation();
	}, [resetMutation]);

	const confirmLeverage = useCallback(async () => {
		if (pendingLeverage === null || typeof assetId !== "number") {
			return;
		}

		operationTypeRef.current = "leverage";
		await updateLeverage({
			asset: assetId,
			isCross: marginMode === "cross",
			leverage: pendingLeverage,
		});

		setPendingLeverageState(null);
	}, [pendingLeverage, assetId, updateLeverage, marginMode]);

	const switchMarginMode = useCallback(
		async (mode: MarginMode) => {
			if (typeof assetId !== "number") return;

			if (!isConnected) {
				setStoredMarginMode(mode);
				return;
			}

			if (mode === "isolated" && marginMode === "cross" && hasPosition) {
				throw new Error("Cannot switch to isolated mode with an open position");
			}

			operationTypeRef.current = "mode";
			await updateLeverage({
				asset: assetId,
				isCross: mode === "cross",
				leverage: currentLeverage,
			});

			setStoredMarginMode(mode);
		},
		[assetId, isConnected, currentLeverage, marginMode, hasPosition, updateLeverage, setStoredMarginMode],
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
		if (!isConnected || !baseToken) return "idle";
		if (subscriptionStatus === "subscribing") return "loading";
		if (subscriptionStatus === "error") return "error";
		if (subscriptionStatus === "active") return "success";
		return "idle";
	}, [isConnected, baseToken, subscriptionStatus]);

	const isUpdating = isPending && operationTypeRef.current === "leverage";
	const isSwitchingMode = isPending && operationTypeRef.current === "mode";
	const updateError = error && operationTypeRef.current === "leverage" ? (error as Error) : null;
	const switchModeError = error && operationTypeRef.current === "mode" ? (error as Error) : null;

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
		updateError,
		subscriptionStatus: normalizedStatus,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
	};
}
