import { useEffect, useRef, useState } from "react";
import { CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { type UnifiedMarketInfo, useMarketsInfo } from "@/lib/hyperliquid";
import { createSearcher } from "@/lib/search";
import { marketSearchConfig } from "@/lib/search/presets";
import { useCommandMenuActions, useCommandMenuOpen } from "@/stores/use-global-modal-store";
import { useMarketActions } from "@/stores/use-market-store";
import { AssetDisplay } from "./asset-display";

const KIND_LABELS: Record<UnifiedMarketInfo["kind"], string> = {
	perp: "Perp",
	spot: "Spot",
	builderPerp: "Builder",
};

export function CommandMenu() {
	const open = useCommandMenuOpen();
	const { open: openMenu, close } = useCommandMenuActions();
	const { setSelectedMarket } = useMarketActions();
	const { markets } = useMarketsInfo();

	const [query, setQuery] = useState("");
	const searcherRef = useRef(createSearcher(markets, marketSearchConfig));

	useEffect(() => {
		searcherRef.current.setItems(markets);
	}, [markets]);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				if (open) {
					close();
				} else {
					openMenu();
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, close, openMenu]);

	const results = query ? searcherRef.current.search(query) : [];
	const displayItems = query ? results.map((r) => r.item) : markets;

	function handleSelect(market: UnifiedMarketInfo) {
		setSelectedMarket(market.name);
		close();
		setQuery("");
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			close();
			setQuery("");
		}
	}

	return (
		<CommandDialog
			open={!!open}
			onOpenChange={handleOpenChange}
			title="Search Markets"
			description="Search for a market to trade"
			showCloseButton={false}
			shouldFilter={false}
		>
			<CommandInput placeholder="Search markets..." value={query} onValueChange={setQuery} />
			<CommandList>
				<CommandEmpty>No markets found.</CommandEmpty>
				{displayItems.map((market) => (
					<CommandItem
						key={`${market.kind}-${market.name}`}
						value={`${market.kind}-${market.name}`}
						onSelect={() => handleSelect(market)}
						className="flex items-center justify-between"
					>
						<AssetDisplay asset={{ displayName: market.displayName, iconUrl: market.iconUrl }} iconClassName="size-5" />
						<div className="ml-auto flex items-center gap-2">
							<span className="text-text-600 text-2xs">
								{formatPrice(market.markPx, { szDecimals: market.szDecimals })}
							</span>
							<span
								className={cn(
									"rounded-xs px-1.5 py-0.5 text-3xs",
									market.kind === "perp" && "bg-primary-default/10 text-primary-default",
									market.kind === "spot" && "bg-success-100 text-success-700",
									market.kind === "builderPerp" && "bg-warning-100 text-warning-700",
								)}
							>
								{KIND_LABELS[market.kind]}
							</span>
						</div>
					</CommandItem>
				))}
			</CommandList>
		</CommandDialog>
	);
}
