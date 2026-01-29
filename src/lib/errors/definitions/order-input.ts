import { t } from "@lingui/core/macro";
import { ORDER_MIN_NOTIONAL_USD } from "@/config/constants";
import { isPositive } from "@/lib/trade/numbers";
import { createValidator, type Validator } from "../types";

export interface OrderInputContext {
	usesLimitPrice: boolean;
	usesTriggerPrice: boolean;
	price: number;
	triggerPriceNum: number | null;
	sizeValue: number;
	orderValue: number;
	maxSize: number;
}

export const enterLimitPriceValidator: Validator<OrderInputContext> = createValidator({
	id: "enter-limit-price",
	code: "INP_001",
	category: "input",
	priority: 100,
	getMessage: () => t`Enter limit price`,
	validate: (ctx) => !ctx.usesLimitPrice || ctx.price > 0,
});

export const enterTriggerPriceValidator: Validator<OrderInputContext> = createValidator({
	id: "enter-trigger-price",
	code: "INP_002",
	category: "input",
	priority: 101,
	getMessage: () => t`Enter trigger price`,
	validate: (ctx) => !ctx.usesTriggerPrice || isPositive(ctx.triggerPriceNum),
});

export const enterSizeValidator: Validator<OrderInputContext> = createValidator({
	id: "enter-size",
	code: "INP_003",
	category: "input",
	priority: 102,
	getMessage: () => t`Enter size`,
	validate: (ctx) => ctx.sizeValue > 0,
});

export const minOrderNotionalValidator: Validator<OrderInputContext> = createValidator({
	id: "min-order-notional",
	code: "INP_004",
	category: "input",
	priority: 103,
	getMessage: () => t`Min order $10`,
	validate: (ctx) => ctx.orderValue <= 0 || ctx.orderValue >= ORDER_MIN_NOTIONAL_USD,
});

export const exceedsMaxSizeValidator: Validator<OrderInputContext> = createValidator({
	id: "exceeds-max-size",
	code: "INP_005",
	category: "input",
	priority: 104,
	getMessage: () => t`Exceeds max size`,
	validate: (ctx) => ctx.maxSize <= 0 || ctx.sizeValue <= ctx.maxSize,
});

export const orderInputValidators: Validator<OrderInputContext>[] = [
	enterLimitPriceValidator,
	enterTriggerPriceValidator,
	enterSizeValidator,
	minOrderNotionalValidator,
	exceedsMaxSizeValidator,
];
