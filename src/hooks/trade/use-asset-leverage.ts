import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { DEFAULT_MAX_LEVERAGE } from "@/config/interface";
import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { useExchangeUpdateLeverage } from "@/lib/hyperliquid/hooks/exchange/useExchangeUpdateLeverage";
import { useSubActiveAssetData } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber } from "@/lib/trade/numbers";

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
}

function getDefaultLeverage(maxLeverage: number): number {
	return Math.min(10, maxLeverage);
}

export function useAssetLeverage(): UseAssetLeverageReturn {
	const { address, isConnected } = useConnection();
	const { data: market } = useSelectedResolvedMarket({ ctxMode: "realtime" });

	const maxLeverage = market?.maxLeverage ?? DEFAULT_MAX_LEVERAGE;
	const coin = market?.coin;
	const assetIndex = market?.assetIndex;

	const { data: activeAssetData, status: subscriptionStatus } = useSubActiveAssetData(
		{ coin: coin ?? "", user: address ?? "" },
		{ enabled: isConnected && !!address && !!coin },
	);

	const {
		mutateAsync: updateLeverage,
		isPending: isUpdating,
		error: updateError,
		reset: resetMutation,
	} = useExchangeUpdateLeverage();

	const [pendingLeverage, setPendingLeverageState] = useState<number | null>(null);
	const [disconnectedLeverage, setDisconnectedLeverage] = useState<number | null>(null);

	const onChainLeverage = activeAssetData?.leverage?.value ?? null;

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

	useEffect(() => {
		setPendingLeverageState(null);
		resetMutation();
	}, [coin, resetMutation]);

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
			isCross: true,
			leverage: pendingLeverage,
		});

		setPendingLeverageState(null);
	}, [pendingLeverage, assetIndex, updateLeverage]);

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
	};
}
