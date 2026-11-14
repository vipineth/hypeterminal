import type { ActiveAssetDataResponse } from "@nktkas/hyperliquid";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { getPositionDex } from "@/domain/market";
import { getMarketCapabilities } from "@/domain/market/capabilities";
import { getDefaultLeverage, getMaxLeverage } from "@/domain/market/model";
import { type AppliedLeverage, parseAccountMode, type QuoteCheck } from "@/domain/trade/account-mode";
import { useExchange, useSelectedMarketInfo, useSubscription, useUserPositions } from "@/lib/hyperliquid";
import { getMarginModeFromLeverage, type MarginMode } from "@/lib/trade/margin-mode";
import { bumpCollateralGeneration, firstSeen, useCollateralGeneration } from "@/stores/use-collateral-generation-store";
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
	quote: QuoteCheck;
	isUpdating: boolean;
	updateError: Error | null;
	subscriptionStatus: "idle" | "loading" | "success" | "error";
	marginMode: MarginMode;
	hasPosition: boolean;
	switchMarginMode: (mode: MarginMode) => Promise<void>;
	applyMarginAndLeverage: (mode: MarginMode, leverageValue: number) => Promise<void>;
	isSwitchingMode: boolean;
	switchModeError: Error | null;
	isOnlyIsolated: boolean;
	allowsCrossMargin: boolean;
}

function isAppliedIn(quote: ActiveAssetDataResponse | undefined, applied: AppliedLeverage): boolean {
	return (
		quote?.user.toLowerCase() === applied.user.toLowerCase() &&
		quote.coin === applied.coin &&
		quote.leverage.type === applied.leverage.type &&
		quote.leverage.value === applied.leverage.value
	);
}

export function useAssetLeverage(): UseAssetLeverageReturn {
	const { address, isConnected } = useConnection();
	const { data: market } = useSelectedMarketInfo();

	const storedMarginMode = useMarginMode();
	const { setMarginMode: setStoredMarginMode } = useGlobalSettingsActions();

	const capabilities = getMarketCapabilities(market);
	const { isOnlyIsolated, allowsCrossMargin } = capabilities;
	const isPerpMarket = market?.kind === "perp" || market?.kind === "builderPerp";

	const maxLeverage = getMaxLeverage(market);
	const baseToken = market ? market.name : undefined;
	const assetId = market?.assetId;

	const {
		data: activeAssetData,
		status: subscriptionStatus,
		isStale: isQuoteStale,
	} = useSubscription(
		"activeAssetData",
		{ coin: baseToken ?? "", user: address ?? "" },
		{ enabled: isConnected && !!address && !!baseToken && isPerpMarket },
	);

	const { data: accountData } = useSubscription(
		"webData3",
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const accountMode = accountData
		? parseAccountMode(accountData.userState.abstraction, accountData.userState.dexAbstractionEnabled)
		: null;

	const generation = useCollateralGeneration();
	const userPositions = useUserPositions();

	const { mutateAsync: updateLeverage, isPending, error, reset: resetMutation } = useExchange("updateLeverage");

	const [applied, setApplied] = useState<AppliedLeverage | null>(null);
	if (applied && (applied.user !== address || isAppliedIn(activeAssetData, applied))) setApplied(null);

	const operationTypeRef = useRef<OperationType>(null);
	const [pendingLeverage, setPendingLeverageState] = useState<number | null>(null);
	const [disconnectedLeverage, setDisconnectedLeverage] = useState<number | null>(null);

	const onChainLeverage = activeAssetData?.leverage?.value ?? null;
	const onChainMarginMode = getMarginModeFromLeverage(activeAssetData?.leverage);

	function computeMarginMode(): MarginMode {
		if (isOnlyIsolated) {
			return "isolated";
		}
		if (isConnected && activeAssetData?.leverage) {
			return onChainMarginMode;
		}
		return storedMarginMode;
	}
	const marginMode = computeMarginMode();

	const hasPosition = market ? userPositions.hasPosition(market.name, getPositionDex(market)) : false;

	function computeCurrentLeverage(): number {
		if (isConnected && onChainLeverage !== null) {
			return onChainLeverage;
		}
		if (disconnectedLeverage !== null) {
			return disconnectedLeverage;
		}
		return getDefaultLeverage(market);
	}
	const currentLeverage = computeCurrentLeverage();

	const displayLeverage = pendingLeverage ?? currentLeverage;
	const isDirty = pendingLeverage !== null && pendingLeverage !== currentLeverage;

	// biome-ignore lint/correctness/useExhaustiveDependencies: baseToken change triggers reset
	useEffect(() => {
		setPendingLeverageState(null);
		operationTypeRef.current = null;
		resetMutation();
	}, [baseToken, resetMutation]);

	function setPendingLeverage(value: number) {
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
	}

	function resetPending() {
		setPendingLeverageState(null);
		operationTypeRef.current = null;
		resetMutation();
	}

	async function confirmLeverage() {
		if (!isPerpMarket || pendingLeverage === null || typeof assetId !== "number") {
			return;
		}

		operationTypeRef.current = "leverage";
		await updateLeverage({
			asset: assetId,
			isCross: marginMode === "cross",
			leverage: pendingLeverage,
		});
		markApplied(marginMode, pendingLeverage);

		setPendingLeverageState(null);
	}

	async function switchMarginMode(mode: MarginMode) {
		if (!isPerpMarket || typeof assetId !== "number") return;

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
		markApplied(mode, currentLeverage);

		setStoredMarginMode(mode);
	}

	async function applyMarginAndLeverage(mode: MarginMode, leverageValue: number) {
		if (!isPerpMarket || typeof assetId !== "number") return;

		const clamped = Math.max(1, Math.min(Math.round(leverageValue), maxLeverage));

		if (isOnlyIsolated && mode === "cross") {
			throw new Error("This market only supports isolated margin mode");
		}

		if (!isConnected) {
			setStoredMarginMode(mode);
			setDisconnectedLeverage(clamped);
			setPendingLeverageState(null);
			return;
		}

		if (mode === "isolated" && marginMode === "cross" && hasPosition) {
			throw new Error("Cannot switch to isolated mode with an open position");
		}

		operationTypeRef.current = "mode";
		await updateLeverage({
			asset: assetId,
			isCross: mode === "cross",
			leverage: clamped,
		});
		markApplied(mode, clamped);

		setStoredMarginMode(mode);
		setPendingLeverageState(null);
	}

	function markApplied(mode: MarginMode, value: number) {
		if (!baseToken || !address) return;
		const leverage: ActiveAssetDataResponse["leverage"] =
			mode === "cross" ? { type: "cross", value } : { type: "isolated", value, rawUsd: "0" };
		setApplied({ user: address, coin: baseToken, leverage });
		bumpCollateralGeneration();
	}

	function computeQuote(): QuoteCheck {
		if (!activeAssetData || subscriptionStatus !== "active" || isQuoteStale) return { status: "waiting" };
		return {
			status: "live",
			quote: activeAssetData,
			applied,
			seen: firstSeen(activeAssetData, generation, accountMode),
		};
	}
	const quote = computeQuote();

	function computeNormalizedStatus(): "idle" | "loading" | "success" | "error" {
		if (!isConnected || !baseToken) return "idle";
		if (subscriptionStatus === "subscribing") return "loading";
		if (subscriptionStatus === "error") return "error";
		if (subscriptionStatus === "active") return "success";
		return "idle";
	}
	const normalizedStatus = computeNormalizedStatus();

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
		quote,
		isUpdating,
		updateError,
		subscriptionStatus: normalizedStatus,
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
