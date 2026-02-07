import { useMemo } from "react";
import { Slider, type SliderMark } from "@/components/ui/slider";

interface Props {
	value: number;
	onChange: (value: number) => void;
	max: number;
	disabled?: boolean;
	className?: string;
}

function generateMarks(max: number): SliderMark[] {
	const values: number[] = [];

	if (max <= 5) {
		for (let i = 1; i <= max; i++) values.push(i);
	} else {
		const targetCount = 5;
		values.push(1);

		const step = (max - 1) / (targetCount - 1);
		const roundTo = max <= 10 ? 1 : max <= 50 ? 5 : 10;

		for (let i = 1; i < targetCount - 1; i++) {
			const raw = 1 + step * i;
			const rounded = Math.round(raw / roundTo) * roundTo;
			if (rounded > 1 && rounded < max && rounded !== values[values.length - 1]) {
				values.push(rounded);
			}
		}

		values.push(max);
	}

	return values.map((v) => ({ value: v, label: `${v}×` }));
}

export function LeverageSlider({ value, onChange, max, disabled, className }: Props) {
	const marks = useMemo(() => generateMarks(max), [max]);

	return (
		<Slider
			value={[value]}
			onValueChange={(v) => onChange(v[0])}
			min={1}
			max={max}
			step={1}
			marks={marks}
			disabled={disabled}
			className={className}
		/>
	);
}
