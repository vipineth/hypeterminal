import type { AllDexsClearinghouseStateWsEvent, SpotStateWsEvent, WebData3WsEvent } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { type AccountState, buildAccountState, parseAccountMode } from "@/domain/trade/account-mode";
import { useSubscription } from "@/lib/hyperliquid";

type RawClearinghouseState = AllDexsClearinghouseStateWsEvent["clearinghouseStates"][number][1];
type RawSpotState = SpotStateWsEvent["spotState"] & {
	tokenToAvailableAfterMaintenance?: Array<[number | string, string]>;
};

export type MarginSummary = RawClearinghouseState["marginSummary"];
export type PerpSummary = RawClearinghouseState["crossMarginSummary"];
export type PerpPosition = RawClearinghouseState["assetPositions"][number];
export type SpotBalance = NonNullable<SpotStateWsEvent["spotState"]["balances"]>[number];
export type SpotAvailableAfterMaintenance = NonNullable<RawSpotState["tokenToAvailableAfterMaintenance"]>;
export type AccountAbstraction = NonNullable<WebData3WsEvent["userState"]["abstraction"]> | null;

export interface AccountBalances {
	marginSummary: MarginSummary | null;
	perpSummary: PerpSummary | null;
	perpPositions: PerpPosition[];
	spotBalances: SpotBalance[];
	spotAvailableAfterMaintenance: SpotAvailableAfterMaintenance;
	accountAbstraction: AccountAbstraction;
	withdrawable: string;
	crossMaintenanceMarginUsed: string;
	isLoading: boolean;
	hasError: boolean;
}

const EMPTY_SPOT_BALANCES: SpotBalance[] = [];
const EMPTY_PERP_POSITIONS: PerpPosition[] = [];
const EMPTY_SPOT_AVAILABLE_AFTER_MAINTENANCE: SpotAvailableAfterMaintenance = [];

export interface AllDexsAccountState {
	clearinghouseStates: AllDexsClearinghouseStateWsEvent["clearinghouseStates"];
	spotBalances: SpotBalance[];
	spotAvailableAfterMaintenance: SpotAvailableAfterMaintenance;
	accountAbstraction: AccountAbstraction;
	isLoading: boolean;
	hasError: boolean;
}

export function useAllDexsAccountState(): AllDexsAccountState {
	const { address, isConnected } = useConnection();
	const enabled = isConnected && !!address;

	const { data: clearinghouseEvent, status: perpStatus } = useSubscription(
		"allDexsClearinghouseState",
		{ user: address ?? "" },
		{ enabled },
	);

	const { data: spotEvent, status: spotStatus } = useSubscription("spotState", { user: address ?? "0x0" }, { enabled });
	const { data: webData3Event, status: webData3Status } = useSubscription(
		"webData3",
		{ user: address ?? "0x0" },
		{ enabled },
	);
	const spotState = spotEvent?.spotState as RawSpotState | undefined;

	const clearinghouseStates = clearinghouseEvent?.clearinghouseStates ?? [];
	const spotBalances = spotState?.balances ?? EMPTY_SPOT_BALANCES;
	const accountAbstraction = webData3Event?.userState.abstraction ?? null;
	const spotAvailableAfterMaintenance = useMemo(
		() => spotState?.tokenToAvailableAfterMaintenance ?? EMPTY_SPOT_AVAILABLE_AFTER_MAINTENANCE,
		[spotState?.tokenToAvailableAfterMaintenance],
	);

	const isLoading =
		perpStatus === "subscribing" ||
		perpStatus === "idle" ||
		spotStatus === "subscribing" ||
		spotStatus === "idle" ||
		webData3Status === "subscribing" ||
		webData3Status === "idle";
	const hasError = perpStatus === "error" || spotStatus === "error" || webData3Status === "error";

	return {
		clearinghouseStates,
		spotBalances,
		spotAvailableAfterMaintenance,
		accountAbstraction,
		isLoading,
		hasError,
	};
}

export function useDefaultDexBalances(): AccountBalances {
	const { clearinghouseStates, spotBalances, spotAvailableAfterMaintenance, accountAbstraction, isLoading, hasError } =
		useAllDexsAccountState();

	const mainDex = clearinghouseStates.find(([dex]) => dex === "")?.[1];
	const marginSummary = mainDex?.marginSummary ?? null;
	const perpSummary = mainDex?.crossMarginSummary ?? null;
	const perpPositions = mainDex?.assetPositions ?? EMPTY_PERP_POSITIONS;
	const withdrawable = mainDex?.withdrawable ?? "0";
	const crossMaintenanceMarginUsed = mainDex?.crossMaintenanceMarginUsed ?? "0";

	return {
		marginSummary,
		perpSummary,
		perpPositions,
		spotBalances,
		spotAvailableAfterMaintenance,
		accountAbstraction,
		withdrawable,
		crossMaintenanceMarginUsed,
		isLoading,
		hasError,
	};
}

export function useAccountState(): AccountState {
	const { address, isConnected } = useConnection();
	const enabled = isConnected && !!address;
	const user = address ?? "0x0";

	const perp = useSubscription("allDexsClearinghouseState", { user }, { enabled });
	const spot = useSubscription("spotState", { user }, { enabled });
	const webData3 = useSubscription("webData3", { user }, { enabled });

	if (!enabled) return { status: "loading" };
	if (perp.status === "error" || spot.status === "error" || webData3.status === "error") return { status: "error" };
	if (!perp.data || !spot.data || !webData3.data) return { status: "loading" };

	const { abstraction, dexAbstractionEnabled } = webData3.data.userState;
	return buildAccountState({
		user,
		mode: parseAccountMode(abstraction, dexAbstractionEnabled),
		clearinghouseStates: perp.data.clearinghouseStates,
		spot: spot.data.spotState,
	});
}
