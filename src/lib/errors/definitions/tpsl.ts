import { t } from "@lingui/core/macro";
import { isPositive } from "@/lib/trade/numbers";
import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
import type { Side } from "@/lib/trade/types";
import { createValidator, type Validator } from "../types";

export interface TpSlContext {
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceNum: number | null;
	slPriceNum: number | null;
	price: number;
	side: Side;
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
	getMessage: (ctx) => (ctx.side === "buy" ? t`TP must be above entry` : t`TP must be below entry`),
	validate: (ctx) => {
		if (!ctx.tpSlEnabled || !ctx.canUseTpSl) return true;
		const hasTp = isPositive(ctx.tpPriceNum);
		if (!hasTp) return true;
		return validateTpPrice(ctx.price, ctx.tpPriceNum, ctx.side);
	},
});

export const slPriceValidator: Validator<TpSlContext> = createValidator({
	id: "sl-price-invalid",
	code: "TPSL_003",
	category: "tpsl",
	priority: 202,
	getMessage: (ctx) => (ctx.side === "buy" ? t`SL must be below entry` : t`SL must be above entry`),
	validate: (ctx) => {
		if (!ctx.tpSlEnabled || !ctx.canUseTpSl) return true;
		const hasSl = isPositive(ctx.slPriceNum);
		if (!hasSl) return true;
		return validateSlPrice(ctx.price, ctx.slPriceNum, ctx.side);
	},
});

export const tpSlValidators: Validator<TpSlContext>[] = [enterTpSlPriceValidator, tpPriceValidator, slPriceValidator];
