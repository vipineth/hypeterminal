import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const tableVariants = cva(["w-full caption-bottom border-collapse"], {
	variants: {
		variant: {
			default: "",
			striped: "[&_tbody>tr:nth-child(odd)]:bg-fill-weaker",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const tableHeadVariants = cva([
	"h-12 px-6 text-left align-middle text-xs font-semibold text-text-weak whitespace-nowrap",
]);

const tableCellVariants = cva(["h-20 px-6 align-middle text-sm text-text-weak"]);

interface TableProps extends React.HTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, variant, ...props }, ref) => (
	<div className="w-full overflow-x-auto">
		<table className={cn(tableVariants({ variant, className }))} ref={ref} {...props} />
	</div>
));
Table.displayName = "Table";

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ className, ...props }, ref) => (
	<thead className={cn("[&_tr]:border-y [&_tr]:border-stroke-weak", className)} ref={ref} {...props} />
));
TableHeader.displayName = "TableHeader";

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(({ className, ...props }, ref) => (
	<tbody className={cn("[&_tr]:border-b [&_tr]:border-stroke-weak", className)} ref={ref} {...props} />
));
TableBody.displayName = "TableBody";

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(({ className, ...props }, ref) => (
	<tfoot className={cn("border-t border-stroke-weak font-semibold text-text-strong", className)} ref={ref} {...props} />
));
TableFooter.displayName = "TableFooter";

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, ...props }, ref) => (
	<tr className={cn(className)} ref={ref} {...props} />
));
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, ...props }, ref) => (
	<th className={cn(tableHeadVariants({ className }))} ref={ref} {...props} />
));
TableHead.displayName = "TableHead";

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, ...props }, ref) => (
	<td className={cn(tableCellVariants({ className }))} ref={ref} {...props} />
));
TableCell.displayName = "TableCell";

interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(({ className, ...props }, ref) => (
	<caption className={cn("mt-4 text-xs text-text-weak", className)} ref={ref} {...props} />
));
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableRow,
	TableHead,
	TableCell,
	TableCaption,
	tableVariants,
	tableHeadVariants,
	tableCellVariants,
};
export type {
	TableProps,
	TableHeaderProps,
	TableBodyProps,
	TableFooterProps,
	TableRowProps,
	TableHeadProps,
	TableCellProps,
	TableCaptionProps,
};
