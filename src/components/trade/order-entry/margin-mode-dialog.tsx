import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { AlertTriangle, Check, Layers, Loader2, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { MarginMode } from "@/lib/trade/margin-mode";

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
	icon: typeof Layers;
}> = [
	{
		id: "cross",
		label: () => t`Cross`,
		description: () =>
			t`All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.`,
		icon: Layers,
	},
	{
		id: "isolated",
		label: () => t`Isolated`,
		description: () =>
			t`Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.`,
		icon: Shield,
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
		}
	}, [open, currentMode]);

	useEffect(() => {
		return () => {
			if (autoCloseTimerRef.current) {
				clearTimeout(autoCloseTimerRef.current);
			}
		};
	}, []);

	const isDirty = selectedMode !== currentMode;
	const cannotSwitch = hasPosition && selectedMode === "isolated" && currentMode === "cross";

	async function handleConfirm() {
		if (!isDirty || cannotSwitch) return;
		try {
			await onConfirm(selectedMode);
			setShowSuccess(true);
			autoCloseTimerRef.current = setTimeout(() => {
				onOpenChange(false);
				setShowSuccess(false);
			}, 1000);
		} catch {
			// Error handled by hook
		}
	}

	function handleCancel() {
		setSelectedMode(currentMode);
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm gap-4">
				<DialogHeader>
					<DialogTitle className="font-medium">
						<Trans>Margin Mode</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>Select how margin is allocated for your positions</Trans>
					</DialogDescription>
				</DialogHeader>

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
									"w-full text-left p-3 rounded-sm border transition-colors",
									isSelected ? "border-terminal-cyan/50 bg-terminal-cyan/5" : "border-border/60 hover:border-border",
								)}
							>
								<div className="flex gap-3">
									<div
										className={cn(
											"flex items-center justify-center size-8 rounded-sm shrink-0 transition-colors",
											isSelected
												? "bg-terminal-cyan/10 border border-terminal-cyan/30"
												: "bg-surface border border-border/60",
										)}
									>
										<Icon
											className={cn(
												"size-4 transition-colors",
												isSelected ? "text-terminal-cyan" : "text-muted-foreground",
											)}
										/>
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between mb-1">
											<span
												className={cn(
													"text-xs font-medium uppercase tracking-wider",
													isSelected ? "text-terminal-cyan" : "text-foreground",
												)}
											>
												{option.label()}
											</span>
											<div className="flex items-center gap-2">
												{isCurrent && (
													<span className="text-3xs text-muted-foreground uppercase tracking-wider">
														<Trans>Current</Trans>
													</span>
												)}
												{isSelected && !isCurrent && <Check className="size-3.5 text-terminal-cyan" />}
											</div>
										</div>
										<p className="text-3xs text-muted-foreground leading-relaxed">{option.description()}</p>
									</div>
								</div>
							</button>
						);
					})}
				</div>

				{cannotSwitch && (
					<div className="flex items-start gap-2 p-2.5 bg-terminal-amber/10 border border-terminal-amber/20 rounded-sm">
						<AlertTriangle className="size-3.5 text-terminal-amber shrink-0 mt-0.5" />
						<p className="text-xs text-terminal-amber leading-relaxed">
							<Trans>Cannot switch to Isolated mode with an open position. Close your position first.</Trans>
						</p>
					</div>
				)}

				{updateError && (
					<div className="flex items-center gap-2 p-2.5 bg-terminal-red/10 border border-terminal-red/20 rounded-sm text-xs text-terminal-red">
						<AlertTriangle className="size-3.5 shrink-0" />
						<span className="truncate">{updateError.message || t`Update failed`}</span>
					</div>
				)}

				{showSuccess && (
					<div className="flex items-center justify-center gap-2 p-2.5 bg-terminal-green/10 border border-terminal-green/20 rounded-sm text-xs text-terminal-green">
						<Check className="size-3.5" />
						<Trans>Updated</Trans>
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={handleCancel} disabled={isUpdating}>
						<Trans>Cancel</Trans>
					</Button>
					<Button
						variant="terminal"
						size="sm"
						onClick={handleConfirm}
						disabled={!isDirty || isUpdating || cannotSwitch || showSuccess}
						className="gap-1.5"
					>
						{isUpdating && <Loader2 className="size-3.5 animate-spin" />}
						<Trans>Confirm</Trans>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
