import clsx from "clsx";
import { useMemo } from "react";

interface Props {
	value: number;
	onChange: (value: number) => void;
	max: number;
	disabled?: boolean;
	className?: string;
}

function generateMarks(max: number): number[] {
	if (max <= 5) {
		return Array.from({ length: max }, (_, i) => i + 1);
	}

	const targetCount = 5;
	const marks: number[] = [1];

	const step = (max - 1) / (targetCount - 1);
	const roundTo = max <= 10 ? 1 : max <= 50 ? 5 : 10;

	for (let i = 1; i < targetCount - 1; i++) {
		const raw = 1 + step * i;
		const rounded = Math.round(raw / roundTo) * roundTo;
		if (rounded > 1 && rounded < max && rounded !== marks[marks.length - 1]) {
			marks.push(rounded);
		}
	}

	marks.push(max);
	return marks;
}

export function LeverageSlider({ value, onChange, max, disabled, className }: Props) {
	const marks = useMemo(() => generateMarks(max), [max]);
	const percentage = ((value - 1) / (max - 1)) * 100;

	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(Number(e.target.value));
	};

	return (
		<div className={clsx("space-y-1", disabled && "opacity-50 pointer-events-none", className)}>
			<div className="relative h-5 flex items-center">
				<div className="absolute inset-x-0 h-1.5 bg-border rounded-full">
					<div
						className="absolute inset-y-0 left-0 bg-terminal-cyan rounded-full transition-all duration-75"
						style={{ width: `${percentage}%` }}
					/>
				</div>

				{marks.map((mark) => {
					const markPosition = ((mark - 1) / (max - 1)) * 100;
					const isActive = value >= mark;
					return (
						<div
							key={mark}
							className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
							style={{ left: `${markPosition}%` }}
						>
							<div
								className={clsx(
									"size-2 rounded-full transition-colors",
									isActive ? "bg-terminal-cyan" : "bg-muted-foreground/60",
								)}
							/>
						</div>
					);
				})}

				<input
					type="range"
					min={1}
					max={max}
					value={value}
					onChange={handleSliderChange}
					disabled={disabled}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
				/>

				<div
					className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-75"
					style={{ left: `${percentage}%` }}
				>
					<div className="size-3.5 rounded-full bg-terminal-cyan border-2 border-background shadow-sm" />
				</div>
			</div>

			<div className="relative h-5">
				{marks.map((mark) => {
					const markPosition = ((mark - 1) / (max - 1)) * 100;
					const isSelected = value === mark;
					return (
						<button
							key={mark}
							type="button"
							onClick={() => !disabled && onChange(mark)}
							disabled={disabled}
							className={clsx(
								"absolute -translate-x-1/2 text-3xs tabular-nums transition-colors",
								isSelected
									? "text-terminal-cyan font-medium"
									: "text-muted-foreground hover:text-foreground",
								!disabled && "cursor-pointer",
							)}
							style={{ left: `${markPosition}%` }}
						>
							{mark}×
						</button>
					);
				})}
			</div>
		</div>
	);
}
