import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const sliderVariants = cva([
	"flex w-full touch-none select-none flex-col gap-2",
	"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
]);

interface SliderProps
	extends Omit<React.ComponentPropsWithoutRef<typeof BaseSlider.Root>, "className">,
		VariantProps<typeof sliderVariants> {
	className?: string;
	label?: string;
	showValue?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(({ className, label, showValue, ...props }, ref) => {
	const thumbCount = React.useMemo(() => {
		const val = props.value ?? props.defaultValue;
		return Array.isArray(val) ? val.length : 1;
	}, [props.value, props.defaultValue]);

	return (
		<BaseSlider.Root ref={ref} className={cn(sliderVariants({ className }))} {...props}>
			{(label || showValue) && (
				<div className="flex items-center gap-4">
					{label && (
						<BaseSlider.Label className="flex-1 text-sm font-normal text-text-strong">{label}</BaseSlider.Label>
					)}
					{showValue && <BaseSlider.Value className="text-sm font-normal text-text-weak tabular-nums" />}
				</div>
			)}
			<BaseSlider.Control className="relative flex w-full items-center h-6">
				<BaseSlider.Track
					className={cn(
						"relative w-full h-2 overflow-hidden rounded-32",
						"bg-fill-weak ring-1 ring-inset ring-stroke-weak",
						"inset-shadow-sunken",
					)}
				>
					<BaseSlider.Indicator className="absolute inset-y-0 h-auto rounded-32 bg-fill-selected inset-shadow-sunken" />
				</BaseSlider.Track>
				{Array.from({ length: thumbCount }, (_, i) => (
					<BaseSlider.Thumb
						key={i}
						index={i}
						className={cn(
							"relative size-6 rounded-full bg-fill-white",
							"border border-stroke-strong shadow-raised",
							"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
							"before:absolute before:-inset-2.5 before:content-['']",
						)}
					/>
				))}
			</BaseSlider.Control>
		</BaseSlider.Root>
	);
});
Slider.displayName = "Slider";

export { Slider, sliderVariants };
export type { SliderProps };
