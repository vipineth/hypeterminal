import { Slider } from "@hypeterminal/ui";
import { useMemo } from "react";

interface Props {
	value: number;
	onChange: (value: number) => void;
	max: number;
	disabled?: boolean;
	className?: string;
}

interface Mark {
	value: number;
	label: string;
}

function generateMarks(max: number): Mark[] {
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
		<div className={className}>
			<Slider
				value={value}
				onValueChange={(v) => onChange(v as number)}
				min={1}
				max={max}
				step={1}
				disabled={disabled}
				label={`${value}×`}
			/>
			<div className="relative h-5 mt-1">
				{marks.map((mark) => {
					const position = ((mark.value - 1) / (max - 1)) * 100;
					const isSelected = value === mark.value;
					return (
						<button
							key={mark.value}
							type="button"
							onClick={() => onChange(mark.value)}
							disabled={disabled}
							className={`absolute -translate-x-1/2 text-xs tabular-nums transition-colors ${isSelected ? "text-text-brand font-medium" : "text-text-strong"}`}
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
