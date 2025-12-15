import { createHyperliquidWsHook } from "./use-hyperliquid-ws";

export const useTradesSubscription = createHyperliquidWsHook("trades");
