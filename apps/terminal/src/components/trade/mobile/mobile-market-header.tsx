import { ButtonIcon } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CaretLeftIcon, StarIcon } from "@phosphor-icons/react";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { get24hChange } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice } from "@/lib/format";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useFavoriteMarkets, useMarketActions } from "@/stores/use-market-store";
import { TokenSelector } from "../chart/token-selector";

interface Props {
	market: UnifiedMarketInfo | undefined;
	onBack: () => void;
}

export function MobileMarketHeader({ market, onBack }: Props) {
	const { scope } = useExchangeScope();
	const { setSelectedMarket, toggleFavoriteMarket } = useMarketActions();
	const favoriteMarkets = useFavoriteMarkets();
	const isFavorite = !!market && favoriteMarkets.includes(market.name);
	const change24h = get24hChange(market?.prevDayPx, market?.markPx);

	return (
		<header className="shrink-0 pt-[env(safe-area-inset-top)] bg-surface border-b border-stroke-weak/60">
			<div className="h-12 pl-1 pr-2 flex items-center gap-1">
				<ButtonIcon
					variant="ghost"
					intent="neutral"
					size="md"
					className="touch-target"
					aria-label={t`Back`}
					onClick={onBack}
				>
					<CaretLeftIcon className="size-4" />
				</ButtonIcon>
				<div className="min-w-0 flex-1">
					<TokenSelector selectedMarket={market} onValueChange={(marketName) => setSelectedMarket(scope, marketName)} />
				</div>
				<div className="shrink-0 text-right">
					<div className="text-sm font-semibold tabular-nums leading-tight">
						{formatPrice(market?.markPx, { decimals: market?.priceDecimals })}
					</div>
					<div
						className={cn(
							"text-2xs font-medium tabular-nums leading-tight",
							change24h === null ? "text-fg-muted" : getValueColorClass(change24h),
						)}
					>
						{change24h === null
							? FALLBACK_VALUE_PLACEHOLDER
							: formatPercent(change24h / 100, { signDisplay: "exceptZero" })}
					</div>
				</div>
				<ButtonIcon
					variant="ghost"
					intent="neutral"
					size="md"
					className="touch-target"
					aria-label={isFavorite ? t`Remove from favorites` : t`Add to favorites`}
					aria-pressed={isFavorite}
					disabled={!market}
					onClick={() => market && toggleFavoriteMarket(market.name)}
				>
					<StarIcon weight={isFavorite ? "fill" : "regular"} className={cn("size-4", isFavorite && "text-warning")} />
				</ButtonIcon>
			</div>
		</header>
	);
}
