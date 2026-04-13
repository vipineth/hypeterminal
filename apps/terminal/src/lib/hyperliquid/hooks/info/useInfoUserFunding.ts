import { type InfoParams, useInfo } from "@hypeterminal/hl-react";

export function useInfoUserFunding(params: InfoParams<"userFunding">) {
	return useInfo("userFunding", params);
}
