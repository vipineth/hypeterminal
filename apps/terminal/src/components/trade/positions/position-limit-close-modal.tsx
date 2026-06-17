import { Button, Modal, ModalContent, ModalFooter, ModalHeader, ModalPopup, ModalTitle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { InfoRow } from "@/components/ui/info-row";
import { NumberInput } from "@/components/ui/number-input";
import { PriceInput } from "@/components/ui/price-input";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { throwIfAnyResponseError } from "@/domain/trade/orders";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useExchange, useSubscription } from "@/lib/hyperliquid";
import { formatDecimalFloor, isPositive, toNumber } from "@/lib/trade/numbers";
import { getValueColorClass } from "@/lib/ui/value-color";
import { TradingActionButton } from "../components/trading-action-button";
import type { LimitClosePositionData } from "./position-dialog-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	position: LimitClosePositionData | null;
}

export function PositionLimitCloseModal({ open, onOpenChange, position }: Props) {
	if (!position) return null;
	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size="sm" showClose={false}>
				<PositionLimitCloseModalBody
					key={`${position.assetId}:${open ? "open" : "closed"}`}
					position={position}
					onOpenChange={onOpenChange}
				/>
			</ModalPopup>
		</Modal>
	);
}

interface BodyProps {
	position: LimitClosePositionData;
	onOpenChange: (open: boolean) => void;
}

function PositionLimitCloseModalBody({ position, onOpenChange }: BodyProps) {
	const priceDecimalsInit = szDecimalsToPriceDecimals(position.szDecimals);
	const [priceInput, setPriceInput] = useState(() => position.markPx.toFixed(priceDecimalsInit));
	const [sizeInput, setSizeInput] = useState(() => formatDecimalFloor(position.size, position.szDecimals));
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { mutateAsync: placeOrder, isPending: isSubmitting, error } = useExchange("order");
	const { data: liveCtxEvent } = useSubscription(
		"activeAssetCtx",
		{ coin: position.coin },
		{ enabled: !!position.coin },
	);
	const liveMarkPx = toNumber(liveCtxEvent?.ctx?.markPx) ?? position.markPx;

	const priceNum = toNumber(priceInput);
	const sizeNum = toNumber(sizeInput);

	const priceValid = isPositive(priceNum);
	const sizeValid = isPositive(sizeNum) && sizeNum !== null && sizeNum <= position.size;
	const canSubmit = priceValid && sizeValid && !isSubmitting;

	const estimatedPnl =
		priceNum && sizeNum
			? position.isLong
				? (priceNum - position.entryPx) * sizeNum
				: (position.entryPx - priceNum) * sizeNum
			: null;

	async function handleSubmit() {
		if (!canSubmit || priceNum === null || sizeNum === null) return;

		const { orders, grouping } = buildOrderPlan({
			kind: "limitClose",
			assetId: position.assetId,
			size: sizeNum,
			szDecimals: position.szDecimals,
			isLong: position.isLong,
			price: priceNum,
		});

		setSubmitError(null);
		try {
			const result = await placeOrder({ orders, grouping });
			throwIfAnyResponseError(result.response?.data?.statuses);

			toast.success(t`Limit close order placed` + (position.coin ? ` — ${position.coin}` : ""));
			onOpenChange(false);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`Failed to place limit close order`;
			setSubmitError(message);
			toast.error(message);
		}
	}

	function handleMaxSize() {
		setSizeInput(formatDecimalFloor(position.size, position.szDecimals));
	}

	const priceDecimals = szDecimalsToPriceDecimals(position.szDecimals);
	const visibleError = submitError ?? error?.message;

	return (
		<>
			<ModalHeader>
				<ModalTitle>{t`Limit Close`}</ModalTitle>
			</ModalHeader>

			<ModalContent>
				<div className="rounded-8 border border-stroke-weak bg-surface p-3 space-y-1 text-xs">
					<InfoRow
						className="p-0"
						label={t`Size`}
						value={`${formatToken(position.size, position.szDecimals)} ${position.coin}`}
						valueClassName="font-medium tabular-nums"
					/>
					<InfoRow
						className="p-0"
						label={t`Entry Price`}
						value={formatPrice(position.entryPx, { szDecimals: position.szDecimals })}
						valueClassName="font-medium tabular-nums"
					/>
					<InfoRow
						className="p-0"
						label={t`Mark Price`}
						value={formatPrice(liveMarkPx, { szDecimals: position.szDecimals })}
						valueClassName="font-medium tabular-nums text-warning"
					/>
					<InfoRow
						className="p-0 border-t border-stroke-weak pt-3"
						label={t`Unrealized P&L`}
						value={
							<>
								{formatUSD(position.unrealizedPnl, { signDisplay: "exceptZero" })}
								<span className="font-normal text-fg-muted ml-1">({formatPercent(position.roe, 1)})</span>
							</>
						}
						valueClassName={cn("font-semibold tabular-nums", getValueColorClass(position.unrealizedPnl))}
					/>
				</div>
			</ModalContent>

			<div className="px-4 pb-4 space-y-4">
				<PriceInput
					label={t`Limit Price`}
					value={priceInput}
					onChange={(e) => setPriceInput(e.target.value)}
					onMidClick={setPriceInput}
					placeholder="0.00"
					maxAllowedDecimals={priceDecimals}
					midPrice={liveMarkPx}
					szDecimals={position.szDecimals}
					inputSize="sm"
					className="w-full"
				/>

				<div>
					<NumberInput
						label={t`Size`}
						labelValue={
							<>
								{t`Available`}:{" "}
								<span className="underline decoration-dashed underline-offset-2 decoration-stroke-weak">
									{formatToken(position.size, position.szDecimals)} {position.coin}
								</span>
							</>
						}
						onLabelValueClick={handleMaxSize}
						value={sizeInput}
						onChange={(e) => setSizeInput(e.target.value)}
						placeholder="0.00"
						maxAllowedDecimals={position.szDecimals}
						inputSize="sm"
						className="w-full"
					/>
					{sizeNum !== null && sizeNum > position.size && (
						<p className="text-xs text-error mt-1">{t`Size exceeds position`}</p>
					)}
				</div>

				{estimatedPnl !== null && (
					<InfoRow
						className="p-0 text-xs"
						label={t`Est. P&L at Limit`}
						value={formatUSD(estimatedPnl, { signDisplay: "exceptZero" })}
						valueClassName={cn("font-semibold tabular-nums", getValueColorClass(estimatedPnl))}
					/>
				)}

				{visibleError && (
					<div className="mt-3 px-2 py-1.5 rounded-8 bg-error-soft border border-stroke-error-weak text-xs text-error">
						{visibleError}
					</div>
				)}
			</div>

			<ModalFooter>
				<Button size="sm" variant="ghost" intent="neutral" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
					{t`Cancel`}
				</Button>
				<TradingActionButton onClick={handleSubmit} disabled={!canSubmit} className="min-w-24">
					{isSubmitting ? (
						<>
							<SpinnerGapIcon className="size-3.5 animate-spin" />
							{t`Submitting...`}
						</>
					) : (
						t`Place Limit Close`
					)}
				</TradingActionButton>
			</ModalFooter>
		</>
	);
}
