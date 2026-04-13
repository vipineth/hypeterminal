import { type InfoParams, useInfo } from "@hypeterminal/hl-react";

export function useInfoHistoricalOrders(params: InfoParams<"historicalOrders">) {
	return useInfo("historicalOrders", params);
}
