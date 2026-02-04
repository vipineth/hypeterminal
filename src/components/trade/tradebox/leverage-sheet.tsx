import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Check, SpinnerGap, Warning } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
}

export function LeverageSheet({
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
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="px-4 pb-8 pt-6">
				<div className="space-y-5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium uppercase tracking-wide text-muted-fg">
							<Trans>Leverage</Trans>
						</span>
						<div className="flex items-center gap-1.5">
							<NumberInput
								value={inputValue}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								disabled={isUpdating}
								allowDecimals={false}
								min={1}
								max={maxLeverage}
								inputSize="lg"
								className="w-16 text-center font-medium tabular-nums"
							/>
							<span className="text-base text-muted-fg">x</span>
						</div>
					</div>

					<LeverageSlider value={displayValue} onChange={onLeverageChange} max={maxLeverage} disabled={isUpdating} />

					{updateError && (
						<div className="flex items-center gap-2 p-2.5 bg-negative/10 border border-negative/20 rounded-md text-sm text-negative">
							<Warning className="size-4 shrink-0" />
							<span>{updateError.message || t`Update failed`}</span>
						</div>
					)}

					{showSuccess && (
						<div className="flex items-center justify-center gap-2 p-2.5 bg-positive/10 border border-positive/20 rounded-md text-sm text-positive">
							<Check className="size-4" />
							<Trans>Updated</Trans>
						</div>
					)}

					{updateError ? (
						<div className="flex gap-3">
							<Button variant="outline" size="lg" className="flex-1" onClick={handleCancel}>
								<Trans>Cancel</Trans>
							</Button>
							<Button
								variant="ghost"
								size="none"
								onClick={handleConfirm}
								disabled={isUpdating}
								className={cn(
									"flex-1 py-3 text-xs font-semibold uppercase tracking-wider gap-2 hover:bg-transparent",
									"bg-info/20 border border-info text-info",
									"hover:bg-info/30",
								)}
							>
								{isUpdating && <SpinnerGap className="size-4 animate-spin" />}
								<Trans>Retry</Trans>
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="none"
							onClick={handleConfirm}
							disabled={!isDirty || isUpdating || showSuccess}
							className={cn(
								"w-full py-3 text-xs font-semibold uppercase tracking-wider gap-2 border hover:bg-transparent",
								isDirty && !isUpdating && !showSuccess
									? "bg-info/20 border-info text-info hover:bg-info/30"
									: "bg-info/10 border-info/30 text-info/50",
							)}
						>
							{isUpdating && <SpinnerGap className="size-4 animate-spin" />}
							<Trans>Confirm</Trans>
						</Button>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
