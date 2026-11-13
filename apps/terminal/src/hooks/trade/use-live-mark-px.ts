import { useSubscription } from "@/lib/hyperliquid";
import { toBig } from "@/lib/trade/numbers";

export function useLiveMarkPx(coin: string | null): string | null {
	const feed = useSubscription("activeAssetCtx", { coin: coin ?? "" }, { enabled: coin !== null });
	const markPx = feed.data?.ctx.markPx;
	if (feed.status !== "active" || feed.isStale || !markPx || !toBig(markPx)?.gt(0)) return null;
	return markPx;
}
