import {
	type ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	type Row,
	type RowData,
	type SortingState,
	type Table,
	type TableOptions,
	useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer, type VirtualItem, type Virtualizer } from "@tanstack/react-virtual";
import { type Dispatch, type RefObject, type SetStateAction, useRef, useState } from "react";

export interface UseVirtualTableOptions<TData extends RowData> {
	data: TData[];
	columns: ColumnDef<TData, unknown>[];
	estimateRowSize?: number;
	overscan?: number;
	enableSorting?: boolean;
	tableOptions?: Partial<Omit<TableOptions<TData>, "data" | "columns" | "getCoreRowModel">>;
}

export interface VirtualRow<TData extends RowData> {
	row: Row<TData>;
	virtualItem: VirtualItem;
}

export interface UseVirtualTableReturn<TData extends RowData> {
	table: Table<TData>;
	virtualizer: Virtualizer<HTMLDivElement, Element>;
	containerRef: RefObject<HTMLDivElement | null>;
	virtualRows: VirtualRow<TData>[];
	totalSize: number;
	sorting: SortingState;
	setSorting: Dispatch<SetStateAction<SortingState>>;
}

export function useVirtualTable<TData extends RowData>(
	options: UseVirtualTableOptions<TData>,
): UseVirtualTableReturn<TData> {
	const { data, columns, estimateRowSize = 42, overscan = 5, enableSorting = true, tableOptions = {} } = options;

	const containerRef = useRef<HTMLDivElement>(null);
	const [sorting, setSorting] = useState<SortingState>([]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
		state: { sorting },
		onSortingChange: setSorting,
		enableSorting,
		...tableOptions,
	});

	const rows = table.getRowModel().rows;

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => containerRef.current,
		estimateSize: () => estimateRowSize,
		overscan,
	});

	const virtualRows = virtualizer.getVirtualItems().map((virtualItem) => ({
		row: rows[virtualItem.index],
		virtualItem,
	}));

	return {
		table,
		virtualizer,
		containerRef,
		virtualRows,
		totalSize: virtualizer.getTotalSize(),
		sorting,
		setSorting,
	};
}
