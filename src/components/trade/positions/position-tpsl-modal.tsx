import { t } from "@lingui/core/macro";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { isPositive } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
import { TpSlSection } from "../order-entry/tp-sl-section";

interface PositionData {
	coin: string;
	assetIndex: number;
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
			if (isPositive(position.existingTpPrice)) {
				setTpPriceInput(position.existingTpPrice.toFixed(decimals));
			}
			if (isPositive(position.existingSlPrice)) {
				setSlPriceInput(position.existingSlPrice.toFixed(decimals));
			}
		}
	}, [open, position]);

	const tpPriceNum = parseFloat(tpPriceInput) || 0;
	const slPriceNum = parseFloat(slPriceInput) || 0;

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
				a: position.assetIndex,
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
				a: position.assetIndex,
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

			const statuses = result.response?.data?.statuses;
			if (statuses) {
				for (const status of statuses) {
					if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
						throw new Error(status.error);
					}
				}
			}

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

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t`Set TP/SL for ${position.coin}`}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="border border-border/40 rounded-sm p-3 space-y-2 text-2xs">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t`Side`}</span>
							<span className={cn(position.isLong ? "text-terminal-green" : "text-terminal-red")}>
								{position.isLong ? t`Long` : t`Short`}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t`Size`}</span>
							<span className="tabular-nums">
								{formatToken(position.size, position.szDecimals)} {position.coin}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t`Entry`}</span>
							<span className="tabular-nums">{formatPrice(position.entryPx, { szDecimals: position.szDecimals })}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t`Mark`}</span>
							<span className="tabular-nums text-terminal-amber">
								{formatPrice(position.markPx, { szDecimals: position.szDecimals })}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">{t`P&L`}</span>
							<span
								className={cn(
									"tabular-nums",
									position.unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
								)}
							>
								{formatUSD(position.unrealizedPnl, { signDisplay: "exceptZero" })} ({formatPercent(position.roe, 1)})
							</span>
						</div>
					</div>

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

					{error && <div className="text-3xs text-terminal-red">{error.message}</div>}
				</div>

				<DialogFooter className="gap-2">
					<Button size="sm" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
						{t`Cancel`}
					</Button>
					<Button size="sm" variant="terminal" onClick={handleSubmit} disabled={!canSubmit}>
						{isSubmitting && <Loader2 className="size-3 animate-spin mr-2" />}
						{t`Confirm`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
