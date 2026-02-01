import { t } from "@lingui/core/macro";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { get24hChange } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice } from "@/lib/format";
import { useMarketsInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/trade/numbers";
import { useFavoriteMarkets, useMarketActions, useSelectedMarket } from "@/stores/use-market-store";

export function FavoritesStrip() {
	const favorites = useFavoriteMarkets();
	const selectedMarket = useSelectedMarket();

	return (
		<div className="py-1.5 border-b border-border/60 bg-surface/20">
			<div className="w-full whitespace-nowrap overflow-x-auto scrollbar-none">
				<div className="flex items-center gap-0.5 px-2 min-w-full divide-x">
					{favorites.length === 0 ? (
						<EmptyState />
					) : (
						favorites.map((name) => <FavoriteChip key={name} name={name} isActive={name === selectedMarket} />)
					)}
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex items-center gap-2 text-3xs text-muted-fg">
			<Star className="size-3" />
			<span>{t`Select favorite markets`}</span>
		</div>
	);
}

interface FavoriteChipProps {
	name: string;
	isActive: boolean;
}

function FavoriteChip({ name, isActive }: FavoriteChipProps) {
	const { setSelectedMarket } = useMarketActions();
	const { getMarketInfo } = useMarketsInfo();

	const market = getMarketInfo(name);
	const displayName = market?.displayName ?? name;
	const changePct = get24hChange(market?.prevDayPx, market?.markPx);
	const szDecimals = market?.szDecimals ?? 4;

	function handleClick() {
		setSelectedMarket(name);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setSelectedMarket(name);
		}
	}

	return (
		<Button
			variant="ghost"
			size="none"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={t`Select ${displayName} market`}
			className={cn(
				"flex items-center gap-1.5 px-2 py-1 text-2xs cursor-pointer rounded-none first:rounded-l last:rounded-r",
				"hover:bg-accent/40 transition-colors border-border/30",
				isActive && "bg-info/5 text-info",
			)}
		>
			<span className="font-semibold">{displayName}</span>
			{market?.markPx != null && (
				<>
					<span className="tabular-nums text-muted-fg">{formatPrice(market.markPx, { szDecimals })}</span>
					{changePct != null && (
						<span className={cn("tabular-nums text-3xs", getValueColorClass(changePct))}>
							{formatPercent(changePct / 100)}
						</span>
					)}
				</>
			)}
		</Button>
	);
}
