import { t } from "@lingui/core/macro";
import { useEffect, useEffectEvent } from "react";
import { toast } from "sonner";
import { useDisconnectWallet } from "@/hooks/use-disconnect-wallet";
import { useIsPhoneLinked } from "@/hooks/use-is-phone-linked";
import { useAgentStatus } from "@/lib/hyperliquid";

export function PhoneLinkGuard() {
	const isPhoneLinked = useIsPhoneLinked();
	const { isLoading, signaturesRequired, refetch } = useAgentStatus();
	const { mutate: disconnect } = useDisconnectWallet();
	const lostAccess = isPhoneLinked && !isLoading && signaturesRequired > 0;

	const confirmAndDisconnect = useEffectEvent(async (isCancelled: () => boolean) => {
		const fresh = await refetch().catch(() => null);
		if (isCancelled() || !fresh || fresh.signaturesRequired === 0) return;
		disconnect();
		toast.error(t`Phone link ended. Link again from desktop.`);
	});

	useEffect(() => {
		if (!lostAccess) return;
		let cancelled = false;
		confirmAndDisconnect(() => cancelled);
		return () => {
			cancelled = true;
		};
	}, [lostAccess]);

	return null;
}
