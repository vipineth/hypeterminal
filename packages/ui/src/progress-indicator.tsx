import { ArrowLeft } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const progressIndicatorVariants = cva([
	"flex flex-col gap-4",
	"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
]);

interface ProgressIndicatorProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof progressIndicatorVariants> {
	currentStep: number;
	totalSteps: number;
	label?: React.ReactNode;
	onBack?: () => void;
	backLabel?: string;
	disabled?: boolean;
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
	({ className, currentStep, totalSteps, label, onBack, backLabel = "Back", disabled, ...props }, ref) => (
		<div
			className={cn(progressIndicatorVariants({ className }))}
			ref={ref}
			data-disabled={disabled ? "" : undefined}
			{...props}
		>
			<div className="flex flex-col gap-2">
				<p className="text-sm font-semibold text-text-strong tabular-nums">
					{label ?? `Step ${currentStep} of ${totalSteps}`}
				</p>
				<div
					className="flex gap-1"
					role="progressbar"
					aria-valuenow={currentStep}
					aria-valuemin={1}
					aria-valuemax={totalSteps}
					aria-valuetext={`Step ${currentStep} of ${totalSteps}`}
				>
					{Array.from({ length: totalSteps }, (_, i) => (
						<div
							key={i}
							className={cn(
								"h-2 flex-1 rounded-4",
								"transition-colors duration-200 ease-out motion-reduce:transition-none",
								i < currentStep ? "bg-fill-selected" : "border border-stroke-weak bg-fill-weak inset-shadow-sunken",
							)}
						/>
					))}
				</div>
			</div>
			{onBack && (
				<button
					type="button"
					onClick={disabled ? undefined : onBack}
					aria-disabled={disabled || undefined}
					data-disabled={disabled ? "" : undefined}
					className={cn(
						"inline-flex items-center gap-2 text-sm font-semibold text-text-brand",
						"cursor-pointer bg-transparent border-none p-0",
						"rounded-4 transition-opacity duration-150",
						"hover:opacity-80",
						"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
						"data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:pointer-events-none",
					)}
				>
					<ArrowLeft size={20} className="shrink-0" />
					{backLabel}
				</button>
			)}
		</div>
	),
);
ProgressIndicator.displayName = "ProgressIndicator";

export { ProgressIndicator, progressIndicatorVariants };
export type { ProgressIndicatorProps };
