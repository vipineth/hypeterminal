import { t } from "@lingui/core/macro";
import { ORDER_MIN_NOTIONAL_USD, SCALE_LEVELS_MAX, SCALE_LEVELS_MIN } from "@/config/constants";
import { clampInt, isPositive } from "@/lib/trade/numbers";
import { createValidator, type Validator } from "../types";

export interface ScaleContext {
	scaleOrder: boolean;
	scaleStartPriceNum: number | null;
	scaleEndPriceNum: number | null;
	scaleLevelsNum: number | null;
	sizeValue: number;
	price: number;
	markPx: number;
}

export const enterPriceRangeValidator: Validator<ScaleContext> = createValidator({
	id: "enter-price-range",
	code: "SCL_001",
	category: "scale",
	priority: 400,
	getMessage: () => t`Enter price range`,
	validate: (ctx) => {
		if (!ctx.scaleOrder) return true;
		return isPositive(ctx.scaleStartPriceNum) && isPositive(ctx.scaleEndPriceNum);
	},
});

export const scaleLevelsRangeValidator: Validator<ScaleContext> = createValidator({
	id: "scale-levels-range",
	code: "SCL_002",
	category: "scale",
	priority: 401,
	getMessage: () => t`Scale levels must be ${SCALE_LEVELS_MIN}-${SCALE_LEVELS_MAX}`,
	validate: (ctx) => {
		if (!ctx.scaleOrder) return true;
		const levels = clampInt(Math.round(ctx.scaleLevelsNum ?? 0), 0, 100);
		return levels >= SCALE_LEVELS_MIN && levels <= SCALE_LEVELS_MAX;
	},
});

export const scaleStartEndDifferValidator: Validator<ScaleContext> = createValidator({
	id: "scale-start-end-differ",
	code: "SCL_003",
	category: "scale",
	priority: 402,
	getMessage: () => t`Start and end must differ`,
	validate: (ctx) => {
		if (!ctx.scaleOrder) return true;
		if (!isPositive(ctx.scaleStartPriceNum) || !isPositive(ctx.scaleEndPriceNum)) return true;
		return ctx.scaleStartPriceNum !== ctx.scaleEndPriceNum;
	},
});

export const scaleLevelMinNotionalValidator: Validator<ScaleContext> = createValidator({
	id: "scale-level-min-notional",
	code: "SCL_004",
	category: "scale",
	priority: 403,
	getMessage: () => t`Scale level below min notional`,
	validate: (ctx) => {
		if (!ctx.scaleOrder) return true;
		const levels = clampInt(Math.round(ctx.scaleLevelsNum ?? 0), 0, 100);
		if (levels < 2 || ctx.sizeValue <= 0) return true;

		const averagePrice = ctx.price > 0 ? ctx.price : ctx.markPx;
		const perLevelSize = ctx.sizeValue / levels;
		const perLevelNotional = averagePrice > 0 ? perLevelSize * averagePrice : 0;

		return perLevelNotional <= 0 || perLevelNotional >= ORDER_MIN_NOTIONAL_USD;
	},
});

export const scaleValidators: Validator<ScaleContext>[] = [
	enterPriceRangeValidator,
	scaleLevelsRangeValidator,
	scaleStartEndDifferValidator,
	scaleLevelMinNotionalValidator,
];
