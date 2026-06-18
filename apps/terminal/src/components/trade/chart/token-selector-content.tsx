import { Button, SearchInput, TableHead, TableHeader, TableRow, tableVariants } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowDownIcon, ArrowsDownUpIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/cn";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import { useRenderCommitTrack } from "@/lib/performance/render-profile";
import { getMarketTableColumnClass, type MarketScope } from "./token-selector-columns";
import { TokenSelectorRow } from "./token-selector-row";
import type { useTokenSelector } from "./use-token-selector";

function getColumnSortLabel(columnId: string): string {
	switch (columnId) {
		case "price":
			return t`Price`;
		case "24h-change":
			return t`24h Change`;
		case "oi":
			return t`Open Interest`;
		case "volume":
			return t`Volume`;
		case "funding":
			return t`Funding`;
		default:
			return columnId;
	}
}

function SortIcon({ columnId, sorting }: { columnId: string; sorting: { id: string; desc: boolean }[] }) {
	const sort = sorting.find((s) => s.id === columnId);
	if (sort?.desc === false) return <ArrowUpIcon className="size-3" />;
	if (sort?.desc === true) return <ArrowDownIcon className="size-3" />;
	return <ArrowsDownUpIcon className="size-3 opacity-50" />;
}

interface Props {
	selectedMarket: UnifiedMarketInfo | undefined;
	scope: MarketScope;
	exchangeScope: string;
	exchangeDex: string | undefined;
	subcategory: string;
	subcategories: { value: string; label: string }[];
	search: string;
	setSearch: (value: string) => void;
	isLoading: boolean;
	isFavorite: (name: string) => boolean;
	sorting: { id: string; desc: boolean }[];
	handleSort: (columnId: string) => void;
	handleSelect: (name: string) => void;
	handleSubcategorySelect: (value: string) => void;
	handleScopeSelect: (value: MarketScope) => void;
	toggleFavorite: (name: string) => void;
	table: ReturnType<typeof useTokenSelector>["table"];
	rows: ReturnType<typeof useTokenSelector>["rows"];
	virtualItems: ReturnType<typeof useTokenSelector>["virtualItems"];
	totalSize: number;
	containerRef: React.RefCallback<HTMLDivElement>;
	filteredMarkets: ReturnType<typeof useTokenSelector>["filteredMarkets"];
	highlightedIndex: number;
	headingId: string;
	mobile?: boolean;
}

