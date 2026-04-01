import { Field } from "@base-ui/react/field";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const textareaVariants = cva(
	[
		"w-full rounded-8 border font-normal",
		"text-text-strong bg-bg-base placeholder:text-text-weak",
		"transition-colors outline-none resize-y",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"disabled:border-stroke-disabled disabled:text-text-disabled",
		"disabled:placeholder:text-text-disabled disabled:cursor-not-allowed",
		"disabled:bg-fill-disabled",
	],
	{
		variants: {
			size: {
				xxs: "px-1.5 py-0.5 text-2xs",
				xs: "px-1.5 py-1 text-xs",
				sm: "px-2 py-1.5 text-xs",
				md: "px-3 py-2 text-sm",
				lg: "px-4 py-3 text-sm",
			},
			error: {
				true: "border-stroke-error-strong bg-fill-error-weak",
				false: "border-stroke-strong",
			},
		},
		defaultVariants: {
			size: "sm",
			error: false,
		},
	},
);

interface TextareaProps
	extends Omit<React.ComponentPropsWithoutRef<"textarea">, "children">,
		Omit<VariantProps<typeof textareaVariants>, "size"> {
	label?: string;
	helperText?: string;
	errorMessage?: string;
	resize?: "none" | "vertical" | "horizontal" | "both";
	size?: "xxs" | "xs" | "sm" | "md" | "lg";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			className,
			size: sizeProp,
			label,
			helperText,
			error,
			errorMessage,
			required,
			disabled,
			resize = "vertical",
			rows = 3,
			...props
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const resizeClass =
			resize === "none"
				? "resize-none"
				: resize === "horizontal"
					? "resize-x"
					: resize === "both"
						? "resize"
						: "resize-y";

		return (
			<Field.Root disabled={disabled} invalid={error === true} className="flex flex-col gap-1">
				{label && (
					<Field.Label className="text-xs font-semibold text-text-strong">
						{label}
						{required && <span className="text-text-error"> *</span>}
					</Field.Label>
				)}
				{helperText && <Field.Description className="text-xs text-text-weak">{helperText}</Field.Description>}
				<textarea
					ref={ref}
					rows={rows}
					required={required}
					disabled={disabled}
					aria-invalid={error ? true : undefined}
					className={cn(textareaVariants({ size, error }), resizeClass, className)}
					{...props}
				/>
				{error && errorMessage && (
					<div className="flex items-center gap-1">
						<WarningCircleIcon size={16} weight="fill" className="shrink-0 text-icon-error" />
						<span className="text-xs text-text-error">{errorMessage}</span>
					</div>
				)}
			</Field.Root>
		);
	},
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
export type { TextareaProps };
