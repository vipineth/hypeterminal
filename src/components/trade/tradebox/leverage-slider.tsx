import { Slider } from "@/components/ui/slider";

interface Props {
	value: number;
	onChange: (value: number) => void;
	max: number;
	disabled?: boolean;
	className?: string;
}

export function LeverageSlider({ value, onChange, max, disabled, className }: Props) {
	return (
		<Slider
			thumbLabel="Leverage"
			thickness="sm"
			value={value}
			onValueChange={onChange}
			min={1}
			max={max}
			step={1}
			disabled={disabled}
			className={className}
		/>
	);
}
