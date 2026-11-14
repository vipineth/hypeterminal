import { useConnection } from "wagmi";
import { type AccountState, buildAccountState, parseAccountMode } from "@/domain/trade/account-mode";
import { useSubscription } from "@/lib/hyperliquid";

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
