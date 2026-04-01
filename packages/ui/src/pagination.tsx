import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const pageButtonSizes: Record<string, string> = {
	xxs: "size-5",
	xs: "size-6",
	sm: "size-8",
	md: "size-10",
	lg: "size-12",
};

const navButtonHeights: Record<string, string> = {
	xxs: "h-5",
	xs: "h-6",
	sm: "h-8",
	md: "h-10",
	lg: "h-12",
};

const arrowIconSizes: Record<string, number> = {
	xxs: 12,
	xs: 14,
	sm: 16,
	md: 20,
	lg: 20,
};

const pageButtonVariants = cva(
	[
		"inline-flex items-center justify-center rounded-8",
		"text-xs font-normal text-text-weak tabular-nums",
		"cursor-pointer select-none",
		"transition-colors duration-150",
		"hover:bg-fill-hover",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
	],
	{
		variants: {
			current: {
				true: "border border-stroke-strong",
				false: "",
			},
		},
		defaultVariants: {
			current: false,
		},
	},
);

const navButtonVariants = cva(
	[
		"inline-flex items-center",
		"cursor-pointer select-none",
		"transition-opacity duration-150",
		"rounded-4",
		"hover:opacity-80",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:opacity-40 data-disabled:cursor-not-allowed data-disabled:pointer-events-none",
	],
	{
		variants: {
			variant: {
				desktop: "gap-2 text-xs font-normal text-text-weak",
				mobile: "text-icon-neutral",
			},
		},
		defaultVariants: {
			variant: "desktop",
		},
	},
);

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
	if (total <= 5) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const pages: (number | "ellipsis")[] = [];
	const start = Math.max(1, current - 1);
	const end = Math.min(total, current + 1);

	if (start > 1) {
		pages.push(1);
		if (start > 2) pages.push("ellipsis");
	}

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}

	if (end < total) {
		if (end < total - 1) pages.push("ellipsis");
		pages.push(total);
	}

	return pages;
}

interface PaginationProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof navButtonVariants> {
	currentPage: number;
	totalPages: number;
	onPageChange?: (page: number) => void;
	totalItems?: number;
	itemsPerPage?: number;
	size?: "xxs" | "xs" | "sm" | "md" | "lg";
}

const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
	(
		{
			className,
			currentPage,
			totalPages,
			onPageChange,
			totalItems,
			itemsPerPage = 10,
			variant = "desktop",
			size: sizeProp,
			...props
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const handlePageChange = (page: number) => {
			if (page >= 1 && page <= totalPages && page !== currentPage) {
				onPageChange?.(page);
			}
		};

		const isFirstPage = currentPage <= 1;
		const isLastPage = currentPage >= totalPages;
		const iconSize = arrowIconSizes[size];
		const pageBtnSize = pageButtonSizes[size];
		const navBtnH = navButtonHeights[size];

		if (variant === "mobile") {
			return (
				<nav
					ref={ref}
					aria-label="Pagination"
					className={cn("flex items-center justify-center gap-4", className)}
					{...props}
				>
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={isFirstPage}
						data-disabled={isFirstPage ? "" : undefined}
						aria-label="Previous page"
						className={cn(navButtonVariants({ variant: "mobile" }), navBtnH)}
					>
						<ArrowLeft size={iconSize} className="shrink-0" />
					</button>
					<span className="flex-1 text-center text-xs font-normal text-text-weak tabular-nums min-w-0">
						{currentPage} of {totalPages}
					</span>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={isLastPage}
						data-disabled={isLastPage ? "" : undefined}
						aria-label="Next page"
						className={cn(navButtonVariants({ variant: "mobile" }), navBtnH)}
					>
						<ArrowRight size={iconSize} className="shrink-0" />
					</button>
				</nav>
			);
		}

		const pages = getVisiblePages(currentPage, totalPages);
		const showResultCount = totalItems !== undefined;
		const startItem = showResultCount ? (currentPage - 1) * itemsPerPage + 1 : 0;
		const endItem = showResultCount ? Math.min(currentPage * itemsPerPage, totalItems!) : 0;

		return (
			<nav ref={ref} aria-label="Pagination" className={cn("flex items-center justify-between", className)} {...props}>
				<div className="flex items-center gap-2">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={isFirstPage}
						data-disabled={isFirstPage ? "" : undefined}
						aria-label="Previous page"
						className={cn(navButtonVariants({ variant: "desktop" }), navBtnH, "pr-4")}
					>
						<ArrowLeft size={iconSize} className="shrink-0 text-icon-neutral" />
						Previous
					</button>

					{pages.map((page, index) =>
						page === "ellipsis" ? (
							<span
								key={`ellipsis-${index}`}
								className={cn(
									"inline-flex items-center justify-center text-xs font-normal text-text-weak select-none",
									pageBtnSize,
								)}
							>
								&hellip;
							</span>
						) : (
							<button
								key={page}
								onClick={() => handlePageChange(page)}
								aria-label={`Page ${page}`}
								aria-current={page === currentPage ? "page" : undefined}
								className={cn(pageButtonVariants({ current: page === currentPage }), pageBtnSize)}
							>
								{page}
							</button>
						),
					)}

					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={isLastPage}
						data-disabled={isLastPage ? "" : undefined}
						aria-label="Next page"
						className={cn(navButtonVariants({ variant: "desktop" }), navBtnH, "pl-4")}
					>
						Next
						<ArrowRight size={iconSize} className="shrink-0 text-icon-neutral" />
					</button>
				</div>

				{showResultCount && (
					<span className="text-xs font-normal text-text-weak tabular-nums">
						Showing {startItem} – {endItem} of {totalItems}
					</span>
				)}
			</nav>
		);
	},
);
Pagination.displayName = "Pagination";

export { Pagination, pageButtonVariants, navButtonVariants };
export type { PaginationProps };
