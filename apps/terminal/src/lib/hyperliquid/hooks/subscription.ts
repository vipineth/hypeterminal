import { type SubscriptionOptions, useSubscription } from "@hypeterminal/hl-react";

export function useSubAllMids(params: { dex?: string } | undefined, options?: SubscriptionOptions) {
	return useSubscription("allMids", params, options);
}
