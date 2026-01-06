import { useQuery } from "@tanstack/react-query";
import type { HttpApiStatus } from "../types";
import { statusKeys } from "../query/keys";
import { useConfig } from "./useConfig";
import { useHyperliquidClients } from "./useClients";

const HTTP_STATUS_INTERVAL_MS = 60_000;

export type HttpStatusResult = {
  status: HttpApiStatus;
  error: unknown;
};

export function useHttpStatus(): HttpStatusResult {
  const config = useConfig();
  const { info } = useHyperliquidClients();

  const { status, fetchStatus, error } = useQuery({
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

  let httpStatus: HttpApiStatus;
  if (status === "error") {
    httpStatus = "error";
  } else if (fetchStatus === "fetching") {
    httpStatus = "checking";
  } else if (status === "success") {
    httpStatus = "ok";
  } else {
    httpStatus = "idle";
  }

  return {
    status: httpStatus,
    error,
  };
}
