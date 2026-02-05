import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CheckIcon, SpinnerGapIcon, WarningIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { LeverageSlider } from "./leverage-slider";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentLeverage: number;
	pendingLeverage: number | null;
	maxLeverage: number;
	isDirty: boolean;
	isUpdating: boolean;
	updateError: Error | null;
	onLeverageChange: (value: number) => void;
	onConfirm: () => Promise<void>;
	onCancel: () => void;
	trigger: React.ReactNode;
}

export function LeveragePopover({
	open,
	onOpenChange,
	currentLeverage,
	pendingLeverage,
	maxLeverage,
	isDirty,
	isUpdating,
	updateError,
	onLeverageChange,
	onConfirm,
	onCancel,
	trigger,
}: Props) {
	const displayValue = pendingLeverage ?? currentLeverage;
	const [inputValue, setInputValue] = useState(String(displayValue));
	const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		setInputValue(String(displayValue));
	}, [displayValue]);

	useEffect(() => {
		return () => {
			if (autoCloseTimerRef.current) {
				clearTimeout(autoCloseTimerRef.current);
			}
		};
	}, []);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		setInputValue(raw);

		const num = Number.parseInt(raw, 10);
		if (!Number.isNaN(num) && num >= 1 && num <= maxLeverage) {
			onLeverageChange(num);
		}
	};

	const handleInputBlur = () => {
		const num = Number.parseInt(inputValue, 10);
		if (Number.isNaN(num) || num < 1) {
			onLeverageChange(1);
			setInputValue("1");
		} else if (num > maxLeverage) {
			onLeverageChange(maxLeverage);
			setInputValue(String(maxLeverage));
		}
	};

	const handleConfirm = async () => {
		try {
			await onConfirm();
			setShowSuccess(true);
			autoCloseTimerRef.current = setTimeout(() => {
				onOpenChange(false);
				setShowSuccess(false);
			}, 1500);
		} catch {
			// Error handled by hook
		}
	};

	const handleCancel = () => {
		onCancel();
		onOpenChange(false);
	};

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>{trigger}</PopoverTrigger>
			<PopoverContent align="end" className="w-56 p-3">
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<span className="text-3xs font-medium uppercase tracking-wide text-muted-fg">
							<Trans>Leverage</Trans>
						</span>
						<div className="flex items-center gap-1">
							<NumberInput
								value={inputValue}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								disabled={isUpdating}
								allowDecimals={false}
								min={1}
								max={maxLeverage}
								inputSize="sm"
								className="w-12 text-center font-medium tabular-nums"
							/>
							<span className="text-xs text-muted-fg">x</span>
						</div>
					</div>

					<LeverageSlider value={displayValue} onChange={onLeverageChange} max={maxLeverage} disabled={isUpdating} />

					{updateError && (
						<div className="flex items-center gap-1.5 p-1.5 bg-negative/10 border border-negative/20 rounded-md text-3xs text-negative">
							<WarningIcon className="size-3 shrink-0" />
							<span className="truncate">{updateError.message || t`Update failed`}</span>
						</div>
					)}

					{showSuccess && (
						<div className="flex items-center justify-center gap-1.5 p-1.5 bg-positive/10 border border-positive/20 rounded-md text-3xs text-positive">
							<CheckIcon className="size-3" />
							<Trans>Updated</Trans>
						</div>
					)}

					{updateError ? (
						<div className="flex gap-2">
							<Button variant="outlined" size="sm" className="flex-1" onClick={handleCancel}>
								<Trans>Cancel</Trans>
							</Button>
							<Button
								variant="text"
								size="none"
								onClick={handleConfirm}
								disabled={isUpdating}
								className={cn(
									"flex-1 py-2 text-2xs font-semibold uppercase tracking-wider gap-1.5 hover:bg-transparent",
									"bg-info/20 border border-info text-info",
									"hover:bg-info/30",
								)}
							>
								{isUpdating && <SpinnerGapIcon className="size-3 animate-spin" />}
								<Trans>Retry</Trans>
							</Button>
						</div>
					) : (
						<Button
							variant="outlined"
							color="accent"
							size="sm"
							onClick={handleConfirm}
							disabled={!isDirty || isUpdating || showSuccess}
							className={cn("w-full py-2 uppercase tracking-wider gap-1.5")}
						>
							{isUpdating && <SpinnerGapIcon className="size-3 animate-spin" />}
							<Trans>Confirm</Trans>
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
