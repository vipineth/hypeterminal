import { Slider as SliderPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

interface SliderMark {
	value: number;
	label?: string;
}

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	marks,
	onValueChange,
	onValueCommit,
	disabled,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
	marks?: SliderMark[];
}) {
	const _values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max];
	const currentValue = _values[0] ?? min;
	const hasLabels = marks?.some((m) => m.label);

	function handleMarkClick(markValue: number) {
		onValueChange?.([markValue]);
		onValueCommit?.([markValue]);
	}

	const slider = (
		<SliderPrimitive.Root
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			onValueChange={onValueChange}
			onValueCommit={onValueCommit}
			disabled={disabled}
			className={cn(
				"relative flex w-full touch-none items-center select-none data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
				"data-[disabled]:cursor-not-allowed",
				!hasLabels && className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className={cn(
					"bg-border-200 relative grow overflow-hidden rounded-full",
					"data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full",
					"data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2",
					"data-[disabled]:bg-border-200/50",
				)}
			>
				<SliderPrimitive.Range
					data-slot="slider-range"
					className={cn(
						"bg-primary-default absolute",
						"data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
						"data-[disabled]:bg-text-400",
					)}
				/>
			</SliderPrimitive.Track>
			{marks?.map((mark) => {
				if (mark.value === currentValue) return null;
				const position = ((mark.value - min) / (max - min)) * 100;
				const isActive = currentValue >= mark.value;
				return (
					<div
						key={mark.value}
						className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
						style={{ left: `${position}%` }}
					>
						<div
							className={cn(
								"size-2.5 rounded-full transition-colors",
								!isActive && "bg-border-200",
								isActive && !disabled && "bg-primary-default",
								isActive && disabled && "bg-text-400",
							)}
						/>
					</div>
				);
			})}
			{Array.from({ length: _values.length }, (_, index) => (
				<SliderPrimitive.Thumb
					data-slot="slider-thumb"
					// biome-ignore lint/suspicious/noArrayIndexKey: Slider thumbs are positional, don't reorder
					key={index}
					className={cn(
						"block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] z-10",
						"border-primary-default bg-primary-default",
						"ring-primary-default/50 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden",
						"data-[disabled]:pointer-events-none data-[disabled]:bg-text-400 data-[disabled]:border-text-400/40",
					)}
				/>
			))}
		</SliderPrimitive.Root>
	);

	if (!hasLabels) return slider;

	return (
		<div className={cn("w-full", disabled && "opacity-50 pointer-events-none", className)}>
			{slider}
			<div className="relative h-5 mt-1">
				{marks?.map((mark) => {
					if (!mark.label) return null;
					const position = ((mark.value - min) / (max - min)) * 100;
					const isSelected = currentValue === mark.value;
					return (
						<button
							key={mark.value}
							type="button"
							onClick={() => handleMarkClick(mark.value)}
							disabled={disabled}
							className={cn(
								"absolute -translate-x-1/2 text-3xs tabular-nums transition-colors",
								isSelected ? "text-primary-default font-medium" : "text-text-950",
							)}
							style={{ left: `${position}%` }}
						>
							{mark.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export { Slider };
export type { SliderMark };
