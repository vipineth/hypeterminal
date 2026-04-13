import { type InfoParams, useInfo } from "@hypeterminal/hl-react";

export function useInfoUserFillsByTime(params: InfoParams<"userFillsByTime">) {
	return useInfo("userFillsByTime", params);
}
