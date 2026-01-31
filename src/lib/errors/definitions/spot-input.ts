import { t } from "@lingui/core/macro";
import { ORDER_MIN_NOTIONAL_USD } from "@/config/constants";
import { createValidator, type Validator } from "../types";

export interface SpotInputContext {
	usesLimitPrice: boolean;
	price: number;
	sizeValue: number;
	orderValue: number;
}

export const spotEnterLimitPriceValidator: Validator<SpotInputContext> = createValidator({
	id: "spot-enter-limit-price",
	code: "SPOT_INP_001",
	category: "input",
	priority: 100,
	getMessage: () => t`Enter limit price`,
	validate: (ctx) => !ctx.usesLimitPrice || ctx.price > 0,
});

export const spotEnterSizeValidator: Validator<SpotInputContext> = createValidator({
	id: "spot-enter-size",
	code: "SPOT_INP_002",
	category: "input",
	priority: 101,
	getMessage: () => t`Enter size`,
	validate: (ctx) => ctx.sizeValue > 0,
});

export const spotMinOrderNotionalValidator: Validator<SpotInputContext> = createValidator({
	id: "spot-min-order-notional",
	code: "SPOT_INP_003",
	category: "input",
	priority: 102,
	getMessage: () => t`Min order $${ORDER_MIN_NOTIONAL_USD}`,
	validate: (ctx) => ctx.orderValue <= 0 || ctx.orderValue >= ORDER_MIN_NOTIONAL_USD,
});
