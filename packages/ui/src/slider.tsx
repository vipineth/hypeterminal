import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const sliderVariants = cva([
	"flex w-full touch-none select-none flex-col gap-2",
	"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
]);

type SliderThumbSize = "sm" | "md" | "lg";

interface SliderProps
	extends Omit<React.ComponentPropsWithoutRef<typeof BaseSlider.Root>, "className">,
		VariantProps<typeof sliderVariants> {
	className?: string;
	label?: string;
	showValue?: boolean;
	thumbSize?: SliderThumbSize;
}

const thumbSizeClasses: Record<SliderThumbSize, string> = {
	sm: "size-3",
	md: "size-4",
	lg: "size-6",
};

const thumbHitAreaClasses: Record<SliderThumbSize, string> = {
	sm: "before:-inset-4",
	md: "before:-inset-3.5",
	lg: "before:-inset-2.5",
};

const controlHeightClasses: Record<SliderThumbSize, string> = {
	sm: "h-4",
	md: "h-5",
	lg: "h-8",
};

const trackHeightClasses: Record<SliderThumbSize, string> = {
	sm: "h-1",
	md: "h-1.5",
	lg: "h-2.5",
};

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
	({ className, label, showValue, thumbSize = "md", ...props }, ref) => {
		const val = props.value ?? props.defaultValue;
		const thumbCount = Array.isArray(val) ? val.length : 1;
		const thumbIndexes = Array.from({ length: thumbCount }, (_, thumbIndex) => thumbIndex);

		return (
			<BaseSlider.Root ref={ref} className={cn(sliderVariants({ className }))} {...props}>
				{(label || showValue) && (
					<div className="flex items-center gap-4">
						{label && <BaseSlider.Label className="flex-1 text-sm font-normal text-fg">{label}</BaseSlider.Label>}
						{showValue && <BaseSlider.Value className="text-sm font-normal text-fg-muted tabular-nums" />}
					</div>
				)}
				<BaseSlider.Control className={cn("relative flex w-full items-center", controlHeightClasses[thumbSize])}>
					<BaseSlider.Track
						className={cn(
							"relative w-full overflow-hidden rounded-32",
							"bg-fill-weak ring-1 ring-inset ring-stroke-weak",
							"inset-shadow-sunken",
							trackHeightClasses[thumbSize],
						)}
					>
						<BaseSlider.Indicator className="absolute inset-y-0 h-auto rounded-32 bg-fill-selected min-w-1 inset-shadow-sunken" />
					</BaseSlider.Track>
					{thumbIndexes.map((thumbIndex) => (
						<BaseSlider.Thumb
							key={`thumb-${thumbIndex}`}
							index={thumbIndex}
							className={cn(
								"relative rounded-full bg-white",
								"border-2 border-stroke-focus shadow-md",
								"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
								"before:absolute before:content-['']",
								thumbSizeClasses[thumbSize],
								thumbHitAreaClasses[thumbSize],
							)}
						/>
					))}
				</BaseSlider.Control>
			</BaseSlider.Root>
		);
	},
);
Slider.displayName = "Slider";

export { Slider, sliderVariants };
export type { SliderProps, SliderThumbSize };
