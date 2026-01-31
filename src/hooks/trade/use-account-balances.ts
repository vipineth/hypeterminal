import type { AllDexsClearinghouseStateWsEvent, SpotStateWsEvent } from "@nktkas/hyperliquid";
import { useConnection } from "wagmi";
import { useSubAllDexsClearinghouseState, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";

type RawClearinghouseState = AllDexsClearinghouseStateWsEvent["clearinghouseStates"][number][1];

export type PerpSummary = RawClearinghouseState["crossMarginSummary"];
export type PerpPosition = RawClearinghouseState["assetPositions"][number];
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

	const { data: clearinghouseEvent, status: perpStatus } = useSubAllDexsClearinghouseState(
		{ user: address ?? "" },
		{ enabled },
	);

	const { data: spotEvent, status: spotStatus } = useSubSpotState({ user: address ?? "0x0" }, { enabled });

	const mainDex = clearinghouseEvent?.clearinghouseStates?.find(([dex]) => dex === "")?.[1];
	const perpSummary = mainDex?.crossMarginSummary ?? null;
	const perpPositions = mainDex?.assetPositions ?? EMPTY_PERP_POSITIONS;
	const spotBalances = spotEvent?.spotState?.balances ?? EMPTY_SPOT_BALANCES;

	const isLoading =
		perpStatus === "subscribing" || perpStatus === "idle" || spotStatus === "subscribing" || spotStatus === "idle";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return { perpSummary, perpPositions, spotBalances, isLoading, hasError };
}
