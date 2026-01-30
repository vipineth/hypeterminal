import type { AllDexsClearinghouseStateWsEvent } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { toNumber } from "@/lib/trade/numbers";
import { useSubAllDexsClearinghouseState } from "../hooks/subscription";

type RawClearinghouseState = AllDexsClearinghouseStateWsEvent["clearinghouseStates"][number][1];
type RawPosition = RawClearinghouseState["assetPositions"][number];

export interface Position {
	dex: string;
	coin: string;
	szi: string;
	entryPx: string;
	positionValue: string;
	unrealizedPnl: string;
	returnOnEquity: string;
	liquidationPx: string | null;
	marginUsed: string;
	maxLeverage: number;
	leverage: RawPosition["position"]["leverage"];
	cumFunding: RawPosition["position"]["cumFunding"];
}

export interface UserPositions {
	positions: Position[];
	getPosition: (coin: string, dex?: string) => Position | null;
	hasPosition: (coin: string, dex?: string) => boolean;
	withdrawable: string;
	isLoading: boolean;
	hasError: boolean;
}

function normalizePositions(event: AllDexsClearinghouseStateWsEvent | undefined): Position[] {
	const clearinghouseStates = event?.clearinghouseStates;
	if (!clearinghouseStates?.length) return [];

	const positions: Position[] = [];
	for (const entry of clearinghouseStates) {
		const dex = entry[0];
		const state = entry[1];
		const assetPositions = state?.assetPositions;
		if (!assetPositions?.length) continue;

		for (const assetPosition of assetPositions) {
			const position = assetPosition?.position;
			if (!position) continue;

			const size = toNumber(position.szi);
			if (size === null || size === 0) continue;

			positions.push({
				dex,
				coin: position.coin,
				szi: position.szi,
				entryPx: position.entryPx,
				positionValue: position.positionValue,
				unrealizedPnl: position.unrealizedPnl,
				returnOnEquity: position.returnOnEquity,
				liquidationPx: position.liquidationPx,
				marginUsed: position.marginUsed,
				maxLeverage: position.maxLeverage,
				leverage: position.leverage,
				cumFunding: position.cumFunding,
			});
		}
	}
	return positions;
}

function getWithdrawable(event: AllDexsClearinghouseStateWsEvent | undefined): string {
	if (!event?.clearinghouseStates) return "0";
	const mainDex = event.clearinghouseStates.find(([dex]) => dex === "");
	return mainDex?.[1]?.withdrawable ?? "0";
}

const EMPTY: UserPositions = {
	positions: [],
	getPosition: () => null,
	hasPosition: () => false,
	withdrawable: "0",
	isLoading: false,
	hasError: false,
};

export function useUserPositions(): UserPositions {
	const { address, isConnected } = useConnection();
	const enabled = isConnected && !!address;

	const { data, status } = useSubAllDexsClearinghouseState(
		{ user: address ?? "" },
		{ enabled },
	);

	const isLoading = enabled && (status === "subscribing" || status === "idle");
	const hasError = status === "error";

	return useMemo(() => {
		if (!enabled) return EMPTY;

		const positions = normalizePositions(data);
		const withdrawable = getWithdrawable(data);

		return {
			positions,
			withdrawable,
			isLoading,
			hasError,

			getPosition(coin: string, dex?: string) {
				if (dex !== undefined) {
					return positions.find((p) => p.coin === coin && p.dex === dex) ?? null;
				}
				return positions.find((p) => p.coin === coin) ?? null;
			},

			hasPosition(coin: string, dex?: string) {
				return this.getPosition(coin, dex) !== null;
			},
		};
	}, [data, enabled, isLoading, hasError]);
}
