import { flexRender, type Header, type RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { UseVirtualTableReturn } from "@/hooks/use-virtual-table";
import { cn } from "@/lib/utils";

export interface VirtualTableProps<TData extends RowData> extends UseVirtualTableReturn<TData> {
	className?: string;
	containerClassName?: string;
	/**
	 * Height of the scrollable container.
	 * @default "h-96"
	 */
	height?: string;
	/**
	 * Show sorting indicators on headers.
	 * @default true
	 */
	showSortingIndicators?: boolean;
}

function SortingIndicator<TData extends RowData>({ header }: { header: Header<TData, unknown> }) {
	if (!header.column.getCanSort()) {
		return null;
	}

	const sorted = header.column.getIsSorted();

	if (sorted === "asc") {
		return <ArrowUp className="ml-1 size-3" />;
	}

	if (sorted === "desc") {
		return <ArrowDown className="ml-1 size-3" />;
	}

	return <ArrowUpDown className="ml-1 size-3 opacity-50" />;
}

/**
 * Virtualized table component that renders data efficiently using
 * TanStack Table and TanStack Virtual.
 *
 * @example
 * ```tsx
 * const tableInstance = useVirtualTable({ data, columns });
 *
 * return <VirtualTable {...tableInstance} height="h-72" />;
 * ```
 */
export function VirtualTable<TData extends RowData>({
	table,
	virtualizer,
	containerRef,
	totalSize,
	className,
	containerClassName,
	height = "h-96",
	showSortingIndicators = true,
}: VirtualTableProps<TData>) {
	const virtualItems = virtualizer.getVirtualItems();
	const headerGroups = table.getHeaderGroups();

	return (
		<div className={cn("relative overflow-hidden", className)}>
			{/* Sticky Header */}
			<div className="sticky top-0 z-10 bg-surface border-b border-border/40">
				{headerGroups.map((headerGroup) => (
					<div key={headerGroup.id} className="flex w-full">
						{headerGroup.headers.map((header) => {
							const canSort = header.column.getCanSort();
							const headerContent = flexRender(header.column.columnDef.header, header.getContext());

							const headerClassName = cn(
								"flex items-center px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider",
								canSort && "cursor-pointer select-none hover:text-foreground transition-colors",
							);

							const headerStyle = { width: header.getSize() };

							if (canSort) {
								return (
									<button
										key={header.id}
										type="button"
										className={headerClassName}
										style={headerStyle}
										onClick={header.column.getToggleSortingHandler()}
										aria-label={`Sort by ${header.column.columnDef.header?.toString()}`}
									>
										{headerContent}
										{showSortingIndicators && <SortingIndicator header={header} />}
									</button>
								);
							}

							return (
								<div key={header.id} className={headerClassName} style={headerStyle}>
									{headerContent}
								</div>
							);
						})}
					</div>
				))}
			</div>

			{/* Virtualized Body */}
			<div ref={containerRef} className={cn("overflow-auto", containerClassName, height)}>
				<div
					style={{
						height: `${totalSize}px`,
						width: "100%",
						position: "relative",
					}}
				>
					{virtualItems.map((virtualItem) => {
						const row = table.getRowModel().rows[virtualItem.index];
						if (!row) return null;

						return (
							<div
								key={row.id}
								data-index={virtualItem.index}
								className="absolute top-0 left-0 w-full flex items-center border-b border-border/20 hover:bg-accent/30 transition-colors"
								style={{
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`,
								}}
							>
								{row.getVisibleCells().map((cell) => (
									<div key={cell.id} className="px-3 py-2 text-sm" style={{ width: cell.column.getSize() }}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</div>
								))}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
