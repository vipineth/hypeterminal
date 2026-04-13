import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { GearSixIcon, PencilSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { useMarkets, useUserPositions } from "@/lib/hyperliquid";
import type { Position } from "@/lib/hyperliquid/account/use-user-positions";
import { useExchangeUpdateLeverage } from "@/lib/hyperliquid/hooks/exchange/useExchangeUpdateLeverage";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { AssetDisplay } from "../trade/components/asset-display";
import { LeverageSlider } from "../trade/tradebox/leverage-slider";

export function AccountLeverageSettings() {
	const { isConnected } = useConnection();
	const { positions, isLoading } = useUserPositions();
	const isMobile = useIsMobile();

	if (!isConnected) return null;

	if (isLoading) {
		return (
			<Section>
				<SectionHeader />
				<div className="space-y-2 p-4">
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-full" />
				</div>
			</Section>
		);
	}

	if (positions.length === 0) {
		return (
			<Section>
				<SectionHeader />
				<div className="p-6 text-center text-xs text-text-600">
					<Trans>No open positions. Leverage settings appear here when you have active positions.</Trans>
				</div>
			</Section>
		);
	}

	return (
		<Section>
			<SectionHeader />
			{isMobile ? (
				<div className="space-y-2 p-3">
					{positions.map((p) => (
						<LeverageRow key={`${p.coin}-${p.szi}`} position={p} />
					))}
				</div>
			) : (
				<div className="divide-y divide-border-200/40">
					{positions.map((p) => (
						<LeverageRow key={`${p.coin}-${p.szi}`} position={p} />
					))}
				</div>
			)}
		</Section>
	);
}

function Section({ children }: { children: React.ReactNode }) {
	return <div className="rounded-xs border border-border-200 bg-surface-execution overflow-hidden">{children}</div>;
}

function SectionHeader() {
	return (
		<div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-200/40">
			<GearSixIcon className="size-3.5 text-text-600" />
			<span className="text-xs font-medium">
				<Trans>Leverage Settings</Trans>
			</span>
		</div>
	);
}

function LeverageRow({ position }: { position: Position }) {
	const isMobile = useIsMobile();
	const markets = useMarkets();
	const [open, setOpen] = useState(false);

	const currentLeverage = position.leverage.value;
	const marginMode = position.leverage.type as MarginMode;
	const maxLeverage = position.maxLeverage;
	const assetId = markets.getAssetId(position.coin);

	const content = (
		<div className={cn("flex items-center justify-between", isMobile ? "px-3 py-2.5" : "px-4 py-2")}>
			<AssetDisplay coin={position.coin} nameClassName="text-xs" />
			<div className="flex items-center gap-2">
				<span className="text-xs tabular-nums font-medium">{currentLeverage}×</span>
				<Badge variant="neutral" size="sm">
					{marginMode === "isolated" ? t`Isolated` : t`Cross`}
				</Badge>
				<EditTrigger
					open={open}
					onOpenChange={setOpen}
					position={position}
					assetId={assetId}
					maxLeverage={maxLeverage}
					currentLeverage={currentLeverage}
					marginMode={marginMode}
					isMobile={isMobile}
				/>
			</div>
		</div>
	);

	return content;
}

interface EditTriggerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	position: Position;
	assetId: number | undefined;
	maxLeverage: number;
	currentLeverage: number;
	marginMode: MarginMode;
	isMobile: boolean;
}

function EditTrigger({
	open,
	onOpenChange,
	position,
	assetId,
	maxLeverage,
	currentLeverage,
	marginMode,
	isMobile,
}: EditTriggerProps) {
	const editor = (
		<LeverageEditorInline
			coin={position.coin}
			assetId={assetId}
			maxLeverage={maxLeverage}
			currentLeverage={currentLeverage}
			marginMode={marginMode}
			hasPosition
			onClose={() => onOpenChange(false)}
			compact={!isMobile}
		/>
	);

	if (isMobile) {
		return (
			<>
				<Button variant="ghost" size="sm" onClick={() => onOpenChange(true)} aria-label={t`Edit leverage`}>
					<PencilSimpleIcon className="size-3.5 text-text-600" />
				</Button>
				<Sheet open={open} onOpenChange={onOpenChange}>
					<SheetContent side="bottom" className="px-4 pb-8 pt-6">
						<div className="mb-4">
							<AssetDisplay coin={position.coin} nameClassName="text-sm font-semibold" />
						</div>
						{editor}
					</SheetContent>
				</Sheet>
			</>
		);
	}

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" aria-label={t`Edit leverage`}>
					<PencilSimpleIcon className="size-3.5 text-text-600" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-64 p-3">
				{editor}
			</PopoverContent>
		</Popover>
	);
}

