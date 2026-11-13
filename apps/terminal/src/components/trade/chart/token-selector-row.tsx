import { Badge } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { FireIcon, StarIcon } from "@phosphor-icons/react";
import { get24hChange, getOiUsd, isTokenInCategory } from "@/domain/market";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatUSD } from "@/lib/format";
import { getValueColorClass } from "@/lib/ui/value-color";
import { AssetDisplay } from "../components/asset-display";
import { getMarketTableColumnClass, type MarketRow, type MarketScope } from "./token-selector-columns";

interface Props {
	market: MarketRow;
	mobile: boolean;
	scope: MarketScope;
	isSelected: boolean;
	isHighlighted: boolean;
	isFavorite: boolean;
	top: number;
	height: number;
	onSelect: (name: string) => void;
	onToggleFavorite: (name: string) => void;
}

function getMaxLeverage(market: MarketRow): number | null {
	if (market.kind === "spot") return null;
	return market.maxLeverage;
}

function getDex(market: MarketRow): string | undefined {
	if (market.kind === "builderPerp") return market.dex.name;
	return undefined;
}

export function TokenSelectorRow({
	market,
	mobile,
	scope,
	isSelected,
	isHighlighted,
	isFavorite: isFav,
	top,
	height,
	onSelect,
	onToggleFavorite,
}: Props) {
	const changePercent = get24hChange(market.prevDayPx, market.markPx);
	const changeClass = cn(
		"font-medium tabular-nums text-xs",
		changePercent === null ? "text-fg-muted" : getValueColorClass(changePercent),
	);
	const changeText = formatPercent(changePercent !== null ? changePercent / 100 : null);

	const isSpot = market.kind === "spot";
	const isHip3 = market.kind === "builderPerp";

	const oiValue = getOiUsd(market.openInterest, market.markPx);

	return (
		<div
			data-index={market.name}
			onClick={() => onSelect(market.name)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") onSelect(market.name);
			}}
			role="option"
			aria-selected={isSelected}
			tabIndex={-1}
			className={cn(
				"flex items-center px-2 cursor-pointer border-b border-stroke-weak",
				"hover:bg-fill-hover transition-colors",
				"absolute top-0 left-0 w-full",
				mobile ? "py-2.5" : "py-1.5",
				isSelected && !isHighlighted && "bg-surface",
				isHighlighted && "bg-fill-hover",
			)}
			style={{ height: `${height}px`, transform: `translateY(${top}px)` }}
		>
			<div className="flex-1 min-w-0 flex items-center gap-2">
				<AssetDisplay coin={market.name} hideName iconClassName={cn("shrink-0", mobile ? "size-6" : "size-5")} />
				<div className="min-w-0 flex-1">
					<div className="flex min-w-0 items-center gap-1">
						<span
							title={market.pairName}
							className={cn(
								"min-w-0 truncate font-semibold tracking-tight",
								mobile ? "text-xs" : "text-2xs leading-snug",
							)}
						>
							{market.pairName}
						</span>
						{isTokenInCategory(market.shortName, "new") && (
							<Badge tone="neutral" size="sm" className="shrink-0 px-1 py-0 text-xs">
								{t`NEW`}
							</Badge>
						)}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onToggleFavorite(market.name);
							}}
							className="shrink-0 rounded-4 p-0.5 hover:scale-110 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
							aria-label={isFav ? t`Remove ${market.pairName} from favorites` : t`Add ${market.pairName} to favorites`}
							aria-pressed={isFav}
						>
							<StarIcon
								weight={isFav ? "fill" : "regular"}
								className={cn(
									"transition-colors",
									mobile ? "size-3" : "size-2.5",
									isFav ? "text-yellow" : "text-fg-muted hover:text-yellow",
								)}
							/>
						</button>
					</div>
					<div className={cn("flex items-center gap-1.5 text-fg", mobile ? "text-xs" : "text-2xs")}>
						{getMaxLeverage(market) && <span>{getMaxLeverage(market)}x</span>}
						{isSpot && <span className="text-brand">Spot</span>}
						{isHip3 && <span className="text-warning">{getDex(market)}</span>}
					</div>
				</div>
			</div>
			<div className={cn("text-right", getMarketTableColumnClass("price", mobile))}>
				<span className="font-medium tabular-nums text-xs">
					{formatPrice(market.markPx, { szDecimals: market.szDecimals })}
				</span>
			</div>
			<div className={cn("text-right", getMarketTableColumnClass("24h-change", mobile))}>
				<span className={changeClass}>{changeText}</span>
			</div>
			{scope !== "spot" && (
				<div className={cn("text-right hidden sm:block", getMarketTableColumnClass("oi", mobile))}>
					<span className="text-xs font-medium tabular-nums">{formatUSD(oiValue)}</span>
				</div>
			)}
			<div className={cn("text-right hidden sm:block", getMarketTableColumnClass("volume", mobile))}>
				<span className="text-xs font-medium tabular-nums">{formatUSD(market.dayNtlVlm)}</span>
			</div>
			{scope !== "spot" && (
				<div className={cn("text-right hidden sm:block", getMarketTableColumnClass("funding", mobile))}>
					<div className="flex items-center justify-end gap-1">
						{market.funding && <FireIcon className={cn("size-2.5", getValueColorClass(market.funding))} />}
						<span
							className={cn(
								"text-xs tabular-nums font-medium",
								market.funding ? getValueColorClass(market.funding) : "text-fg-muted",
							)}
						>
							{formatPercent(market.funding, { minimumFractionDigits: 4, signDisplay: "exceptZero" })}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
