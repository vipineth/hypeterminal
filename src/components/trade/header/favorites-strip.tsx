import { t } from "@lingui/core/macro";
import { Star } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { formatPercent, formatPrice } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useSubActiveAssetCtx, useSubAllMids } from "@/lib/hyperliquid/hooks/subscription";
import { isPerpMarketKey, type PerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { calculate24hPriceChange } from "@/lib/market";
import { toFiniteNumber } from "@/lib/trade/numbers";
import clsx from "clsx";
import { useFavoriteMarketKeys, useMarketPrefsActions, useSelectedMarketKey } from "@/stores/use-market-prefs-store";
import type { PerpAssetCtx } from "@/types/hyperliquid";

type FavoriteData = {
	marketKey: PerpMarketKey;
	coin: string;
	priceNumber: number | null;
	szDecimals: number;
};

export function FavoritesStrip() {
	const favorites = useFavoriteMarketKeys();
	const selectedMarketKey = useSelectedMarketKey();
	const { getSzDecimals } = usePerpMarkets();
	const { data: midsEvent } = useSubAllMids({}, {});
	const mids = midsEvent?.mids;

	const favoriteData = useMemo((): FavoriteData[] => {
		return favorites
			.map((marketKey) => {
				if (!isPerpMarketKey(marketKey)) return null;
				const coin = perpCoinFromMarketKey(marketKey);

				return {
					marketKey,
					coin,
					priceNumber: toFiniteNumber(mids?.[coin]),
					szDecimals: getSzDecimals(coin) ?? 4,
				};
			})
			.filter((x): x is FavoriteData => x !== null);
	}, [favorites, mids, getSzDecimals]);

	return (
		<div className="py-1.5 border-b border-border/60 bg-surface/20">
			<div className="w-full whitespace-nowrap overflow-x-auto scrollbar-none">
				<div className="flex items-center gap-0.5 px-2 min-w-full divide-x">
					{favorites.length === 0 ? (
						<EmptyState />
					) : (
						favoriteData.map((data) => (
							<FavoriteChip key={data.marketKey} {...data} isActive={data.marketKey === selectedMarketKey} />
						))
					)}
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex items-center gap-2 text-3xs text-muted-foreground">
			<Star className="size-3" />
			<span>{t`Select favorite markets`}</span>
		</div>
	);
}

type FavoriteChipProps = FavoriteData & {
	isActive: boolean;
};

function FavoriteChip({ marketKey, coin, priceNumber, szDecimals, isActive }: FavoriteChipProps) {
	const { setSelectedMarketKey } = useMarketPrefsActions();
	const { data: assetCtxEvent } = useSubActiveAssetCtx({ coin }, {});
	const assetCtx = assetCtxEvent?.ctx as PerpAssetCtx | undefined;
	const changePct = calculate24hPriceChange(assetCtx) ?? 0;
	const isPositive = changePct >= 0;

	function handleClick() {
		setSelectedMarketKey(marketKey);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setSelectedMarketKey(marketKey);
		}
	}

	return (
		<Button
			variant="ghost"
			size="none"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={t`Select ${coin} market`}
			aria-pressed={isActive}
			className={clsx(
				"shrink-0 inline-flex items-center gap-2 px-2.5 py-0.5 text-3xs transition-colors cursor-pointer rounded-none",
				"hover:bg-accent/50",
				isActive && "bg-terminal-cyan/10",
			)}
		>
			<span className={clsx("font-medium", isActive ? "text-terminal-cyan" : "text-foreground")}>{coin}</span>
			{typeof priceNumber === "number" && (
				<span className="text-muted-foreground tabular-nums">{formatPrice(priceNumber, { szDecimals })}</span>
			)}
			{assetCtx && (
				<span className={clsx("tabular-nums font-medium", isPositive ? "text-terminal-green" : "text-terminal-red")}>
					{formatPercent(changePct / 100, {
						minimumFractionDigits: 2,
						signDisplay: "exceptZero",
					})}
				</span>
			)}
		</Button>
	);
}
