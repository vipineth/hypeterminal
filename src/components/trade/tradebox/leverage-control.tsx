import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CaretDownIcon, CheckIcon, SpinnerGapIcon, WarningIcon } from "@phosphor-icons/react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAssetLeverage } from "@/hooks/trade/use-asset-leverage";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { LeverageSlider } from "./leverage-slider";

interface BadgeProps {
	leverage: number;
	onClick?: () => void;
	isLoading?: boolean;
	className?: string;
}

const LeverageBadge = forwardRef<HTMLButtonElement, BadgeProps>(({ leverage, onClick, isLoading, className }, ref) => {
	return (
		<Button
			ref={ref}
			variant="outlined"
			onClick={onClick}
			className={cn(isLoading && "opacity-70", className)}
			aria-label={t`Change leverage`}
		>
			<span className="text-text-600">{t`Leverage`}</span>
			<span className="tabular-nums font-medium text-text-950">{leverage}x</span>
			<CaretDownIcon className="size-2.5 text-text-600" />
		</Button>
	);
});

LeverageBadge.displayName = "LeverageBadge";

interface EditorProps {
	compact: boolean;
	currentLeverage: number;
	pendingLeverage: number | null;
	maxLeverage: number;
	isDirty: boolean;
	isUpdating: boolean;
	updateError: Error | null;
	onLeverageChange: (value: number) => void;
	onConfirm: () => Promise<void>;
	onCancel: () => void;
	onOpenChange: (open: boolean) => void;
}

