import { t } from "@lingui/core/macro";
import { Star } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePerpMarketRegistry } from "@/hooks/hyperliquid/use-market-registry";
import { useActiveAssetCtxSubscription } from "@/hooks/hyperliquid/socket/use-active-asset-ctx-subscription";
import { useAllMidsSubscription } from "@/hooks/hyperliquid/socket/use-all-mids-subscription";
import { formatPercent, formatPrice } from "@/lib/format";
import { calculate24hPriceChange } from "@/lib/market";
import { isPerpMarketKey, type PerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { toFiniteNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { useFavoriteMarketKeys, useMarketPrefsActions, useSelectedMarketKey } from "@/stores/use-market-prefs-store";

type FavoriteData = {
	marketKey: PerpMarketKey;
	coin: string;
	priceNumber: number | null;
	szDecimals: number;
};

export function FavoritesStrip() {
	const favorites = useFavoriteMarketKeys();
	const selectedMarketKey = useSelectedMarketKey();
	const { registry } = usePerpMarketRegistry();
	const { data: mids } = useAllMidsSubscription<Record<string, string> | undefined>({
		select: (event) => event?.mids,
	});

	const favoriteData = useMemo((): FavoriteData[] => {
		return favorites
			.map((marketKey) => {
				if (!isPerpMarketKey(marketKey)) return null;
				const coin = perpCoinFromMarketKey(marketKey);
				const marketInfo = registry?.coinToInfo.get(coin);

				return {
					marketKey,
					coin,
					priceNumber: toFiniteNumber(mids?.[coin]),
					szDecimals: marketInfo?.szDecimals ?? 4,
				};
			})
			.filter((x): x is FavoriteData => x !== null);
	}, [favorites, mids, registry]);

	return (
		<div className="py-1.5 border-b border-border/60 bg-surface/20">
			<ScrollArea className="w-full whitespace-nowrap">
				<div className="flex items-center gap-0.5 px-2 min-w-full divide-x">
					{favorites.length === 0 ? (
						<EmptyState />
					) : (
						favoriteData.map((data) => (
							<FavoriteChip key={data.marketKey} {...data} isActive={data.marketKey === selectedMarketKey} />
						))
					)}
				</div>
				<ScrollBar orientation="horizontal" className="hidden" />
			</ScrollArea>
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
	const { data: assetCtx } = useActiveAssetCtxSubscription({
		params: { coin },
		select: (event) => event?.ctx,
	});
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
		<button
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={t`Select ${coin} market`}
			aria-pressed={isActive}
			className={cn(
				"shrink-0 inline-flex items-center gap-2 px-2.5 py-0.5 text-3xs transition-colors cursor-pointer",
				"hover:bg-accent/50",
				isActive && "bg-terminal-cyan/10",
			)}
		>
			<span className={cn("font-medium", isActive ? "text-terminal-cyan" : "text-foreground")}>{coin}</span>
			{typeof priceNumber === "number" && (
				<span className="text-muted-foreground tabular-nums">{formatPrice(priceNumber, { szDecimals })}</span>
			)}
			{assetCtx && (
				<span className={cn("tabular-nums font-medium", isPositive ? "text-terminal-green" : "text-terminal-red")}>
					{formatPercent(changePct / 100, {
						minimumFractionDigits: 2,
						signDisplay: "exceptZero",
					})}
				</span>
			)}
		</button>
	);
}
