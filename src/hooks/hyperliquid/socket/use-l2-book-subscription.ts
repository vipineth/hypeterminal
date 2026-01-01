import { createHyperliquidWsHook } from "./use-hyperliquid-ws";

export const useL2BookSubscription = createHyperliquidWsHook("l2Book");
