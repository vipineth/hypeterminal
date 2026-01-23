import type { ClearinghouseStateWsEvent, SpotStateWsEvent } from "@nktkas/hyperliquid";
import { useConnection } from "wagmi";
import { useSubClearinghouseState, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";

export type PerpSummary = ClearinghouseStateWsEvent["clearinghouseState"]["crossMarginSummary"];
export type PerpPosition = NonNullable<ClearinghouseStateWsEvent["clearinghouseState"]["assetPositions"]>[number];
export type SpotBalance = NonNullable<SpotStateWsEvent["spotState"]["balances"]>[number];

export interface AccountBalances {
	perpSummary: PerpSummary | null;
	perpPositions: PerpPosition[];
	spotBalances: SpotBalance[];
	isLoading: boolean;
	hasError: boolean;
}

const EMPTY_SPOT_BALANCES: SpotBalance[] = [];
const EMPTY_PERP_POSITIONS: PerpPosition[] = [];

export function useAccountBalances(): AccountBalances {
	const { address, isConnected } = useConnection();
	const enabled = isConnected && !!address;

	const { data: perpEvent, status: perpStatus } = useSubClearinghouseState({ user: address ?? "0x0" }, { enabled });

	const { data: spotEvent, status: spotStatus } = useSubSpotState({ user: address ?? "0x0" }, { enabled });

	const perpState = perpEvent?.clearinghouseState;
	const spotState = spotEvent?.spotState;
	const perpSummary = perpState?.crossMarginSummary ?? null;
	const perpPositions = perpState?.assetPositions ?? EMPTY_PERP_POSITIONS;
	const spotBalances = spotState?.balances ?? EMPTY_SPOT_BALANCES;

	const isLoading =
		perpStatus === "subscribing" || spotStatus === "subscribing" || perpStatus === "idle" || spotStatus === "idle";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return { perpSummary, perpPositions, spotBalances, isLoading, hasError };
}
export { getSpotBalance } from "@/lib/trade/balances";
