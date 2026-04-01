import { CaretRightIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const BreadcrumbsContext = React.createContext<"xxs" | "xs" | "sm" | "md" | "lg">("sm");

const breadcrumbsVariants = cva(["flex flex-wrap items-center"], {
	variants: {
		size: {
			xxs: "gap-0.5 text-2xs",
			xs: "gap-0.5 text-xs",
			sm: "gap-1 text-xs",
			md: "gap-1.5 text-sm",
			lg: "gap-2 text-base",
		},
	},
	defaultVariants: {
		size: "sm",
	},
});

const separatorSizes: Record<string, number> = {
	xxs: 12,
	xs: 12,
	sm: 14,
	md: 16,
	lg: 20,
};

interface BreadcrumbsProps extends React.ComponentPropsWithoutRef<"nav">, VariantProps<typeof breadcrumbsVariants> {
	separator?: React.ReactNode;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
	({ className, size: sizeProp, separator, children, ...props }, ref) => {
		const size = (sizeProp ?? DEFAULT_SIZE) as "xxs" | "xs" | "sm" | "md" | "lg";
		const items = React.Children.toArray(children);
		const iconSize = separatorSizes[size];
		const sep = separator ?? <CaretRightIcon size={iconSize} weight="bold" />;

		return (
			<BreadcrumbsContext.Provider value={size}>
				<nav aria-label="Breadcrumb" ref={ref} {...props}>
					<ol className={cn(breadcrumbsVariants({ size, className }))}>
						{items.map((child, i) => (
							<React.Fragment key={i}>
								{child}
								{i < items.length - 1 && (
									<li role="presentation" aria-hidden="true" className="flex items-center text-icon-neutral">
										{sep}
									</li>
								)}
							</React.Fragment>
						))}
					</ol>
				</nav>
			</BreadcrumbsContext.Provider>
		);
	},
);
Breadcrumbs.displayName = "Breadcrumbs";

interface BreadcrumbItemProps extends React.ComponentPropsWithoutRef<"li"> {
	href?: string;
	current?: boolean;
}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
	({ className, href, current, children, ...props }, ref) => {
		const size = React.useContext(BreadcrumbsContext);
		const gapClass = size === "sm" ? "gap-1" : size === "lg" ? "gap-2" : "gap-1.5";

		return (
			<li
				ref={ref}
				className={cn("inline-flex items-center", className)}
				{...(current ? { "aria-current": "page" as const } : {})}
				{...props}
			>
				{href && !current ? (
					<a
						href={href}
						className={cn(
							"inline-flex items-center rounded-4 text-text-weak",
							gapClass,
							"transition-colors duration-150",
							"hover:text-text-strong",
							"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
						)}
					>
						{children}
					</a>
				) : (
					<span
						className={cn(
							"inline-flex items-center",
							gapClass,
							current ? "text-text-strong font-semibold" : "text-text-weak",
						)}
					>
						{children}
					</span>
				)}
			</li>
		);
	},
);
BreadcrumbItem.displayName = "BreadcrumbItem";

export { Breadcrumbs, BreadcrumbItem, breadcrumbsVariants };
export type { BreadcrumbsProps, BreadcrumbItemProps };
