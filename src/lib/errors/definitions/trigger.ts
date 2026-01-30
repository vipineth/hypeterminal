import { t } from "@lingui/core/macro";
import { isPositive } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";
import { createValidator, type Validator } from "../types";

export interface TriggerContext {
	usesTriggerPrice: boolean;
	triggerPriceNum: number | null;
	markPx: number;
	side: Side;
	stopOrder: boolean;
	takeProfitOrder: boolean;
}

export const stopTriggerAboveMarkValidator: Validator<TriggerContext> = createValidator({
	id: "stop-trigger-above-mark",
	code: "TRG_001",
	category: "trigger",
	priority: 300,
	getMessage: () => t`Stop trigger must be above mark`,
	validate: (ctx) => {
		if (!ctx.usesTriggerPrice || !isPositive(ctx.triggerPriceNum) || ctx.markPx <= 0) return true;
		if (!ctx.stopOrder) return true;
		if (ctx.side !== "buy") return true;
		return ctx.triggerPriceNum > ctx.markPx;
	},
});

export const stopTriggerBelowMarkValidator: Validator<TriggerContext> = createValidator({
	id: "stop-trigger-below-mark",
	code: "TRG_002",
	category: "trigger",
	priority: 301,
	getMessage: () => t`Stop trigger must be below mark`,
	validate: (ctx) => {
		if (!ctx.usesTriggerPrice || !isPositive(ctx.triggerPriceNum) || ctx.markPx <= 0) return true;
		if (!ctx.stopOrder) return true;
		if (ctx.side !== "sell") return true;
		return ctx.triggerPriceNum < ctx.markPx;
	},
});

export const tpTriggerAboveMarkValidator: Validator<TriggerContext> = createValidator({
	id: "tp-trigger-above-mark",
	code: "TRG_003",
	category: "trigger",
	priority: 302,
	getMessage: () => t`Take profit trigger must be above mark`,
	validate: (ctx) => {
		if (!ctx.usesTriggerPrice || !isPositive(ctx.triggerPriceNum) || ctx.markPx <= 0) return true;
		if (!ctx.takeProfitOrder) return true;
		if (ctx.side !== "sell") return true;
		return ctx.triggerPriceNum > ctx.markPx;
	},
});

export const tpTriggerBelowMarkValidator: Validator<TriggerContext> = createValidator({
	id: "tp-trigger-below-mark",
	code: "TRG_004",
	category: "trigger",
	priority: 303,
	getMessage: () => t`Take profit trigger must be below mark`,
	validate: (ctx) => {
		if (!ctx.usesTriggerPrice || !isPositive(ctx.triggerPriceNum) || ctx.markPx <= 0) return true;
		if (!ctx.takeProfitOrder) return true;
		if (ctx.side !== "buy") return true;
		return ctx.triggerPriceNum < ctx.markPx;
	},
});

export const triggerValidators: Validator<TriggerContext>[] = [
	stopTriggerAboveMarkValidator,
	stopTriggerBelowMarkValidator,
	tpTriggerAboveMarkValidator,
	tpTriggerBelowMarkValidator,
];
