import { t } from "@lingui/core/macro";
import type { TpSl } from "@/domain/trade/orders";
import { isPositive } from "@/lib/trade/numbers";
import { getEntryTriggerReference, isTriggerUncrossed } from "@/lib/trade/tpsl";
import type { Side } from "@/lib/trade/types";
import { createValidator, type Validator } from "../types";

export interface TpSlContext {
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceNum: number | null;
	slPriceNum: number | null;
	price: number;
	markPx: number;
	side: Side;
	szDecimals: number;
}

function isEntryTriggerUncrossed(ctx: TpSlContext, triggerPx: number | null, tpsl: TpSl): boolean {
	const reference = getEntryTriggerReference(ctx.side, ctx.price, ctx.markPx);
	return isTriggerUncrossed({ triggerPx, markPx: reference.px, side: ctx.side, tpsl, szDecimals: ctx.szDecimals });
}

function getTpMessage(ctx: TpSlContext): string {
	const { source } = getEntryTriggerReference(ctx.side, ctx.price, ctx.markPx);
	if (source === "limit") return ctx.side === "buy" ? t`TP must be above limit price` : t`TP must be below limit price`;
	return ctx.side === "buy" ? t`TP must be above mark` : t`TP must be below mark`;
}

function getSlMessage(ctx: TpSlContext): string {
	const { source } = getEntryTriggerReference(ctx.side, ctx.price, ctx.markPx);
	if (source === "limit") return ctx.side === "buy" ? t`SL must be below limit price` : t`SL must be above limit price`;
	return ctx.side === "buy" ? t`SL must be below mark` : t`SL must be above mark`;
}

export const enterTpSlPriceValidator: Validator<TpSlContext> = createValidator({
	id: "enter-tpsl-price",
	code: "TPSL_001",
	category: "tpsl",
	priority: 200,
	getMessage: () => t`Enter TP or SL price`,
	validate: (ctx) => {
		if (!ctx.tpSlEnabled || !ctx.canUseTpSl) return true;
		const hasTp = isPositive(ctx.tpPriceNum);
		const hasSl = isPositive(ctx.slPriceNum);
		return hasTp || hasSl;
	},
});

export const tpPriceValidator: Validator<TpSlContext> = createValidator({
	id: "tp-price-invalid",
	code: "TPSL_002",
	category: "tpsl",
	priority: 201,
	getMessage: getTpMessage,
	validate: (ctx) => {
		if (!ctx.tpSlEnabled || !ctx.canUseTpSl) return true;
		const hasTp = isPositive(ctx.tpPriceNum);
		if (!hasTp) return true;
		return isEntryTriggerUncrossed(ctx, ctx.tpPriceNum, "tp");
	},
});

export const slPriceValidator: Validator<TpSlContext> = createValidator({
	id: "sl-price-invalid",
	code: "TPSL_003",
	category: "tpsl",
	priority: 202,
	getMessage: getSlMessage,
	validate: (ctx) => {
		if (!ctx.tpSlEnabled || !ctx.canUseTpSl) return true;
		const hasSl = isPositive(ctx.slPriceNum);
		if (!hasSl) return true;
		return isEntryTriggerUncrossed(ctx, ctx.slPriceNum, "sl");
	},
});
