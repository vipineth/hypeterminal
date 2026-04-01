import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import type { Size } from "./types";
import { cn } from "./utils";

type CardSize = Size;

const CardSizeContext = React.createContext<CardSize | undefined>(undefined);

const cardVariants = cva(["flex overflow-hidden rounded-12"], {
	variants: {
		variant: {
			elevated: "bg-bg-raised shadow-raised",
			outlined: "bg-bg-raised border border-stroke-weak",
			filled: "bg-fill-weaker",
		},
		orientation: {
			vertical: "flex-col",
			horizontal: "flex-row",
		},
	},
	defaultVariants: {
		variant: "elevated",
		orientation: "vertical",
	},
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
	size?: CardSize;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, orientation, size, ...props }, ref) => (
	<CardSizeContext.Provider value={size}>
		<div className={cn(cardVariants({ variant, orientation, className }))} ref={ref} {...props} />
	</CardSizeContext.Provider>
));
Card.displayName = "Card";

const headerPadding: Record<CardSize, string> = {
	xxs: "px-2 pt-2",
	xs: "px-3 pt-3",
	sm: "px-4 pt-4",
	md: "px-5 pt-5",
	lg: "px-6 pt-6",
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => {
	const size = React.useContext(CardSizeContext);
	return <div className={cn("flex flex-col gap-1", headerPadding[size ?? "lg"], className)} ref={ref} {...props} />;
});
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
	<h3 className={cn("text-base font-semibold text-text-strong text-balance", className)} ref={ref} {...props} />
));
CardTitle.displayName = "CardTitle";

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({ className, ...props }, ref) => (
	<p className={cn("text-sm text-text-weak text-pretty", className)} ref={ref} {...props} />
));
CardDescription.displayName = "CardDescription";

const contentPadding: Record<CardSize, string> = {
	xxs: "p-2",
	xs: "p-3",
	sm: "p-4",
	md: "p-5",
	lg: "p-6",
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => {
	const size = React.useContext(CardSizeContext);
	return <div className={cn(contentPadding[size ?? "lg"], className)} ref={ref} {...props} />;
});
CardContent.displayName = "CardContent";

const footerPadding: Record<CardSize, string> = {
	xxs: "px-2 pb-2 gap-2",
	xs: "px-3 pb-3 gap-2",
	sm: "px-4 pb-4 gap-2",
	md: "px-5 pb-5 gap-3",
	lg: "px-6 pb-6 gap-3",
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => {
	const size = React.useContext(CardSizeContext);
	return <div className={cn("flex items-center", footerPadding[size ?? "lg"], className)} ref={ref} {...props} />;
});
CardFooter.displayName = "CardFooter";

interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(({ className, ...props }, ref) => (
	<div className={cn("overflow-hidden", className)} ref={ref} {...props} />
));
CardMedia.displayName = "CardMedia";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardMedia, cardVariants };
export type {
	CardProps,
	CardHeaderProps,
	CardTitleProps,
	CardDescriptionProps,
	CardContentProps,
	CardFooterProps,
	CardMediaProps,
};
