import { type InfoParams, useInfo } from "@hypeterminal/hl-react";

export function useInfoUserNonFundingLedgerUpdates(params: InfoParams<"userNonFundingLedgerUpdates">) {
	return useInfo("userNonFundingLedgerUpdates", params);
}
