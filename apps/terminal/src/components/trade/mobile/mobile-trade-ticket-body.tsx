import { Button, DrawerTitle, SegmentedControlItem, SegmentedControls, Toggle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsDownUpIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { NumberInput } from "@/components/ui/number-input";
import { PriceInput } from "@/components/ui/price-input";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import type { OrderType } from "@/config/trade";
import { SIZE_PERCENT_OPTIONS } from "@/config/trade";
import { type Collateral, locksOrderEntry } from "@/domain/trade/account-mode";
import { useTradeTicket } from "@/hooks/trade/use-trade-ticket";
import { cn } from "@/lib/cn";
import { formatPrice, formatToken, formatUSD } from "@/lib/format";
import { isPositive, toNumber, truncateDecimals } from "@/lib/trade/numbers";
import {
	canUseTpSl,
	getAdvancedOrderLabel,
	getTabsOrderType,
	isAdvancedOrderType,
	isScaleOrderType,
	isTwapOrderType,
	usesLimitPrice,
	usesTriggerPrice,
} from "@/lib/trade/order-types";
import { useLimitPrice, useOrderEntryActions, useTpSlEnabled, useTriggerPrice } from "@/stores/use-order-entry-store";
import { WalletModal } from "../components/wallet-modal";
import { CollateralNotice } from "../tradebox/collateral-notice";
import { FundDexPrompt } from "../tradebox/fund-dex-prompt";
import { MarginModeModal } from "../tradebox/margin-mode-modal";
import { TradeFormScale } from "../tradebox/trade-form-scale";
import { TradeFormTpSl } from "../tradebox/trade-form-tp-sl";
import { TradeFormTwap } from "../tradebox/trade-form-twap";
import { TradeTicketSummary } from "../tradebox/trade-ticket-summary";
import { MobileTicketAdvanced } from "./mobile-ticket-advanced";
import { MobileTicketRow } from "./mobile-ticket-row";

const SIZE_CHIPS = SIZE_PERCENT_OPTIONS.filter((pct) => pct > 0);

interface Props {
	onSubmitted: () => void;
}

export function MobileTradeTicketBody({ onSubmitted }: Props) {
	const sizeFieldId = useId();
	const ticket = useTradeTicket({ onSubmitted });
	const { market, entry, orderType, side, validation, buttonContent } = ticket;
	const [advancedOpen, setAdvancedOpen] = useState(() => isAdvancedOrderType(orderType));

	const limitPriceInput = useLimitPrice();
	const triggerPriceInput = useTriggerPrice();
	const tpSlEnabled = useTpSlEnabled();
	const { setOrderType, setLimitPrice, setTriggerPrice, setTpSlEnabled } = useOrderEntryActions();

	const isFormDisabled = !ticket.isConnected || locksOrderEntry(entry.shortfall);
	const isSpot = entry.isSpotMarket;
	const szDecimals = entry.szDecimals;
	const priceDecimals = market?.priceDecimals;
	const sideLabel = entry.sideLabels[side];
	const isSubmitAction = buttonContent.variant === "buy" || buttonContent.variant === "sell";
	const showTpSl = entry.capabilities.hasTpSl && canUseTpSl(orderType);
	const hasSize = entry.sizeValue > 0;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex items-center gap-3 pl-3 pr-14 pt-5 pb-3">
				<div className="min-w-0 flex-1">
					<DrawerTitle
						className={cn("flex-none text-sm font-semibold", side === "buy" ? "text-market-up" : "text-market-down")}
					>
						{sideLabel} {entry.assetLabel}
					</DrawerTitle>
					<div className="text-2xs tabular-nums text-fg-muted">
						{t`Mark`} {formatPrice(market?.markPx, { decimals: priceDecimals })}
					</div>
				</div>
				<SegmentedControls
					size="xs"
					value={getTabsOrderType(orderType)}
					onValueChange={(value) => setOrderType(value as OrderType)}
				>
					<SegmentedControlItem value="market">{t`Market`}</SegmentedControlItem>
					<SegmentedControlItem value="limit">{t`Limit`}</SegmentedControlItem>
				</SegmentedControls>
			</div>

			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-3">
				{usesTriggerPrice(orderType) && (
					<PriceInput
						label={t`Trigger Price`}
						placeholder="0.00"
						value={triggerPriceInput}
						onChange={(e) => setTriggerPrice(e.target.value)}
						onMidClick={setTriggerPrice}
						midPrice={ticket.markPx}
						priceDecimals={priceDecimals}
						inputSize="lg"
						className={cn(
							"w-full tabular-nums",
							!isPositive(toNumber(triggerPriceInput)) &&
								hasSize &&
								"border-stroke-error-strong focus:border-stroke-error-strong",
						)}
						disabled={isFormDisabled}
					/>
				)}

				{usesLimitPrice(orderType) && (
					<PriceInput
						label={t`Limit Price`}
						placeholder="0.00"
						value={limitPriceInput}
						onChange={(e) => setLimitPrice(e.target.value)}
						onMidClick={setLimitPrice}
						midPrice={ticket.markPx}
						priceDecimals={priceDecimals}
						inputSize="lg"
						className={cn(
							"w-full tabular-nums",
							!ticket.price && hasSize && "border-stroke-error-strong focus:border-stroke-error-strong",
						)}
						disabled={isFormDisabled}
					/>
				)}

				<div className="flex flex-col gap-2">
					<div className="flex items-baseline justify-between gap-2 text-2xs">
						<label htmlFor={sizeFieldId} className="text-fg-muted">
							{t`Size`}
						</label>
						<span className="flex items-baseline gap-1 tabular-nums text-fg-muted">
							{t`Available`}
							<AvailableBalance
								isConnected={ticket.isConnected}
								status={entry.collateral.status}
								formatted={formatToken(entry.availableBalance, {
									decimals: isSpot && side === "sell" ? szDecimals : 2,
									symbol: entry.availableBalanceToken ?? undefined,
								})}
							/>
						</span>
					</div>
					<div className="relative">
						<NumberInput
							id={sizeFieldId}
							inputSize="xl"
							placeholder="0.00"
							value={entry.sizeInput}
							onChange={(e) => entry.setSizeInput(e.target.value)}
							maxAllowedDecimals={entry.sizeInputDecimals}
							className="w-full pr-24 font-medium tabular-nums"
							disabled={isFormDisabled}
						/>
						<Button
							variant="ghost"
							intent="neutral"
							size="sm"
							className="absolute right-1.5 top-1/2 -translate-y-1/2 touch-hitbox"
							onClick={ticket.handleSizeModeToggle}
							aria-label={t`Toggle size unit`}
							disabled={isFormDisabled}
							iconRight={<ArrowsDownUpIcon className="size-3" />}
						>
							{entry.sizeModeLabel}
						</Button>
					</div>
					<div className="mt-1 grid grid-cols-4 gap-1.5">
						{SIZE_CHIPS.map((pct) => (
							<Button
								key={pct}
								variant="ghost"
								intent="neutral"
								size="xxs"
								className="touch-hitbox bg-fill-weak tabular-nums text-fg-muted"
								onClick={() => ticket.handleSizePercentApply(pct)}
								disabled={isFormDisabled || entry.maxSize <= 0}
							>
								{pct === 100 ? t`Max` : `${pct}%`}
							</Button>
						))}
					</div>
					{hasSize && (
						<div className="text-2xs tabular-nums text-fg-muted">
							≈{" "}
							{ticket.sizeMode === "base"
								? formatUSD(entry.orderValue)
								: `${truncateDecimals(entry.sizeValue, szDecimals)} ${entry.baseToken}`}
						</div>
					)}
				</div>

				{isScaleOrderType(orderType) && (
					<TradeFormScale markPx={ticket.markPx} priceDecimals={priceDecimals} disabled={isFormDisabled} />
				)}

				{isTwapOrderType(orderType) && <TradeFormTwap disabled={isFormDisabled} />}

				<div className="rounded-xs border border-stroke-weak divide-y divide-stroke-weak/40">
					{entry.capabilities.isLeveraged && (
						<MobileTicketRow
							label={t`Leverage`}
							hint={entry.marginMode === "isolated" ? t`Isolated` : t`Cross`}
							value={
								<>
									<span className="block">{entry.leverage}×</span>
									{ticket.liqPrice !== null && (
										<span
											className={cn("block text-2xs font-normal", ticket.liqWarning ? "text-warning" : "text-fg-muted")}
										>
											{t`Liq`} {formatPrice(ticket.liqPrice, { decimals: priceDecimals })}
										</span>
									)}
								</>
							}
							onClick={ticket.openMarginModal}
						/>
					)}
					{showTpSl && (
						<div>
							<MobileTicketRow
								label={t`Auto close`}
								hint={t`Take profit / stop loss`}
								trailing={
									<Toggle
										size="xxs"
										checked={tpSlEnabled}
										onCheckedChange={setTpSlEnabled}
										disabled={isFormDisabled}
										aria-label={t`Take Profit / Stop Loss`}
									/>
								}
							/>
							{tpSlEnabled && (
								<div className="border-t border-stroke-weak/40 px-3 py-3">
									<TradeFormTpSl
										referencePrice={ticket.price}
										size={entry.sizeValue}
										priceDecimals={priceDecimals}
										disabled={isFormDisabled}
									/>
								</div>
							)}
						</div>
					)}
					<div>
						<MobileTicketRow
							label={t`Advanced`}
							hint={isSpot ? t`TWAP, Scale & more` : t`Stop, TWAP, Scale, TIF & more`}
							value={getAdvancedOrderLabel(orderType, t`Off`)}
							expanded={advancedOpen}
							onClick={() => setAdvancedOpen(!advancedOpen)}
						/>
						{advancedOpen && (
							<MobileTicketAdvanced
								orderType={orderType}
								isSpot={isSpot}
								hasReduceOnly={entry.capabilities.hasReduceOnly}
								disabled={isFormDisabled}
							/>
						)}
					</div>
				</div>

				<TradeTicketSummary ticket={ticket} layout="grid" />
			</div>

			<div className="shrink-0 flex flex-col gap-2 border-t border-stroke-weak/60 px-3 pt-2 pb-3">
				{ticket.isConnected && <CollateralNotice collateral={entry.collateral} className="text-2xs" />}
				{ticket.isConnected && <FundDexPrompt collateral={entry.collateral} need={ticket.fundingNeed} />}
				{validation.errors.length > 0 && ticket.showValidationErrors && (
					<div className="text-2xs text-error">{validation.errors.join(" • ")}</div>
				)}
				{ticket.approvalError && <div className="text-2xs text-error">{ticket.approvalError}</div>}
				<Button
					variant="filled"
					size="md"
					intent={buttonContent.variant === "sell" ? "error" : "brand"}
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					className={cn(
						"w-full touch-hitbox",
						buttonContent.variant === "buy" && "bg-success text-background hover:opacity-90",
						buttonContent.variant === "sell" && "text-background",
					)}
					iconLeft={
						ticket.isSubmitting || ticket.isRegistering ? <SpinnerGapIcon className="size-3 animate-spin" /> : undefined
					}
				>
					{isSubmitAction ? `${sideLabel} ${entry.assetLabel}` : buttonContent.text}
				</Button>
			</div>

			<MarginModeModal {...ticket.marginModalProps} />
			<WalletModal {...ticket.walletModalProps} />
		</div>
	);
}

function AvailableBalance({
	isConnected,
	status,
	formatted,
}: {
	isConnected: boolean;
	status: Collateral["status"];
	formatted: string;
}) {
	if (!isConnected) return <span className="text-fg">{FALLBACK_VALUE_PLACEHOLDER}</span>;
	if (status === "unavailable") return <span>{t`Unavailable`}</span>;
	if (status === "pending")
		return (
			<span
				role="status"
				aria-label={t`Loading`}
				className="inline-block h-2.5 w-16 self-center rounded-xs bg-fill-weak animate-pulse"
			/>
		);
	return <span className="text-fg">{formatted}</span>;
}
