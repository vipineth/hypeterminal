import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { StarIcon, XIcon } from "@phosphor-icons/react";
import { get24hChange } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { useMarketsInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useFavoriteMarkets, useMarketActions, useSelectedMarket } from "@/stores/use-market-store";

export function FavoritesStrip() {
	const favorites = useFavoriteMarkets();
	const selectedMarket = useSelectedMarket();

	if (favorites.length === 0) {
		return (
			<div className="flex items-center gap-2 text-xs text-fg">
				<StarIcon className="size-3" />
				<span>{t`Select favorite markets`}</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
			<StarIcon weight="fill" className="size-3 shrink-0 text-yellow" />
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

	function selectFavoriteMarket() {
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
				variant="link"
				intent="neutral"
				onClick={selectFavoriteMarket}
				onKeyDown={handleKeyDown}
				tabIndex={0}
				aria-pressed={isActive}
				aria-label={t`Select ${displayName} market`}
				className={cn(
					"flex items-center gap-1.5 shrink-0 px-2 py-1 text-xs rounded-8 border no-underline transition-[color,background-color,border-color,opacity] duration-150 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
					isActive
						? "border-stroke-weak/90 bg-fill-weak"
						: "border-stroke-weak/35 bg-fill-weaker/50 hover:border-stroke-weak/55 hover:bg-fill-weak/80 opacity-90",
				)}
			>
				<span className={cn("font-semibold uppercase transition-colors", isActive ? "text-fg" : "text-fg-muted")}>
					{displayName}
				</span>
				{changePct != null && (
					<span
						className={cn(
							"tabular-nums font-medium transition-opacity",
							getValueColorClass(changePct),
							!isActive && "opacity-85",
						)}
					>
						{formatPercent(changePct / 100)}
					</span>
				)}
			</Button>
			<button
				type="button"
				onClick={handleRemove}
				aria-label={t`Remove ${displayName} from favorites`}
				className="absolute -top-0.5 -right-0.5 hidden size-3 cursor-pointer items-center justify-center text-fg-muted hover:text-fg group-hover/fav:flex"
			>
				<XIcon className="size-2.5" weight="bold" />
			</button>
		</div>
	);
}
