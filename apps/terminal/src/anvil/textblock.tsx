import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const textBlockVariants = cva("flex flex-col gap-4", {
	variants: {
		align: {
			left: "items-start",
			center: "items-center text-center",
		},
	},
	defaultVariants: {
		align: "left",
	},
});

interface TextBlockProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof textBlockVariants> {
	icon?: React.ReactNode;
	heading?: React.ReactNode;
	description?: React.ReactNode;
	linkLabel?: React.ReactNode;
	linkHref?: string;
	onLinkClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

const TextBlock = React.forwardRef<HTMLDivElement, TextBlockProps>(
	({ className, align, icon, heading, description, linkLabel, linkHref, onLinkClick, ...props }, ref) => {
		return (
			<div className={cn(textBlockVariants({ align, className }))} ref={ref} {...props}>
				{icon && (
					<div className="flex items-start p-3 rounded-full bg-fill-brand-weak border border-stroke-brand-weak text-icon-brand">
						{icon}
					</div>
				)}
				{(heading || description) && (
					<div className="flex flex-col gap-2 w-full">
						{heading && <p className="text-lg font-semibold text-text-strong text-balance">{heading}</p>}
						{description && <p className="text-sm font-normal text-text-weak text-pretty">{description}</p>}
					</div>
				)}
				{linkLabel && (
					<a
						href={linkHref}
						onClick={onLinkClick}
						className="text-sm font-semibold text-text-brand underline rounded-4 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
					>
						{linkLabel}
					</a>
				)}
			</div>
		);
	},
);
TextBlock.displayName = "TextBlock";

export { TextBlock, textBlockVariants };
export type { TextBlockProps };
