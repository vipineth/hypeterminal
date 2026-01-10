import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import clsx from "clsx";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
						<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							<Trans>Leverage</Trans>
						</span>
						<div className="flex items-center gap-1.5">
							<input
								type="number"
								min={1}
								max={maxLeverage}
								value={inputValue}
								onChange={handleInputChange}
								onBlur={handleInputBlur}
								disabled={isUpdating}
								className={clsx(
									"w-16 h-9 text-base font-medium tabular-nums text-center bg-muted/30 border border-border/50 rounded-md",
									"focus:outline-none focus:border-terminal-cyan/50",
									"[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
								)}
							/>
							<span className="text-base text-muted-foreground">x</span>
						</div>
					</div>

					<LeverageSlider value={displayValue} onChange={onLeverageChange} max={maxLeverage} disabled={isUpdating} />

					{updateError && (
						<div className="flex items-center gap-2 p-2.5 bg-terminal-red/10 border border-terminal-red/20 rounded-md text-sm text-terminal-red">
							<AlertTriangle className="size-4 shrink-0" />
							<span>{updateError.message || t`Update failed`}</span>
						</div>
					)}

					{showSuccess && (
						<div className="flex items-center justify-center gap-2 p-2.5 bg-terminal-green/10 border border-terminal-green/20 rounded-md text-sm text-terminal-green">
							<Check className="size-4" />
							<Trans>Updated</Trans>
						</div>
					)}

					{updateError ? (
						<div className="flex gap-3">
							<Button variant="outline" size="lg" className="flex-1" onClick={handleCancel}>
								<Trans>Cancel</Trans>
							</Button>
							<button
								type="button"
								onClick={handleConfirm}
								disabled={isUpdating}
								className={clsx(
									"flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
									"bg-terminal-cyan/20 border border-terminal-cyan text-terminal-cyan",
									"hover:bg-terminal-cyan/30",
									"disabled:opacity-50 disabled:cursor-not-allowed",
								)}
							>
								{isUpdating && <Loader2 className="size-4 animate-spin" />}
								<Trans>Retry</Trans>
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={handleConfirm}
							disabled={!isDirty || isUpdating || showSuccess}
							className={clsx(
								"w-full py-3 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
								"border",
								isDirty && !isUpdating && !showSuccess
									? "bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30"
									: "bg-terminal-cyan/10 border-terminal-cyan/30 text-terminal-cyan/50 cursor-not-allowed",
							)}
						>
							{isUpdating && <Loader2 className="size-4 animate-spin" />}
							<Trans>Confirm</Trans>
						</button>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
