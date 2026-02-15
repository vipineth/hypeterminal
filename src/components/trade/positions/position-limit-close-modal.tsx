import { t } from "@lingui/core/macro";
import { SpinnerGapIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InfoRow } from "@/components/ui/info-row";
import { NumberInput } from "@/components/ui/number-input";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { throwIfAnyResponseError } from "@/domain/trade/orders";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { formatDecimalFloor, getValueColorClass, isPositive, toNumber } from "@/lib/trade/numbers";
import { AssetDisplay } from "../components/asset-display";
import { TradingActionButton } from "../components/trading-action-button";

interface PositionData {
	coin: string;
	assetId: number;
	isLong: boolean;
	size: number;
	entryPx: number;
	markPx: number;
	unrealizedPnl: number;
	roe: number;
	szDecimals: number;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	position: PositionData | null;
}

export function PositionLimitCloseModal({ open, onOpenChange, position }: Props) {
	const [priceInput, setPriceInput] = useState("");
	const [sizeInput, setSizeInput] = useState("");

	const { mutateAsync: placeOrder, isPending: isSubmitting, error, reset: resetError } = useExchangeOrder();

	useEffect(() => {
		if (open && position) {
			const priceDecimals = szDecimalsToPriceDecimals(position.szDecimals);
			setPriceInput(position.markPx.toFixed(priceDecimals));
			setSizeInput(formatDecimalFloor(position.size, position.szDecimals));
		} else if (!open) {
			setPriceInput("");
			setSizeInput("");
		}
	}, [open, position]);

	const priceNum = toNumber(priceInput);
	const sizeNum = toNumber(sizeInput);

	const priceValid = isPositive(priceNum);
	const sizeValid = isPositive(sizeNum) && sizeNum !== null && sizeNum <= (position?.size ?? 0);
	const canSubmit = position && priceValid && sizeValid && !isSubmitting;

	async function handleSubmit() {
		if (!canSubmit || !position || priceNum === null || sizeNum === null) return;

		resetError();

		const { orders, grouping } = buildOrderPlan({
			kind: "limitClose",
			assetId: position.assetId,
			size: sizeNum,
			szDecimals: position.szDecimals,
			isLong: position.isLong,
			price: priceNum,
		});

		try {
			const result = await placeOrder({ orders, grouping });
			throwIfAnyResponseError(result.response?.data?.statuses);

			toast.success(t`Limit close order placed` + (position.coin ? ` — ${position.coin}` : ""));
			setPriceInput("");
			setSizeInput("");
			onOpenChange(false);
		} catch {}
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setPriceInput("");
			setSizeInput("");
			resetError();
		}
		onOpenChange(nextOpen);
	}

	function handleMaxSize() {
		if (!position) return;
		setSizeInput(formatDecimalFloor(position.size, position.szDecimals));
	}

	if (!position) return null;

	const priceDecimals = szDecimalsToPriceDecimals(position.szDecimals);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-5 pt-5 pb-3">
					<DialogTitle className="flex items-center gap-1">
						<AssetDisplay coin={position.coin} />
						<Badge variant={position.isLong ? "long" : "short"} size="sm">
							{position.isLong ? (
								<>
									<TrendUpIcon className="size-3" />
									{t`Long`}
								</>
							) : (
								<>
									<TrendDownIcon className="size-3" />
									{t`Short`}
								</>
							)}
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="px-5 pb-4">
					<div className="rounded-xs border border-border-200/50 bg-surface-analysis p-3 space-y-1 text-2xs">
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
							value={formatPrice(position.markPx, { szDecimals: position.szDecimals })}
							valueClassName="font-medium text-warning-700"
						/>
						<InfoRow
							className="p-0 border-t border-border-200/50 pt-3"
							label={t`Unrealized P&L`}
							value={
								<>
									{formatUSD(position.unrealizedPnl, { signDisplay: "exceptZero" })}
									<span className="font-normal text-text-600 ml-1">({formatPercent(position.roe, 1)})</span>
								</>
							}
							valueClassName={cn("font-semibold", getValueColorClass(position.unrealizedPnl))}
						/>
					</div>
				</div>

				<div className="px-5 pb-4 space-y-3">
					<div className="space-y-1">
						<label htmlFor="limit-price" className="text-2xs text-text-600">{t`Limit Price`}</label>
						<NumberInput
							value={priceInput}
							onChange={(e) => setPriceInput(e.target.value)}
							placeholder="0.00"
							maxAllowedDecimals={priceDecimals}
							inputSize="sm"
							className="w-full"
						/>
					</div>

					<div className="space-y-1">
						<label htmlFor="size" className="text-2xs text-text-600">{t`Size`}</label>
						<NumberInput
							value={sizeInput}
							onChange={(e) => setSizeInput(e.target.value)}
							placeholder="0.00"
							maxAllowedDecimals={position.szDecimals}
							inputSize="sm"
							className="w-full"
							maxLabel={t`Max`}
							onMaxClick={handleMaxSize}
						/>
						{sizeNum !== null && sizeNum > position.size && (
							<p className="text-3xs text-market-down-600">{t`Size exceeds position`}</p>
						)}
					</div>

					{error && (
						<div className="px-2 py-1.5 rounded-xs bg-market-down-100 border border-market-down-600/20 text-3xs text-market-down-600">
							{error.message}
						</div>
					)}
				</div>

				<DialogFooter className="px-5 py-3 border-t border-border-200/50">
					<Button size="sm" variant="text" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
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
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
