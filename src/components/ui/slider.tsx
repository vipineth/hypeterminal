import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/cn";

type SliderRootProps = SliderPrimitive.Root.Props<number>;
type SliderThickness = "sm" | "md" | "lg";

const TRACK_THICKNESS_CLASSNAME: Record<SliderThickness, string> = {
	sm: "data-horizontal:h-1.5 data-vertical:w-1.5",
	md: "data-horizontal:h-2 data-vertical:w-2",
	lg: "data-horizontal:h-2.5 data-vertical:w-2.5",
};

interface SliderProps extends SliderRootProps {
	thumbLabel: string;
	thickness?: SliderThickness;
}

function Slider({
	className,
	thumbLabel,
	thickness = "md",
	defaultValue,
	value,
	min = 0,
	max = 100,
	orientation = "horizontal",
	...props
}: SliderProps) {
	return (
		<SliderPrimitive.Root
			className={cn("data-horizontal:w-full data-vertical:h-full", className)}
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			orientation={orientation}
			{...props}
		>
			<SliderPrimitive.Control className="flex w-full touch-none items-center py-3 select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
				<SliderPrimitive.Track
					data-slot="slider-track"
					className={cn(
						"w-full rounded-full bg-input select-none data-vertical:h-full",
						TRACK_THICKNESS_CLASSNAME[thickness],
					)}
				>
					<SliderPrimitive.Indicator
						data-slot="slider-range"
						className="rounded-full bg-primary select-none data-horizontal:h-full data-vertical:w-full"
					/>
					<SliderPrimitive.Thumb
						aria-label={thumbLabel}
						data-slot="slider-thumb"
						className="size-4 rounded-full bg-white outline-1 outline-input transition-[outline-color,outline-width] select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring disabled:pointer-events-none disabled:opacity-50"
					/>
				</SliderPrimitive.Track>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
export type { SliderProps, SliderThickness };
