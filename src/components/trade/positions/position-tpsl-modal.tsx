import { t } from "@lingui/core/macro";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { isPositive, toNumber } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder, throwIfAnyResponseError } from "@/lib/trade/orders";
import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
import { TokenAvatar } from "../components/token-avatar";
import { TradingActionButton } from "../components/trading-action-button";
import { TpSlSection } from "../order-entry/tp-sl-section";

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
	existingTpPrice?: number;
	existingSlPrice?: number;
	existingTpOrderId?: number;
	existingSlOrderId?: number;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	position: PositionData | null;
}

export function PositionTpSlModal({ open, onOpenChange, position }: Props) {
	const [tpPriceInput, setTpPriceInput] = useState("");
	const [slPriceInput, setSlPriceInput] = useState("");

	const { mutateAsync: placeOrder, isPending: isSubmitting, error, reset: resetError } = useExchangeOrder();

	useEffect(() => {
		if (open && position) {
			const decimals = szDecimalsToPriceDecimals(position.szDecimals);
			setTpPriceInput(isPositive(position.existingTpPrice) ? position.existingTpPrice.toFixed(decimals) : "");
			setSlPriceInput(isPositive(position.existingSlPrice) ? position.existingSlPrice.toFixed(decimals) : "");
		} else if (!open) {
			setTpPriceInput("");
			setSlPriceInput("");
		}
	}, [open, position]);

	const tpPriceNum = toNumber(tpPriceInput);
	const slPriceNum = toNumber(slPriceInput);

	const side = position?.isLong ? "buy" : "sell";
	const referencePrice = position?.entryPx ?? 0;
	const size = position?.size ?? 0;

	const hasTp = isPositive(tpPriceNum);
	const hasSl = isPositive(slPriceNum);
	const tpValid = !hasTp || validateTpPrice(referencePrice, tpPriceNum, side);
	const slValid = !hasSl || validateSlPrice(referencePrice, slPriceNum, side);
	const canSubmit = position && (hasTp || hasSl) && tpValid && slValid && !isSubmitting;

	const tpError = hasTp && !tpValid ? (position?.isLong ? t`TP must be above entry` : t`TP must be below entry`) : null;
	const slError = hasSl && !slValid ? (position?.isLong ? t`SL must be below entry` : t`SL must be above entry`) : null;

	const handleSubmit = useCallback(async () => {
		if (!canSubmit || !position) return;

		resetError();

		const orders: Array<{
			a: number;
			b: boolean;
			p: string;
			s: string;
			r: boolean;
			t: { trigger: { isMarket: boolean; triggerPx: string; tpsl: "tp" | "sl" } };
		}> = [];

		const formattedSize = formatSizeForOrder(position.size, position.szDecimals);

		if (hasTp) {
			orders.push({
				a: position.assetId,
				b: !position.isLong,
				p: formatPriceForOrder(tpPriceNum),
				s: formattedSize,
				r: true,
				t: {
					trigger: {
						isMarket: true,
						triggerPx: formatPriceForOrder(tpPriceNum),
						tpsl: "tp",
					},
				},
			});
		}

		if (hasSl) {
			orders.push({
				a: position.assetId,
				b: !position.isLong,
				p: formatPriceForOrder(slPriceNum),
				s: formattedSize,
				r: true,
				t: {
					trigger: {
						isMarket: true,
						triggerPx: formatPriceForOrder(slPriceNum),
						tpsl: "sl",
					},
				},
			});
		}

		try {
			const result = await placeOrder({ orders, grouping: "positionTpsl" });
			throwIfAnyResponseError(result.response?.data?.statuses);

			setTpPriceInput("");
			setSlPriceInput("");
			onOpenChange(false);
		} catch {
			// error is captured by mutation
		}
	}, [canSubmit, hasSl, hasTp, onOpenChange, placeOrder, position, resetError, slPriceNum, tpPriceNum]);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setTpPriceInput("");
			setSlPriceInput("");
			resetError();
		}
		onOpenChange(nextOpen);
	}

	if (!position) return null;

	const isProfitable = position.unrealizedPnl >= 0;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-5 pt-5 pb-3">
					<DialogTitle className="flex items-center gap-1">
						<TokenAvatar symbol={position.coin} />
						<span className="text-base font-semibold">{position.coin}</span>
						<Badge variant={position.isLong ? "long" : "short"} size="sm">
							{position.isLong ? (
								<>
									<TrendingUp className="size-3" />
									{t`Long`}
								</>
							) : (
								<>
									<TrendingDown className="size-3" />
									{t`Short`}
								</>
							)}
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="px-5 pb-4">
					<div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-2xs text-muted-fg">{t`Size`}</span>
							<span className="text-2xs tabular-nums font-medium">
								{formatToken(position.size, position.szDecimals)} {position.coin}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-2xs text-muted-fg">{t`Entry Price`}</span>
							<span className="text-2xs tabular-nums font-medium">
								{formatPrice(position.entryPx, { szDecimals: position.szDecimals })}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-2xs text-muted-fg">{t`Mark Price`}</span>
							<span className="text-2xs tabular-nums font-medium text-warning">
								{formatPrice(position.markPx, { szDecimals: position.szDecimals })}
							</span>
						</div>
						<div className="border-t border-border/50 pt-3 flex items-center justify-between">
							<span className="text-2xs text-muted-fg">{t`Unrealized P&L`}</span>
							<span
								className={cn("text-2xs tabular-nums font-semibold", isProfitable ? "text-positive" : "text-negative")}
							>
								{formatUSD(position.unrealizedPnl, { signDisplay: "exceptZero" })}
								<span className="font-normal text-muted-fg ml-1">({formatPercent(position.roe, 1)})</span>
							</span>
						</div>
					</div>
				</div>

				<div className="px-5 pb-4">
					<TpSlSection
						side={side}
						referencePrice={referencePrice}
						size={size}
						szDecimals={position.szDecimals}
						tpPrice={tpPriceInput}
						slPrice={slPriceInput}
						onTpPriceChange={setTpPriceInput}
						onSlPriceChange={setSlPriceInput}
						tpError={tpError}
						slError={slError}
					/>

					{error && (
						<div className="mt-3 px-2 py-1.5 rounded-md bg-negative/10 border border-negative/20 text-3xs text-negative">
							{error.message}
						</div>
					)}
				</div>

				<DialogFooter className="px-5 py-3 border-t border-border/50">
					<Button
						size="sm"
						variant="ghost"
						onClick={() => handleOpenChange(false)}
						disabled={isSubmitting}
						className="text-muted-fg hover:text-fg"
					>
						{t`Cancel`}
					</Button>
					<TradingActionButton
						size="sm"
						variant="terminal"
						onClick={handleSubmit}
						disabled={!canSubmit}
						className="min-w-24"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								{t`Submitting...`}
							</>
						) : (
							t`Confirm`
						)}
					</TradingActionButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
