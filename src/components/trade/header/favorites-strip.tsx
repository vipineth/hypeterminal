import { t } from "@lingui/core/macro";
import { StarIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { get24hChange } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice } from "@/lib/format";
import { useMarketsInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/trade/numbers";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useFavoriteMarkets, useMarketActions, useSelectedMarket } from "@/stores/use-market-store";

export function FavoritesStrip() {
	const favorites = useFavoriteMarkets();
	const selectedMarket = useSelectedMarket();

	if (favorites.length === 0) {
		return (
			<div className="flex items-center gap-2 text-3xs text-text-950">
				<StarIcon className="size-3" />
				<span>{t`Select favorite markets`}</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
			<StarIcon weight="fill" className="size-3 shrink-0 text-highlight" />
			{favorites.map((name) => (
				<FavoriteChip key={name} name={name} isActive={name === selectedMarket} />
			))}
		</div>
	);
}

interface FavoriteChipProps {
	name: string;
	isActive: boolean;
}

function FavoriteChip({ name, isActive }: FavoriteChipProps) {
	const { scope } = useExchangeScope();
	const { setSelectedMarket, toggleFavoriteMarket } = useMarketActions();
	const { getMarketInfo } = useMarketsInfo();

	const market = getMarketInfo(name);
	const displayName = market?.pairName ?? name;
	const changePct = get24hChange(market?.prevDayPx, market?.markPx);
	const szDecimals = market?.szDecimals ?? 4;

	function handleClick() {
		setSelectedMarket(scope, name);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setSelectedMarket(scope, name);
		}
	}

	function handleRemove(e: React.MouseEvent) {
		e.stopPropagation();
		toggleFavoriteMarket(name);
	}

	return (
		<div className="group/fav relative shrink-0">
			<Button
				variant="text"
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				tabIndex={0}
				aria-label={t`Select ${displayName} market`}
				className={cn(
					"flex items-center gap-1 shrink-0 px-2 py-1.5 text-3xs rounded-sm bg-surface-execution border transition-colors",
					isActive ? "border-border-300" : "border-transparent hover:border-border-100",
				)}
			>
				<span className="font-medium text-text-950 uppercase">{displayName}</span>
				{market?.markPx != null && (
					<>
						<span className="tabular-nums text-text-950">{formatPrice(market.markPx, { szDecimals })}</span>
						{changePct != null && (
							<span className={cn("tabular-nums", getValueColorClass(changePct))}>
								{formatPercent(changePct / 100)}
							</span>
						)}
					</>
				)}
			</Button>
			<button
				type="button"
				onClick={handleRemove}
				aria-label={t`Remove ${displayName} from favorites`}
				className="absolute -top-0.5 -right-0.5 hidden size-3 cursor-pointer items-center justify-center bg-surface-execution text-text-600 hover:text-text-950 group-hover/fav:flex"
			>
				<XIcon className="size-2.5" weight="bold" />
			</button>
		</div>
	);
}
