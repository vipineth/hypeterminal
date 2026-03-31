import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

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

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, orientation, ...props }, ref) => (
	<div className={cn(cardVariants({ variant, orientation, className }))} ref={ref} {...props} />
));
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
	<div className={cn("flex flex-col gap-1 px-6 pt-6", className)} ref={ref} {...props} />
));
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

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
	<div className={cn("p-6", className)} ref={ref} {...props} />
));
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => (
	<div className={cn("flex items-center gap-3 px-6 pb-6", className)} ref={ref} {...props} />
));
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
