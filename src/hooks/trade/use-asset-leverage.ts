import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { DEFAULT_MAX_LEVERAGE } from "@/config/constants";
import { getMarketCapabilities, useSelectedMarketInfo, useUserPositions } from "@/lib/hyperliquid";
import { useExchangeUpdateLeverage } from "@/lib/hyperliquid/hooks/exchange/useExchangeUpdateLeverage";
import { useSubActiveAssetData } from "@/lib/hyperliquid/hooks/subscription";
import { getMarginModeFromLeverage, type MarginMode } from "@/lib/trade/margin-mode";
import { parseNumber } from "@/lib/trade/numbers";
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
	/** Max trade sizes in base token: [long, short] */
	maxTradeSzs: [number, number] | null;
	/** Available to trade in quote token: [long, short] */
	availableToTrade: [number, number] | null;
	isUpdating: boolean;
	updateError: Error | null;
	subscriptionStatus: "idle" | "loading" | "success" | "error";
	marginMode: MarginMode;
	hasPosition: boolean;
	switchMarginMode: (mode: MarginMode) => Promise<void>;
	isSwitchingMode: boolean;
	switchModeError: Error | null;
	isOnlyIsolated: boolean;
	allowsCrossMargin: boolean;
}

function getDefaultLeverage(maxLeverage: number): number {
	return Math.min(10, maxLeverage);
}

export function useAssetLeverage(): UseAssetLeverageReturn {
	const { address, isConnected } = useConnection();
	const { data: market } = useSelectedMarketInfo();

	const storedMarginMode = useMarginMode();
	const { setMarginMode: setStoredMarginMode } = useGlobalSettingsActions();

	const capabilities = getMarketCapabilities(market);
	const { isOnlyIsolated, allowsCrossMargin } = capabilities;

	const maxLeverage = market?.kind === "spot" ? 1 : (market?.maxLeverage ?? DEFAULT_MAX_LEVERAGE);
	const baseToken = market ? market.name : undefined;
	const assetId = market?.assetId;

	const { data: activeAssetData, status: subscriptionStatus } = useSubActiveAssetData(
		{ coin: baseToken ?? "", user: address ?? "" },
		{ enabled: isConnected && !!address && !!baseToken },
	);

	const userPositions = useUserPositions();

	const { mutateAsync: updateLeverage, isPending, error, reset: resetMutation } = useExchangeUpdateLeverage();

	const operationTypeRef = useRef<OperationType>(null);
	const [pendingLeverage, setPendingLeverageState] = useState<number | null>(null);
	const [disconnectedLeverage, setDisconnectedLeverage] = useState<number | null>(null);

	const onChainLeverage = activeAssetData?.leverage?.value ?? null;
	const onChainMarginMode = getMarginModeFromLeverage(activeAssetData?.leverage);

	const marginMode = useMemo((): MarginMode => {
		if (isOnlyIsolated) {
			return "isolated";
		}
		if (isConnected && activeAssetData?.leverage) {
			return onChainMarginMode;
		}
		return storedMarginMode;
	}, [isOnlyIsolated, isConnected, activeAssetData?.leverage, onChainMarginMode, storedMarginMode]);

	const hasPosition = useMemo(() => {
		if (!baseToken) return false;
		return userPositions.hasPosition(baseToken);
	}, [baseToken, userPositions]);

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

			if (isOnlyIsolated && mode === "cross") {
				throw new Error("This market only supports isolated margin mode");
			}

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
		[
			assetId,
			isConnected,
			isOnlyIsolated,
			currentLeverage,
			marginMode,
			hasPosition,
			updateLeverage,
			setStoredMarginMode,
		],
	);

	const maxTradeSzs = useMemo((): [number, number] | null => {
		const raw = activeAssetData?.maxTradeSzs;
		if (!raw) return null;
		const long = parseNumber(raw[0]);
		const short = parseNumber(raw[1]);
		return long !== null && short !== null ? [long, short] : null;
	}, [activeAssetData?.maxTradeSzs]);

	const availableToTrade = useMemo((): [number, number] | null => {
		const raw = activeAssetData?.availableToTrade;
		if (!raw) return null;
		const long = parseNumber(raw[0]);
		const short = parseNumber(raw[1]);
		return long !== null && short !== null ? [long, short] : null;
	}, [activeAssetData?.availableToTrade]);

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
		maxTradeSzs,
		availableToTrade,
		isUpdating,
		updateError,
		subscriptionStatus: normalizedStatus,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
		isOnlyIsolated,
		allowsCrossMargin,
	};
}
