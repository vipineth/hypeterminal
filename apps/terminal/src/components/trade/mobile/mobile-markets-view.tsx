import { useId } from "react";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { TokenSelectorContent } from "../chart/token-selector-content";
import { useTokenSelector } from "../chart/use-token-selector";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

export function MobileMarketsView() {
	const headingId = useId();
	const { data: selectedMarket } = useSelectedMarketInfo();
	const { scope: exchangeScope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const { setMobileMarketOpen } = useGlobalSettingsActions();

	function handleMarketSelect(marketName: string) {
		setSelectedMarket(exchangeScope, marketName);
		setMobileMarketOpen(true);
	}

	const selector = useTokenSelector({
		value: selectedMarket?.name ?? "",
		onValueChange: handleMarketSelect,
		open: true,
		onOpenChange: noop,
	});

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="flex-1 min-h-0">
				<TokenSelectorContent
					selectedMarket={selectedMarket}
					scope={selector.scope}
					exchangeScope={selector.exchangeScope}
					exchangeDex={selector.exchangeDex}
					subcategory={selector.subcategory}
					subcategories={selector.subcategories}
					search={selector.search}
					setSearch={selector.setSearch}
					isLoading={selector.isLoading}
					isFavorite={selector.isFavorite}
					sorting={selector.sorting}
					handleSort={selector.handleSort}
					handleSelect={selector.handleSelect}
					handleSubcategorySelect={selector.handleSubcategorySelect}
					handleScopeSelect={selector.handleScopeSelect}
					toggleFavorite={selector.toggleFavorite}
					table={selector.table}
					rows={selector.rows}
					virtualItems={selector.virtualItems}
					totalSize={selector.totalSize}
					containerRef={selector.containerRef}
					filteredMarkets={selector.filteredMarkets}
					highlightedIndex={selector.highlightedIndex}
					headingId={headingId}
					mobile
				/>
			</div>
			<MobileBottomNavSpacer />
		</div>
	);
}

function noop() {}
