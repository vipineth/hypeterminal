import { useConnection } from "wagmi";
import { type AccountState, buildAccountState, parseAccountMode } from "@/domain/trade/account-mode";
import { useSubscription } from "@/lib/hyperliquid";
import { firstSeen, useCollateralGeneration } from "@/stores/use-collateral-generation-store";

export function useAccountState(): AccountState {
	const { address, isConnected } = useConnection();
	const enabled = isConnected && !!address;
	const user = address ?? "0x0";

	const perp = useSubscription("allDexsClearinghouseState", { user }, { enabled });
	const spot = useSubscription("spotState", { user }, { enabled });
	const webData3 = useSubscription("webData3", { user }, { enabled });
	const generation = useCollateralGeneration();

	if (!enabled) return { status: "loading" };
	if (perp.status === "error" || spot.status === "error" || webData3.status === "error") return { status: "error" };
	if (!perp.data || !spot.data || !webData3.data) return { status: "loading" };
	if (perp.isStale || spot.isStale || webData3.isStale) return { status: "loading" };

	const { abstraction, dexAbstractionEnabled } = webData3.data.userState;
	const mode = parseAccountMode(abstraction, dexAbstractionEnabled);
	return buildAccountState({
		user,
		mode,
		generation,
		clearinghouseStates: perp.data.clearinghouseStates,
		spot: spot.data.spotState,
		spotSeen: firstSeen(spot.data, generation, mode),
	});
}
