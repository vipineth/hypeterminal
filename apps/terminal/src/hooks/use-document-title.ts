import { useEffect } from "react";
import { SEO_DEFAULTS } from "@/config/seo";
import { formatPrice } from "@/lib/format";
import { useSelectedMarketInfo, useSubscription } from "@/lib/hyperliquid";

function getSpotSubscriptionCoin(market: ReturnType<typeof useSelectedMarketInfo>["data"]): string {
	if (market?.kind !== "spot") return "";
	return `@${market.ctxIndex}`;
}

export function TabTitleSync() {
	useDocumentTitle();
	return null;
}

export function useDocumentTitle() {
	const { data: market } = useSelectedMarketInfo();

	const isSpot = market?.kind === "spot";
	const perpCoin = market?.name ?? "";
	const spotCoin = getSpotSubscriptionCoin(market);

	const { data: perpCtxEvent } = useSubscription(
		"activeAssetCtx",
		{ coin: perpCoin },
		{ enabled: !!perpCoin && !isSpot, pauseWhenHidden: false },
	);
	const { data: spotCtxEvent } = useSubscription(
		"activeSpotAssetCtx",
		{ coin: spotCoin },
		{ enabled: !!spotCoin && isSpot, pauseWhenHidden: false },
	);

	const markPx = isSpot ? spotCtxEvent?.ctx?.markPx : perpCtxEvent?.ctx?.markPx;
	const pairName = market?.pairName;
	const priceDecimals = market?.priceDecimals;

	useEffect(() => {
		if (!markPx || !pairName) return;
		const price = formatPrice(markPx, { decimals: priceDecimals });
		document.title = `${price} · ${pairName} | HypeTerminal`;
	}, [markPx, pairName, priceDecimals]);

	useEffect(() => {
		return () => {
			document.title = SEO_DEFAULTS.defaultTitle;
		};
	}, []);
}