interface LeverageEditorInlineProps {
	coin: string;
	assetId: number | undefined;
	maxLeverage: number;
	currentLeverage: number;
	marginMode: MarginMode;
	hasPosition: boolean;
	onClose: () => void;
	compact: boolean;
}

function LeverageEditorInline({
	coin,
	assetId,
	maxLeverage,
	currentLeverage,
	marginMode,
	hasPosition,
	onClose,
	compact,
}: LeverageEditorInlineProps) {
	const [pendingLeverage, setPendingLeverage] = useState<number>(currentLeverage);
	const [inputValue, setInputValue] = useState(String(currentLeverage));
	const { mutateAsync: updateLeverage, isPending, error, reset: resetMutation } = useExchangeUpdateLeverage();

	const isDirty = pendingLeverage !== currentLeverage;

	function handleSliderChange(value: number) {
		const clamped = Math.max(1, Math.min(value, maxLeverage));
		setPendingLeverage(clamped);
		setInputValue(String(clamped));
		resetMutation();
	}

	function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		const raw = e.target.value;
		setInputValue(raw);
		const num = Number.parseInt(raw, 10);
		if (!Number.isNaN(num) && num >= 1 && num <= maxLeverage) {
			setPendingLeverage(num);
			resetMutation();
		}
	}

	function handleInputBlur() {
		const num = Number.parseInt(inputValue, 10);
		if (Number.isNaN(num) || num < 1) {
			setPendingLeverage(1);
			setInputValue("1");
		} else if (num > maxLeverage) {
			setPendingLeverage(maxLeverage);
			setInputValue(String(maxLeverage));
		}
	}

	async function handleConfirm() {
		if (typeof assetId !== "number") return;

		try {
			await updateLeverage({
				asset: assetId,
				isCross: marginMode === "cross",
				leverage: pendingLeverage,
			});
			toast.success(t`Leverage updated to ${pendingLeverage}× for ${coin}`);
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t`Failed to update leverage`);
		}
	}

	async function handleSwitchMode() {
		if (typeof assetId !== "number") return;

		const newMode: MarginMode = marginMode === "cross" ? "isolated" : "cross";

		if (newMode === "isolated" && hasPosition) {
			toast.error(t`Cannot switch to isolated mode with an open position`);
			return;
		}

		try {
			await updateLeverage({
				asset: assetId,
				isCross: newMode === "cross",
				leverage: currentLeverage,
			});
			toast.success(t`Margin mode switched to ${newMode === "cross" ? t`Cross` : t`Isolated`} for ${coin}`);
			onClose();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t`Failed to switch margin mode`);
		}
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
						disabled={isPending}
						allowDecimals={false}
						min={1}
						max={maxLeverage}
						inputSize={compact ? "sm" : "lg"}
						className={cn("text-center font-medium tabular-nums", compact ? "w-12" : "w-16")}
					/>
					<span className={cn("text-text-600", compact ? "text-xs" : "text-base")}>x</span>
				</div>
			</div>

			<LeverageSlider value={pendingLeverage} onChange={handleSliderChange} max={maxLeverage} disabled={isPending} />

			<div className="flex items-center justify-between">
				<span
					className={cn(
						"uppercase tracking-wide text-text-600",
						compact ? "text-2xs font-normal" : "text-xs font-medium",
					)}
				>
					<Trans>Margin Mode</Trans>
				</span>
				<Button variant="outlined" size="sm" onClick={handleSwitchMode} disabled={isPending}>
					{isPending && <SpinnerGapIcon className={cn(iconSize, "animate-spin")} />}
					{marginMode === "cross" ? t`Cross → Isolated` : t`Isolated → Cross`}
				</Button>
			</div>

			{error && (
				<div
					className={cn(
						"flex items-center bg-market-down-100 border border-market-down-600/20 rounded-xs text-market-down-600",
						compact ? "gap-1.5 p-1.5 text-3xs" : "gap-2 p-2.5 text-sm",
					)}
				>
					<span className={compact ? "truncate" : undefined}>
						{error instanceof Error ? error.message : t`Update failed`}
					</span>
				</div>
			)}

			<Button
				variant="outlined"
				size={compact ? "md" : "lg"}
				tone="accent"
				onClick={handleConfirm}
				disabled={!isDirty || isPending}
				className="w-full"
			>
				{isPending && <SpinnerGapIcon className={cn(iconSize, "animate-spin")} />}
				<Trans>Confirm</Trans>
			</Button>
		</div>
	);
}
