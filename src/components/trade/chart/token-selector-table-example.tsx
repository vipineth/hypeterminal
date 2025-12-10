import type { ColumnDef } from "@tanstack/react-table";
import { Flame, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VirtualTable } from "@/components/ui/virtual-table";
import { getTokenIconUrl, isTokenInCategory } from "@/config/token";
import type { useMarkets } from "@/hooks/hyperliquid";
import { useVirtualTable } from "@/hooks/use-virtual-table";
import { formatPercent, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFavorites, useFavoritesActions } from "@/stores/use-favorites-store";

// Type helper to extract the market type from useMarkets return
type Market = NonNullable<ReturnType<typeof useMarkets>["data"]>[number];

/**
 * Example showing how to use useVirtualTable with the token selector.
 * This demonstrates column definitions, custom cell rendering, and integration
 * with existing features like favorites.
 */

export function TokenSelectorTableExample({ markets }: { markets: Market[] }) {
	const favorites = useFavorites();
	const { toggleFavorite } = useFavoritesActions();

	// Define columns with custom cell rendering
	const columns: ColumnDef<Market>[] = [
		{
			accessorKey: "coin",
			header: "Market",
			size: 200,
			cell: ({ row }) => {
				const market = row.original;
				const isFavorite = favorites.includes(market.coin);

				return (
					<div className="flex items-center gap-2">
						<Avatar className="size-5 shrink-0">
							<AvatarImage src={getTokenIconUrl(market.coin)} alt={market.coin} />
							<AvatarFallback className="text-4xs bg-muted">{market.coin.slice(0, 2)}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<div className="flex items-center gap-1">
								<span className="font-semibold text-2xs">{market.coin}</span>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										toggleFavorite(market.coin);
									}}
									className="hover:scale-110 transition-transform"
									aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
								>
									<Star
										className={cn(
											"size-2.5 transition-colors",
											isFavorite
												? "fill-terminal-amber text-terminal-amber"
												: "text-muted-foreground hover:text-terminal-amber",
										)}
									/>
								</button>
								{isTokenInCategory(market.coin, "new", favorites) && (
									<Badge variant="neutral" size="xs" className="px-1 py-0 text-4xs">
										NEW
									</Badge>
								)}
							</div>
							<div className="text-4xs text-muted-foreground">{market.maxLeverage}x</div>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "markPrice",
			header: "Price",
			size: 100,
			cell: ({ getValue }) => {
				const price = getValue<string>();
				return <span className="text-2xs font-medium tabular-nums">{price ? formatUSD(Number(price)) : "-"}</span>;
			},
		},
		{
			accessorKey: "openInterest",
			header: "OI",
			size: 100,
			cell: ({ getValue }) => {
				const oi = getValue<string>();
				return <span className="text-2xs font-medium tabular-nums">{oi ? formatUSD(Number(oi)) : "-"}</span>;
			},
		},
		{
			accessorKey: "volume24h",
			header: "Volume",
			size: 100,
			cell: ({ getValue }) => {
				const volume = getValue<string>();
				return <span className="text-2xs font-medium tabular-nums">{volume ? formatUSD(Number(volume)) : "-"}</span>;
			},
		},
		{
			accessorKey: "fundingRate",
			header: "Funding",
			size: 100,
			cell: ({ getValue }) => {
				const fundingRate = getValue<string>();
				const fundingNum = fundingRate ? Number.parseFloat(fundingRate) : 0;
				const isFundingPositive = fundingNum >= 0;

				return (
					<div className="flex items-center gap-1">
						<Flame className={cn("size-2.5", isFundingPositive ? "text-terminal-green" : "text-terminal-red")} />
						<span
							className={cn(
								"text-2xs tabular-nums font-medium",
								isFundingPositive ? "text-terminal-green" : "text-terminal-red",
							)}
						>
							{fundingNum
								? formatPercent(fundingNum, {
										minimumFractionDigits: 4,
										signDisplay: "exceptZero",
									})
								: "-"}
						</span>
					</div>
				);
			},
		},
	];

	// Use the virtual table hook
	const tableInstance = useVirtualTable({
		data: markets,
		columns,
		estimateRowSize: 48, // Row height in pixels
		overscan: 5, // Render 5 extra rows for smooth scrolling
		enableSorting: true,
	});

	return (
		<div className="w-full">
			<VirtualTable
				{...tableInstance}
				height="h-72" // Match existing ScrollArea height
				className="border border-border/60 rounded-md"
			/>
			<div className="px-3 py-1.5 border-t border-border/40 bg-surface/30 flex items-center justify-between text-4xs text-muted-foreground">
				<span>{markets.length} markets</span>
				<span className="tabular-nums">Updated live</span>
			</div>
		</div>
	);
}
