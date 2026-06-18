import { Badge } from "@hypeterminal/ui";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { AssetDisplay } from "../components/asset-display";

export const MARKET_SELECTOR_TRIGGER_CLASSNAME =
	"inline-flex items-center gap-1 max-w-full min-w-0 px-1.5 py-1.5 rounded-8 border border-stroke-weak/50 bg-surface/80 hover:bg-fill-hover transition-colors cursor-pointer leading-none";

function getMarketKindBadgeLabel(market: UnifiedMarketInfo | undefined): string {
	if (!market) return "";
	if (market.kind === "spot") return "Spot";
	if (market.kind === "builderPerp") return market.dex;
	return "Perp";
}

interface Props {
	selectedMarket: UnifiedMarketInfo | undefined;
}

export function TokenSelectorTriggerContent({ selectedMarket }: Props) {
	const kindBadge = getMarketKindBadgeLabel(selectedMarket);

	return (
		<>
			{selectedMarket && (
				<>
					<AssetDisplay coin={selectedMarket.name} iconUrl={selectedMarket.iconUrl} hideName iconClassName="size-3.5" />
					<span className="min-w-0 truncate text-xs font-medium text-fg tracking-tight leading-none">
						{selectedMarket.pairName ?? selectedMarket.name}
					</span>
					{kindBadge ? (
						<Badge
							tone="neutral"
							size="xxs"
							className="uppercase shrink-0 self-center font-normal leading-none text-fg-muted border-stroke-weak/40 bg-fill-weaker"
						>
							{kindBadge}
						</Badge>
					) : null}
				</>
			)}
			<CaretDownIcon className="size-3.5 shrink-0 self-center text-fg-muted" />
		</>
	);
}
