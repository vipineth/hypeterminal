import { useInfo } from "@hypeterminal/hl-react";
import { useConnection } from "wagmi";
import {
	ORDER_FEE_RATE_MAKER,
	ORDER_FEE_RATE_SPOT_MAKER,
	ORDER_FEE_RATE_SPOT_TAKER,
	ORDER_FEE_RATE_TAKER,
} from "@/config/trade";
import type { MarketKind } from "@/domain/market";

interface FeeRates {
	takerRate: number;
	makerRate: number;
}

const USER_FEES_STALE_TIME_MS = 30 * 60 * 1000;

function getDefaults(marketKind?: MarketKind): FeeRates {
	if (marketKind === "spot") {
		return { takerRate: ORDER_FEE_RATE_SPOT_TAKER, makerRate: ORDER_FEE_RATE_SPOT_MAKER };
	}
	return { takerRate: ORDER_FEE_RATE_TAKER, makerRate: ORDER_FEE_RATE_MAKER };
}

export function useFeeRates(marketKind?: MarketKind): FeeRates {
	const { address, isConnected } = useConnection();
	const defaults = getDefaults(marketKind);
	const user = address ?? "";

	const { data } = useInfo(
		"userFees",
		{ user },
		{ enabled: isConnected && Boolean(address), staleTime: USER_FEES_STALE_TIME_MS, persist: true },
	);

	if (!data) return defaults;

	const isSpot = marketKind === "spot";
	const takerRate = Number(isSpot ? data.userSpotCrossRate : data.userCrossRate);
	const makerRate = Number(isSpot ? data.userSpotAddRate : data.userAddRate);

	return {
		takerRate: Number.isFinite(takerRate) ? takerRate : defaults.takerRate,
		makerRate: Number.isFinite(makerRate) ? makerRate : defaults.makerRate,
	};
}