export function TokenSelectorContent({
	selectedMarket,
	scope,
	exchangeScope,
	exchangeDex,
	subcategory,
	subcategories,
	search,
	setSearch,
	isLoading,
	isFavorite,
	sorting,
	handleSort,
	handleSelect,
	handleSubcategorySelect,
	handleScopeSelect,
	toggleFavorite,
	table,
	rows,
	virtualItems,
	totalSize,
	containerRef,
	filteredMarkets,
	highlightedIndex,
	headingId,
	mobile,
}: Props) {
	useRenderCommitTrack("token-search");
	const headerGroup = table.getHeaderGroups()[0];
	const marketScopes: { value: MarketScope; label: string }[] = [
		{ value: "all", label: t`All` },
		{ value: "perp", label: t`Perp` },
		{ value: "spot", label: t`Spot` },
		{ value: "hip3", label: t`HIP-3` },
	];
	const showScopeTabs = exchangeScope === "all";
	const showSubcategoryTabs = !exchangeDex && subcategories.length > 0;
	const showSelectorFilters = showScopeTabs || showSubcategoryTabs;

	return (
		<div className={cn("flex flex-col", mobile ? "h-full" : "max-h-144")}>
			<div className="border-b border-stroke-weak shrink-0 px-2 pt-3 pb-2 space-y-2">
				<h2 id={headingId} className="text-sm font-semibold text-fg tracking-tight">
					{t`Select market`}
				</h2>
				<SearchInput
					placeholder={t`Search markets...`}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					onClear={() => setSearch("")}
					size={mobile ? "md" : "sm"}
					aria-labelledby={headingId}
				/>
			</div>

			{showSelectorFilters ? (
				<div className="p-2 border-b border-stroke-weak bg-background shrink-0">
					{showScopeTabs ? (
						<div className="flex items-center gap-0.5 flex-wrap">
							{marketScopes.map((s) => {
								const isSelected = scope === s.value;
								return (
									<Button
										key={s.value}
										variant="link"
										intent="neutral"
										onClick={() => handleScopeSelect(s.value)}
										className={cn(
											"px-2 py-1 uppercase tracking-wider cursor-pointer no-underline text-xs",
											isSelected
												? "bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand"
												: "text-fg hover:bg-transparent",
										)}
									>
										{s.label}
									</Button>
								);
							})}
						</div>
					) : null}
					{showSubcategoryTabs ? (
						<div className="flex items-center gap-0.5 flex-wrap mt-1.5 pt-1.5 pl-2 ml-1">
							{subcategories.map((sub) => {
								const isSelected = subcategory === sub.value;
								return (
									<Button
										key={sub.value}
										variant="link"
										intent="neutral"
										onClick={() => handleSubcategorySelect(sub.value)}
										className={cn(
											"px-2 py-0.5 tracking-wider cursor-pointer no-underline text-xs",
											isSelected
												? "bg-brand/10 text-brand hover:bg-brand/10 hover:text-brand"
												: "text-fg hover:bg-transparent hover:text-fg",
										)}
										aria-label={t`Filter by ${sub.label}`}
										aria-pressed={isSelected}
									>
										{sub.label}
									</Button>
								);
							})}
						</div>
					) : null}
				</div>
			) : null}
			<div className="shrink-0 border-b border-stroke-weak bg-background px-0">
				<table className={cn(tableVariants(), "table-fixed w-full border-0")}>
					<TableHeader className="[&_tr]:border-t-0 [&_tr]:border-b [&_tr]:border-stroke-weak">
						<TableRow className="border-0 hover:bg-transparent">
							<TableHead
								scope="col"
								className="h-9 px-2 py-2 text-left align-middle text-3xs font-semibold uppercase tracking-widest text-fg-muted"
							>
								{t`Market`}
							</TableHead>
							{headerGroup?.headers
								.filter((h) => h.id !== "pairName")
								.map((header) => {
									const hiddenOnMobile = ["oi", "volume", "funding"].includes(header.id);
									const hideForSpot = scope === "spot" && ["oi", "funding"].includes(header.id);

									if (hideForSpot) return null;

									const sortLabel = getColumnSortLabel(header.id);
									return (
										<TableHead
											key={header.id}
											scope="col"
											className={cn(
												"h-9 px-2 py-2 text-right align-middle text-3xs font-semibold uppercase tracking-widest text-fg-muted",
												getMarketTableColumnClass(header.id, mobile ?? false),
												hiddenOnMobile && (mobile ? "hidden" : "hidden sm:table-cell"),
											)}
										>
											<button
												type="button"
												onClick={() => handleSort(header.id)}
												title={sortLabel}
												className={cn(
													"inline-flex w-full min-w-0 cursor-pointer items-center justify-end gap-1 rounded-4 px-0.5 py-0.5 text-inherit transition-colors",
													"hover:bg-fill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
												)}
												aria-label={t`Sort by ${sortLabel}`}
											>
												<span className="min-w-0 whitespace-normal text-right leading-tight text-balance">
													{flexRender(header.column.columnDef.header, header.getContext())}
												</span>
												<span className="inline-flex shrink-0 text-fg-muted">
													<SortIcon columnId={header.id} sorting={sorting} />
												</span>
											</button>
										</TableHead>
									);
								})}
						</TableRow>
					</TableHeader>
				</table>
			</div>

			<div ref={containerRef} className="flex-1 min-h-0 overflow-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<span className="text-fg text-xs">{t`Loading markets...`}</span>
					</div>
				) : rows.length === 0 ? (
					<div className="py-8 text-center text-fg text-xs">{t`No markets found.`}</div>
				) : (
					<div
						role="listbox"
						aria-label={t`Markets`}
						style={{
							height: `${totalSize}px`,
							width: "100%",
							position: "relative",
						}}
					>
						{virtualItems.map((virtualItem) => {
							const row = rows[virtualItem.index];
							const market = row.original;
							return (
								<TokenSelectorRow
									key={row.id}
									market={market}
									mobile={mobile ?? false}
									scope={scope}
									isSelected={selectedMarket?.name === market.name}
									isHighlighted={highlightedIndex >= 0 && virtualItem.index === highlightedIndex}
									isFavorite={isFavorite(market.name)}
									top={virtualItem.start}
									height={virtualItem.size}
									onSelect={handleSelect}
									onToggleFavorite={toggleFavorite}
								/>
							);
						})}
					</div>
				)}
			</div>

			<div className="px-2 py-1.5 bg-fill-weak flex items-center justify-between text-fg shrink-0 text-xs">
				<span>
					{filteredMarkets.length} {t`markets`}
				</span>
				<span className="tabular-nums text-right min-w-0">
					{sorting.length > 0 ? t`Sorted by ${getColumnSortLabel(sorting[0].id)}` : t`Updated live`}
				</span>
			</div>
		</div>
	);
}
