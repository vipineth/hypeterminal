import type { WebSocketStatus } from "../types";
import { useHyperliquidStore } from "./useConfig";

export type WsStatusResult = {
  status: WebSocketStatus;
  error: unknown;
};

export function useWsStatus(): WsStatusResult {
  return useHyperliquidStore((state) => ({
    status: state.wsStatus,
    error: state.wsError,
  }));
}
