import { useMarketsContext } from "./context";
import type { Markets } from "./types";

export function useMarkets(): Markets {
	return useMarketsContext();
}
