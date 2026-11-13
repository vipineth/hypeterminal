import { Button, Modal, ModalContent, ModalFooter, ModalHeader, ModalPopup, ModalTitle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { InfoRow } from "@/components/ui/info-row";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import type { TpSl } from "@/domain/trade/orders";
import { useLiveMarkPx } from "@/hooks/trade/use-live-mark-px";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { getTriggerMessage } from "@/lib/errors/definitions/tpsl";
import { isPositive } from "@/lib/trade/numbers";
import { checkTrigger } from "@/lib/trade/tpsl";
import { getValueColorClass } from "@/lib/ui/value-color";
import { AssetDisplay } from "../components/asset-display";
import { TradingActionButton } from "../components/trading-action-button";
import { TpSlSection } from "../tradebox/tp-sl-section";
import type { TpSlPositionData } from "./position-dialog-types";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	position: TpSlPositionData | null;
}

export function PositionTpSlModal({ open, onOpenChange, position }: Props) {
	if (!position) return null;
	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalPopup size="sm" showClose={false} aria-label={getTpSlModalAriaLabel(position)}>
				<PositionTpSlModalBody
					key={`${position.assetId}:${open ? "open" : "closed"}`}
					position={position}
					onOpenChange={onOpenChange}
				/>
			</ModalPopup>
		</Modal>
	);
}

interface BodyProps {
	position: TpSlPositionData;
	onOpenChange: (open: boolean) => void;
}

function PositionTpSlModalBody({ position, onOpenChange }: BodyProps) {
	const decimals = szDecimalsToPriceDecimals(position.szDecimals);
	const [tpPriceInput, setTpPriceInput] = useState(
		position.existingTpPrice ? position.existingTpPrice.toFixed(decimals) : "",
	);
	const [slPriceInput, setSlPriceInput] = useState(
		position.existingSlPrice ? position.existingSlPrice.toFixed(decimals) : "",
	);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { submitPlan, isSubmitting } = useSubmitPlan();
	const markPx = useLiveMarkPx(position.coin);

	const side = position.isLong ? "buy" : "sell";
	const size = position.size;
	const hasTp = isPositive(tpPriceInput);
	const hasSl = isPositive(slPriceInput);

	const tpError = getPositionTriggerError(tpPriceInput, "tp", markPx, position);
	const slError = getPositionTriggerError(slPriceInput, "sl", markPx, position);
	const blockedReason = getConfirmBlockedReason(markPx, hasTp || hasSl);
	const canSubmit = !blockedReason && !tpError && !slError && !isSubmitting;

	async function handleSubmit() {
		if (!canSubmit) return;

		const plan = buildOrderPlan({
			kind: "positionTpsl",
			assetId: position.assetId,
			szDecimals: position.szDecimals,
			isLong: position.isLong,
			tpPriceInput: hasTp ? tpPriceInput : null,
			slPriceInput: hasSl ? slPriceInput : null,
		});

		if (plan.errors.length > 0) return;

		setSubmitError(null);
		const result = await submitPlan(plan);
		if (result.ok) {
			onOpenChange(false);
		} else {
			const message = result.error || t`Failed to update TP/SL orders`;
			setSubmitError(message);
			toast.error(message);
		}
	}

	const visibleError = submitError;

	return (
		<>
			<ModalHeader>
				<ModalTitle>{t`Manage TP/SL`}</ModalTitle>
				<div className="flex items-center gap-1.5">
					<span
						className={cn("h-4 w-0.5 shrink-0 rounded-full", position.isLong ? "bg-success" : "bg-error")}
						aria-hidden="true"
					/>
					<AssetDisplay coin={position.coin} />
					<span className="text-xs text-fg-muted">· {position.isLong ? t`Long position` : t`Short position`}</span>
				</div>
			</ModalHeader>

			<ModalContent>
				<div className="rounded-8 border border-stroke-weak bg-surface p-3 space-y-1 text-xs">
					<InfoRow
						className="p-0"
						label={t`Size`}
						value={`${formatToken(position.size, position.szDecimals)} ${position.coin}`}
						valueClassName="font-medium"
					/>
					<InfoRow
						className="p-0"
						label={t`Entry Price`}
						value={formatPrice(position.entryPx, { szDecimals: position.szDecimals })}
						valueClassName="font-medium"
					/>
					<InfoRow
						className="p-0"
						label={t`Mark Price`}
						value={formatPrice(markPx, { szDecimals: position.szDecimals })}
						valueClassName="font-medium text-warning"
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
						valueClassName={cn("font-semibold", getValueColorClass(position.unrealizedPnl))}
					/>
				</div>
			</ModalContent>

			<div className="px-4 pb-4">
				<TpSlSection
					side={side}
					referencePrice={position.entryPx}
					size={size}
					szDecimals={position.szDecimals}
					tpPrice={tpPriceInput}
					slPrice={slPriceInput}
					onTpPriceChange={setTpPriceInput}
					onSlPriceChange={setSlPriceInput}
					tpError={tpError}
					slError={slError}
				/>

				{blockedReason && <p className="mt-3 text-xs text-fg-muted">{blockedReason}</p>}

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
						t`Confirm`
					)}
				</TradingActionButton>
			</ModalFooter>
		</>
	);
}

function getPositionTriggerError(
	triggerPx: string,
	tpsl: TpSl,
	markPx: string | null,
	position: TpSlPositionData,
): string | null {
	if (markPx === null || !isPositive(triggerPx)) return null;
	const side = position.isLong ? "buy" : "sell";
	const verdict = checkTrigger({ triggerPx, referencePx: markPx, side, tpsl, szDecimals: position.szDecimals });
	return getTriggerMessage({ verdict, tpsl, side, source: "mark" });
}

function getConfirmBlockedReason(markPx: string | null, hasTrigger: boolean): string | null {
	if (markPx === null) return t`Waiting for live mark price`;
	if (!hasTrigger) return t`Enter TP or SL price`;
	return null;
}

function getTpSlModalAriaLabel(position: TpSlPositionData): string {
	if (position.isLong) return t`Manage TP/SL for ${position.coin} long position`;
	return t`Manage TP/SL for ${position.coin} short position`;
}
