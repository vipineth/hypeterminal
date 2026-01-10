import type { HyperliquidApiStatus } from "../types";
import { useHttpStatus } from "./useHttpStatus";
import { useWsStatus } from "./useWsStatus";

export function useHyperliquidApiStatus(): HyperliquidApiStatus {
	const http = useHttpStatus();
	const ws = useWsStatus();

	return {
		http,
		ws,
	};
}
