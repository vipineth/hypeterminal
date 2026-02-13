import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CaretDownIcon, CheckIcon, ShieldIcon, SpinnerGapIcon, StackIcon, WarningIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalDescription,
	ResponsiveModalFooter,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { MARGIN_MODE_SUCCESS_DURATION_MS } from "@/config/time";
import { cn } from "@/lib/cn";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { TradingActionButton } from "../components/trading-action-button";

const MODE_ICONS = { cross: StackIcon, isolated: ShieldIcon } as const;

interface MarginModeToggleProps {
	mode: MarginMode;
	disabled?: boolean;
	onClick?: () => void;
}

export function MarginModeToggle({ mode, disabled, onClick }: MarginModeToggleProps) {
	const label = mode === "cross" ? t`Cross` : t`Isolated`;
	const Icon = MODE_ICONS[mode];

	return (
		<Button variant="outlined" size="md" onClick={onClick} disabled={disabled}>
			<Icon className="size-3" />
			<span>{label}</span>
			<CaretDownIcon className="size-3" />
		</Button>
	);
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentMode: MarginMode;
	hasPosition: boolean;
	isUpdating: boolean;
	updateError: Error | null;
	onConfirm: (mode: MarginMode) => Promise<void>;
}

const MODE_OPTIONS: Array<{
	id: MarginMode;
	label: () => string;
	description: () => string;
	icon: typeof StackIcon;
}> = [
	{
		id: "cross",
		label: () => t`Cross`,
		description: () =>
			t`All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.`,
		icon: StackIcon,
	},
	{
		id: "isolated",
		label: () => t`Isolated`,
		description: () =>
			t`Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.`,
		icon: ShieldIcon,
	},
];

export function MarginModeDialog({
	open,
	onOpenChange,
	currentMode,
	hasPosition,
	isUpdating,
	updateError,
	onConfirm,
}: Props) {
	const [selectedMode, setSelectedMode] = useState<MarginMode>(currentMode);
	const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		if (open) {
			setSelectedMode(currentMode);
			setShowSuccess(false);
		} else if (autoCloseTimerRef.current) {
			clearTimeout(autoCloseTimerRef.current);
			autoCloseTimerRef.current = null;
		}

		return () => {
			if (autoCloseTimerRef.current) {
				clearTimeout(autoCloseTimerRef.current);
			}
		};
	}, [open, currentMode]);

	const isDirty = selectedMode !== currentMode;
	const cannotSwitch = hasPosition && selectedMode === "isolated" && currentMode === "cross";

	async function handleConfirm(): Promise<void> {
		if (!isDirty || cannotSwitch) return;
		try {
			await onConfirm(selectedMode);
			setShowSuccess(true);
			autoCloseTimerRef.current = setTimeout(() => {
				onOpenChange(false);
				setShowSuccess(false);
			}, MARGIN_MODE_SUCCESS_DURATION_MS);
		} catch {
			// Error handled by hook
		}
	}

	function handleCancel() {
		setSelectedMode(currentMode);
		onOpenChange(false);
	}

	return (
		<ResponsiveModal open={open} onOpenChange={onOpenChange}>
			<ResponsiveModalContent className="sm:max-w-sm gap-4">
				<ResponsiveModalHeader>
					<ResponsiveModalTitle>
						<Trans>Margin Mode</Trans>
					</ResponsiveModalTitle>
					<ResponsiveModalDescription>
						<Trans>Select how margin is allocated for your positions</Trans>
					</ResponsiveModalDescription>
				</ResponsiveModalHeader>

				<div className="space-y-2">
					{MODE_OPTIONS.map((option) => {
						const isSelected = selectedMode === option.id;
						const isCurrent = currentMode === option.id;
						const Icon = option.icon;

						return (
							<button
								key={option.id}
								type="button"
								onClick={() => setSelectedMode(option.id)}
								disabled={isUpdating}
								className={cn(
									"w-full text-left p-3 rounded-xs border transition-colors",
									isSelected
										? "border-primary-default/50 bg-primary-default/5"
										: "border-border-200/60 hover:border-border-200",
								)}
							>
								<div className="flex gap-3">
									<div
										className={cn(
											"flex items-center justify-center size-8 rounded-xs shrink-0 transition-colors",
											isSelected
												? "bg-primary-default/10 border border-primary-default/30"
												: "bg-surface-execution border border-border-200/60",
										)}
									>
										<Icon
											className={cn("size-4 transition-colors", isSelected ? "text-primary-default" : "text-text-600")}
										/>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<span
												className={cn(
													"text-xs font-medium uppercase tracking-wider",
													isSelected ? "text-primary-default" : "text-text-950",
												)}
											>
												{option.label()}
											</span>
											<div className="flex items-center gap-2">
												{isCurrent && (
													<span className="text-3xs text-text-950 uppercase tracking-wider">
														<Trans>Current</Trans>
													</span>
												)}
												{isSelected && !isCurrent && <CheckIcon className="size-3.5 text-primary-default" />}
											</div>
										</div>
										<p className="text-3xs text-text-950 leading-relaxed">{option.description()}</p>
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{cannotSwitch && (
					<div className="flex items-start gap-2 p-2.5 bg-warning-700/10 border border-warning-700/20 rounded-xs">
						<WarningIcon className="size-3.5 text-warning-700 shrink-0 mt-0.5" />
						<p className="text-xs text-warning-700 leading-relaxed">
							<Trans>Cannot switch to Isolated mode with an open position. Close your position first.</Trans>
						</p>
					</div>
				)}

				{updateError && (
					<div className="flex items-center gap-2 p-2.5 bg-market-down-100 border border-market-down-600/20 rounded-xs text-xs text-market-down-600">
						<WarningIcon className="size-3.5 shrink-0" />
						<span className="flex-1 truncate">{updateError.message || t`Update failed`}</span>
					</div>
				)}

				{showSuccess && (
					<div className="flex items-center justify-center gap-2 p-2.5 bg-market-up-100 border border-market-up-600/20 rounded-xs text-xs text-market-up-600">
						<CheckIcon className="size-3.5" />
						<Trans>Updated</Trans>
					</div>
				)}

				<ResponsiveModalFooter>
					<Button variant="text" size="sm" onClick={handleCancel} disabled={isUpdating}>
						<Trans>Cancel</Trans>
					</Button>
					<TradingActionButton
						onClick={handleConfirm}
						disabled={!isDirty || isUpdating || cannotSwitch || showSuccess}
						className="gap-1.5"
					>
						{isUpdating && <SpinnerGapIcon className="size-3.5 animate-spin" />}
						<Trans>Confirm</Trans>
					</TradingActionButton>
				</ResponsiveModalFooter>
			</ResponsiveModalContent>
		</ResponsiveModal>
	);
}
