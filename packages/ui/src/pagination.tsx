import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
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
		"relative before:absolute before:-inset-2 before:content-['']",
		"text-xs font-normal text-fg-muted tabular-nums",
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
		"relative before:absolute before:-inset-y-2 before:inset-x-0 before:content-['']",
		"cursor-pointer select-none",
		"transition-opacity duration-150",
		"rounded-4",
		"hover:opacity-80",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:text-fg-disabled data-disabled:cursor-not-allowed data-disabled:pointer-events-none",
	],
	{
		variants: {
			variant: {
				desktop: "gap-2 text-xs font-normal text-fg-muted",
				mobile: "text-icon",
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

function getVisiblePageItems(current: number, total: number): { key: string; value: number | "ellipsis" }[] {
	const pages = getVisiblePages(current, total);
	const pageItems: { key: string; value: number | "ellipsis" }[] = [];

	for (let position = 0; position < pages.length; position++) {
		const page = pages[position];
		if (page === "ellipsis") {
			pageItems.push({ key: `ellipsis-${pages[position - 1]}-${pages[position + 1]}`, value: page });
		} else {
			pageItems.push({ key: `page-${page}`, value: page });
		}
	}

	return pageItems;
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
						<ArrowLeftIcon size={iconSize} className="shrink-0" />
					</button>
					<span className="flex-1 text-center text-xs font-normal text-fg-muted tabular-nums min-w-0">
						{currentPage} of {totalPages}
					</span>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={isLastPage}
						data-disabled={isLastPage ? "" : undefined}
						aria-label="Next page"
						className={cn(navButtonVariants({ variant: "mobile" }), navBtnH)}
					>
						<ArrowRightIcon size={iconSize} className="shrink-0" />
					</button>
				</nav>
			);
		}

		const pages = getVisiblePageItems(currentPage, totalPages);
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
						<ArrowLeftIcon size={iconSize} className="shrink-0 text-icon" />
						Previous
					</button>

					{pages.map((page) => {
						if (page.value === "ellipsis") {
							return (
								<span
									key={page.key}
									className={cn(
										"inline-flex items-center justify-center text-xs font-normal text-fg-muted select-none",
										pageBtnSize,
									)}
								>
									&hellip;
								</span>
							);
						}

						const pageNumber = page.value;
						return (
							<button
								key={page.key}
								onClick={() => handlePageChange(pageNumber)}
								aria-label={`Page ${pageNumber}`}
								aria-current={pageNumber === currentPage ? "page" : undefined}
								className={cn(pageButtonVariants({ current: pageNumber === currentPage }), pageBtnSize)}
							>
								{pageNumber}
							</button>
						);
					})}

					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={isLastPage}
						data-disabled={isLastPage ? "" : undefined}
						aria-label="Next page"
						className={cn(navButtonVariants({ variant: "desktop" }), navBtnH, "pl-4")}
					>
						Next
						<ArrowRightIcon size={iconSize} className="shrink-0 text-icon" />
					</button>
				</div>

				{showResultCount ? (
					<span className="text-xs font-normal text-fg-muted tabular-nums">
						Showing {startItem} – {endItem} of {totalItems}
					</span>
				) : null}
			</nav>
		);
	},
);
Pagination.displayName = "Pagination";

export { Pagination, pageButtonVariants, navButtonVariants };
export type { PaginationProps };
