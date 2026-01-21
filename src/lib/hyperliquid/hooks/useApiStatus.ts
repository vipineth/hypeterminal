import { useQuery } from "@tanstack/react-query";
import { statusKeys } from "../query/keys";
import { useHyperliquidClients } from "./useClients";
import { useConfig, useHyperliquidStore } from "./useConfig";

const HTTP_STATUS_INTERVAL_MS = 60_000;

export type ApiStatus = "idle" | "connecting" | "connected" | "error";

export type ApiStatusResult = {
	status: ApiStatus;
	error: unknown;
};

export function useApiStatus(): ApiStatusResult {
	const config = useConfig();
	const { info } = useHyperliquidClients();

	const { status: httpQueryStatus, fetchStatus, error: httpError } = useQuery({
		queryKey: statusKeys.http(),
		queryFn: async () => {
			await info.allMids();
			return true;
		},
		enabled: !config.ssr,
		refetchInterval: HTTP_STATUS_INTERVAL_MS,
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: false,
	});

	const wsStatus = useHyperliquidStore((state) => state.wsStatus);
	const wsError = useHyperliquidStore((state) => state.wsError);

	const httpOk = httpQueryStatus === "success";
	const httpChecking = fetchStatus === "fetching";
	const httpError_ = httpQueryStatus === "error";

	const wsOk = wsStatus === "open";
	const wsConnecting = wsStatus === "connecting";
	const wsError_ = wsStatus === "error";

	let status: ApiStatus;
	let error: unknown;

	if (httpError_ || wsError_) {
		status = "error";
		error = httpError ?? wsError;
	} else if (httpOk && wsOk) {
		status = "connected";
		error = undefined;
	} else if (httpChecking || wsConnecting) {
		status = "connecting";
		error = undefined;
	} else {
		status = "idle";
		error = undefined;
	}

	return { status, error };
}
