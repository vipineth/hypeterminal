import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import { XCircleIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const textInputVariants = cva(
	["flex items-center w-full rounded-8", "bg-fill-inverse-strong transition-colors duration-150"],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5 gap-1",
				xs: "py-1 px-2 gap-1",
				sm: "py-1.5 px-3 gap-1.5",
				md: "py-2 px-4 gap-2",
				lg: "py-3 px-4 gap-2",
			},
			invalid: {
				true: "border-2 border-stroke-error-strong bg-fill-error-weak",
				false: "border border-stroke-strong hover:bg-fill-hover active:bg-fill-press",
			},
		},
		defaultVariants: {
			size: "sm",
			invalid: false,
		},
	},
);

interface TextInputProps
	extends Omit<React.ComponentPropsWithoutRef<"input">, "size">,
		Omit<VariantProps<typeof textInputVariants>, "invalid"> {
	label?: string;
	hint?: string;
	error?: string;
	optional?: boolean;
	iconLeft?: React.ReactNode;
	iconRight?: React.ReactNode;
	size?: "xxs" | "xs" | "sm" | "md" | "lg";
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
	(
		{
			className,
			size: sizeProp,
			label,
			hint,
			error,
			required,
			optional,
			disabled,
			iconLeft,
			iconRight,
			name,
			...props
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const isInvalid = !!error;

		return (
			<Field.Root className="group flex flex-col gap-1 w-full" disabled={disabled} invalid={isInvalid} name={name}>
				{label && (
					<div className="flex flex-col">
						<Field.Label className="flex gap-1 items-baseline text-sm font-normal cursor-default">
							<span className="text-text-strong group-data-disabled:text-text-disabled">{label}</span>
							{required && <span className="text-text-weak group-data-disabled:text-text-disabled">*</span>}
							{optional && (
								<span className="text-xs text-text-weak group-data-disabled:text-text-disabled">(optional)</span>
							)}
						</Field.Label>
						{hint && <Field.Description className="text-xs text-text-weak">{hint}</Field.Description>}
					</div>
				)}
				{error && (
					<Field.Error match className="flex items-center gap-2 py-1">
						<XCircleIcon size={24} weight="fill" className="shrink-0 text-icon-error" />
						<span className="text-xs font-semibold text-text-error">{error}</span>
					</Field.Error>
				)}
				<div
					className={cn(
						textInputVariants({ size, invalid: isInvalid }),
						"group-data-disabled:border-stroke-disabled group-data-disabled:cursor-not-allowed",
						"focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stroke-focus",
						className,
					)}
				>
					{iconLeft && (
						<span className="shrink-0 text-icon-neutral group-data-disabled:text-icon-disabled">{iconLeft}</span>
					)}
					<Input
						ref={ref}
						required={required}
						className={cn(
							"flex-1 min-w-0 bg-transparent outline-none",
							size === "xxs"
								? "text-2xs"
								: size === "xs" || size === "sm"
									? "text-xs"
									: size === "lg"
										? "text-base"
										: "text-sm",
							"font-normal text-text-strong placeholder:text-text-weak",
							"data-disabled:text-text-disabled data-disabled:placeholder:text-text-disabled data-disabled:cursor-not-allowed",
						)}
						{...props}
					/>
					{iconRight && (
						<span className="shrink-0 text-icon-neutral group-data-disabled:text-icon-disabled">{iconRight}</span>
					)}
				</div>
			</Field.Root>
		);
	},
);
TextInput.displayName = "TextInput";

export { TextInput, textInputVariants };
export type { TextInputProps };
