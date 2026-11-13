import { t } from "@lingui/core/macro";
import { isPositive } from "@/lib/trade/numbers";
import { checkTrigger, type TriggerVerdict } from "@/lib/trade/tpsl";
import type { Side } from "@/lib/trade/types";
import { createValidator, type Validator } from "../types";

export interface TriggerContext {
	usesTriggerPrice: boolean;
	triggerPriceInput: string;
	liveMarkPx: string | null;
	side: Side;
	stopOrder: boolean;
	szDecimals: number;
}

function hasTriggerInput(ctx: TriggerContext): boolean {
	return ctx.usesTriggerPrice && isPositive(ctx.triggerPriceInput);
}

function checkTriggerOrder(ctx: TriggerContext): TriggerVerdict | null {
	if (!hasTriggerInput(ctx) || ctx.liveMarkPx === null) return null;
	return checkTrigger({
		triggerPx: ctx.triggerPriceInput,
		referencePx: ctx.liveMarkPx,
		side: ctx.side === "buy" ? "sell" : "buy",
		tpsl: ctx.stopOrder ? "sl" : "tp",
		szDecimals: ctx.szDecimals,
	});
}

function getTriggerOrderMessage(ctx: TriggerContext): string {
	if (checkTriggerOrder(ctx) === "invalid") return t`Enter a valid trigger price`;
	if (ctx.stopOrder) return ctx.side === "buy" ? t`Stop trigger must be above mark` : t`Stop trigger must be below mark`;
	return ctx.side === "buy" ? t`Take profit trigger must be below mark` : t`Take profit trigger must be above mark`;
}

export const triggerLiveMarkValidator: Validator<TriggerContext> = createValidator({
	id: "trigger-live-mark",
	code: "TRG_005",
	category: "trigger",
	priority: 300,
	getMessage: () => t`Waiting for live mark price`,
	validate: (ctx) => !hasTriggerInput(ctx) || ctx.liveMarkPx !== null,
});

export const triggerPriceValidator: Validator<TriggerContext> = createValidator({
	id: "trigger-price-crossed",
	code: "TRG_001",
	category: "trigger",
	priority: 301,
	getMessage: getTriggerOrderMessage,
	validate: (ctx) => {
		const verdict = checkTriggerOrder(ctx);
		return verdict === null || verdict === "uncrossed";
	},
});
