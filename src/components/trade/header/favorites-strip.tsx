import type { ActiveAssetCtxEvent } from "@nktkas/hyperliquid/api/subscription";
import { Star } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useActiveAssetCtxSubscription, useAllMidsSubscription } from "@/hooks/hyperliquid";
import { formatPercent, formatUSD } from "@/lib/format";
import { isPerpMarketKey, type PerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid";
import { cn } from "@/lib/utils";
import { useFavoriteMarketKeys, useMarketPrefsActions, useSelectedMarketKey } from "@/stores/use-market-prefs-store";

type AssetCtx = ActiveAssetCtxEvent["ctx"];

type FavoriteData = {
	marketKey: PerpMarketKey;
	coin: string;
	price: string | undefined;
};

export function FavoritesStrip() {
	const favorites = useFavoriteMarketKeys();
	const selectedMarketKey = useSelectedMarketKey();
	const { data: mids } = useAllMidsSubscription<Record<string, string> | undefined>({
		select: (event) => event?.mids,
	});

	const favoriteData = useMemo((): FavoriteData[] => {
		return favorites
			.map((marketKey) => {
				if (!isPerpMarketKey(marketKey)) return null;
				const coin = perpCoinFromMarketKey(marketKey);

				return {
					marketKey,
					coin,
					price: mids?.[coin],
				};
			})
			.filter((x): x is FavoriteData => x !== null);
	}, [favorites, mids]);

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
			<span>Select favorite markets</span>
		</div>
	);
}

type FavoriteChipProps = FavoriteData & {
	isActive: boolean;
};

function FavoriteChip({ marketKey, coin, price, isActive }: FavoriteChipProps) {
	const { setSelectedMarketKey } = useMarketPrefsActions();
	const { data: assetCtx } = useActiveAssetCtxSubscription({
		params: { coin },
		select: (event) => event?.ctx,
	});
	const changePct = calculateChangePct(assetCtx);
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
			aria-label={`Select ${coin} market`}
			aria-pressed={isActive}
			className={cn(
				"shrink-0 inline-flex items-center gap-2 px-2.5 py-0.5 text-3xs transition-colors cursor-pointer",
				"hover:bg-accent/50",
				isActive && "bg-terminal-cyan/10",
			)}
		>
			<span className={cn("font-medium", isActive ? "text-terminal-cyan" : "text-foreground")}>{coin}</span>
			{price && <span className="text-muted-foreground tabular-nums">{formatUSD(parseFloat(price))}</span>}
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

function calculateChangePct(assetCtx: AssetCtx | undefined): number {
	if (!assetCtx) return 0;

	const markPx = parseFloat(assetCtx.markPx);
	const prevDayPx = parseFloat(assetCtx.prevDayPx);

	if (prevDayPx === 0) return 0;

	return ((markPx - prevDayPx) / prevDayPx) * 100;
}