function LeverageEditor({
	compact,
	currentLeverage,
	pendingLeverage,
	maxLeverage,
	isDirty,
	isUpdating,
	updateError,
	onLeverageChange,
	onConfirm,
	onCancel,
	onOpenChange,
}: EditorProps) {
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

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value;
		setInputValue(raw);

		const num = Number.parseInt(raw, 10);
		if (!Number.isNaN(num) && num >= 1 && num <= maxLeverage) {
			onLeverageChange(num);
		}
	}

	function handleInputBlur() {
		const num = Number.parseInt(inputValue, 10);
		if (Number.isNaN(num) || num < 1) {
			onLeverageChange(1);
			setInputValue("1");
		} else if (num > maxLeverage) {
			onLeverageChange(maxLeverage);
			setInputValue(String(maxLeverage));
		}
	}

	async function handleConfirm() {
		try {
			await onConfirm();
			setShowSuccess(true);
			autoCloseTimerRef.current = setTimeout(() => {
				onOpenChange(false);
				setShowSuccess(false);
			}, 1500);
		} catch {
			/* handled by hook */
		}
	}

	function handleCancel() {
		onCancel();
		onOpenChange(false);
	}

	const iconSize = compact ? "size-3" : "size-4";

	return (
		<div className={compact ? "space-y-3" : "space-y-5"}>
			<div className="flex items-center justify-between">
				<span
					className={cn(
						"uppercase tracking-wide text-text-600",
						compact ? "text-2xs font-normal" : "text-xs font-medium",
					)}
				>
					<Trans>Leverage</Trans>
				</span>
				<div className={cn("flex items-center", compact ? "gap-1" : "gap-1.5")}>
					<NumberInput
						value={inputValue}
						onChange={handleInputChange}
						onBlur={handleInputBlur}
						disabled={isUpdating}
						allowDecimals={false}
						min={1}
						max={maxLeverage}
						inputSize={compact ? "sm" : "lg"}
						className={cn("text-center font-medium tabular-nums", compact ? "w-12" : "w-16")}
					/>
					<span className={cn("text-text-600", compact ? "text-xs" : "text-base")}>x</span>
				</div>
			</div>

			<LeverageSlider value={displayValue} onChange={onLeverageChange} max={maxLeverage} disabled={isUpdating} />

			{updateError && (
				<div
					className={cn(
						"flex items-center bg-market-down-100 border border-market-down-600/20 rounded-xs text-market-down-600",
						compact ? "gap-1.5 p-1.5 text-3xs" : "gap-2 p-2.5 text-sm",
					)}
				>
					<WarningIcon className={cn(iconSize, "shrink-0")} />
					<span className={compact ? "truncate" : undefined}>{updateError.message || t`Update failed`}</span>
				</div>
			)}

			{showSuccess && (
				<div
					className={cn(
						"flex items-center justify-center bg-market-up-100 border border-market-up-600/20 rounded-xs text-market-up-600",
						compact ? "gap-1.5 p-1.5 text-3xs" : "gap-2 p-2.5 text-sm",
					)}
				>
					<CheckIcon className={iconSize} />
					<Trans>Updated</Trans>
				</div>
			)}

			{updateError && (
				<div className={cn("flex", compact ? "gap-2" : "gap-3")}>
					<Button variant="outlined" size={compact ? "sm" : "lg"} className="flex-1" onClick={handleCancel}>
						<Trans>Cancel</Trans>
					</Button>
					<Button
						variant="text"
						size={compact ? "none" : undefined}
						onClick={handleConfirm}
						disabled={isUpdating}
						className={cn(
							"flex-1 font-semibold uppercase tracking-wider hover:bg-transparent",
							"bg-primary-default/20 border border-primary-default text-primary-default hover:bg-primary-default/30",
							compact ? "py-2 text-2xs gap-1.5" : "py-3 text-xs gap-2",
						)}
					>
						{isUpdating && <SpinnerGapIcon className={cn(iconSize, "animate-spin")} />}
						<Trans>Retry</Trans>
					</Button>
				</div>
			)}

			{!updateError && compact && (
				<Button
					variant="outlined"
					size="md"
					tone="accent"
					onClick={handleConfirm}
					disabled={!isDirty || isUpdating || showSuccess}
					className="w-full"
				>
					{isUpdating && <SpinnerGapIcon className="size-3 animate-spin" />}
					<Trans>Confirm</Trans>
				</Button>
			)}

			{!updateError && !compact && (
				<Button
					variant="text"
					onClick={handleConfirm}
					disabled={!isDirty || isUpdating || showSuccess}
					className={cn(
						"w-full py-3 text-xs font-semibold uppercase tracking-wider gap-2 border hover:bg-transparent",
						isDirty && !isUpdating && !showSuccess
							? "bg-primary-default/20 border-primary-default text-primary-default hover:bg-primary-default/30"
							: "bg-primary-default/10 border-primary-default/30 text-primary-default/50",
					)}
				>
					{isUpdating && <SpinnerGapIcon className="size-4 animate-spin" />}
					<Trans>Confirm</Trans>
				</Button>
			)}
		</div>
	);
}

interface Props {
	className?: string;
}

export function LeverageControl({ className }: Props) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);

	const {
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		displayLeverage,
		isDirty,
		isUpdating,
		updateError,
		subscriptionStatus,
		setPendingLeverage,
		confirmLeverage,
		resetPending,
	} = useAssetLeverage();

	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			resetPending();
		}
		setOpen(newOpen);
	}

	const isLoading = subscriptionStatus === "loading";

	const editorProps = {
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		isDirty,
		isUpdating,
		updateError,
		onLeverageChange: setPendingLeverage,
		onConfirm: confirmLeverage,
		onCancel: resetPending,
		onOpenChange: handleOpenChange,
	};

	if (isMobile) {
		return (
			<>
				<LeverageBadge
					leverage={displayLeverage}
					onClick={() => setOpen(true)}
					isLoading={isLoading}
					className={className}
				/>
				<Sheet open={open} onOpenChange={handleOpenChange}>
					<SheetContent side="bottom" className="px-4 pb-8 pt-6">
						<LeverageEditor {...editorProps} compact={false} />
					</SheetContent>
				</Sheet>
			</>
		);
	}

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<LeverageBadge leverage={displayLeverage} isLoading={isLoading} className={className} />
			</PopoverTrigger>
			<PopoverContent align="end" className="w-56 p-3">
				<LeverageEditor {...editorProps} compact />
			</PopoverContent>
		</Popover>
	);
}

export { useAssetLeverage };
