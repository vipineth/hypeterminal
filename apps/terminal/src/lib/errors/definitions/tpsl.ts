import { t } from "@lingui/core/macro";
import type { TpSl } from "@/domain/trade/orders";
import { isPositive } from "@/lib/trade/numbers";
import { checkTrigger, type EntryTriggerReference, getEntryTriggerReference, type TriggerVerdict } from "@/lib/trade/tpsl";
import type { Side } from "@/lib/trade/types";
import { createValidator, type Validator } from "../types";

export interface TpSlContext {
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceInput: string;
	slPriceInput: string;
	usesLimitPrice: boolean;
	limitPriceInput: string;
	liveMarkPx: string | null;
	side: Side;
	szDecimals: number;
}

interface TriggerCopy {
	verdict: TriggerVerdict;
	tpsl: TpSl;
	side: Side;
	source: EntryTriggerReference["source"];
}

export function getTriggerMessage({ verdict, tpsl, side, source }: TriggerCopy): string | null {
	if (verdict === "uncrossed") return null;
	if (verdict === "invalid") return tpsl === "tp" ? t`Enter a valid TP price` : t`Enter a valid SL price`;
	if (source === "limit") {
		if (tpsl === "tp") return side === "buy" ? t`TP must be above limit price` : t`TP must be below limit price`;
		return side === "buy" ? t`SL must be below limit price` : t`SL must be above limit price`;
	}
	if (tpsl === "tp") return side === "buy" ? t`TP must be above mark` : t`TP must be below mark`;
	return side === "buy" ? t`SL must be below mark` : t`SL must be above mark`;
}

function hasTpSlInput(ctx: TpSlContext): boolean {
	return ctx.tpSlEnabled && ctx.canUseTpSl && (isPositive(ctx.tpPriceInput) || isPositive(ctx.slPriceInput));
}

function checkEntryTrigger(ctx: TpSlContext, tpsl: TpSl): TriggerCopy | null {
	const triggerPx = tpsl === "tp" ? ctx.tpPriceInput : ctx.slPriceInput;
	if (!ctx.tpSlEnabled || !ctx.canUseTpSl || !isPositive(triggerPx) || ctx.liveMarkPx === null) return null;
	const reference = getEntryTriggerReference({
		side: ctx.side,
		limitPriceInput: ctx.usesLimitPrice ? ctx.limitPriceInput : null,
		markPx: ctx.liveMarkPx,
		szDecimals: ctx.szDecimals,
	});
	const verdict = checkTrigger({ triggerPx, referencePx: reference.px, side: ctx.side, tpsl, szDecimals: ctx.szDecimals });
	return { verdict, tpsl, side: ctx.side, source: reference.source };
}

function createTriggerValidator(tpsl: TpSl, id: string, code: string, priority: number): Validator<TpSlContext> {
	return createValidator({
		id,
		code,
		category: "tpsl",
		priority,
		getMessage: (ctx) => {
			const check = checkEntryTrigger(ctx, tpsl);
			return (check && getTriggerMessage(check)) ?? "";
		},
		validate: (ctx) => {
			const check = checkEntryTrigger(ctx, tpsl);
			return !check || check.verdict === "uncrossed";
		},
	});
}

export const enterTpSlPriceValidator: Validator<TpSlContext> = createValidator({
	id: "enter-tpsl-price",
	code: "TPSL_001",
	category: "tpsl",
	priority: 200,
	getMessage: () => t`Enter TP or SL price`,
	validate: (ctx) => !ctx.tpSlEnabled || !ctx.canUseTpSl || hasTpSlInput(ctx),
});

export const tpSlLiveMarkValidator: Validator<TpSlContext> = createValidator({
	id: "tpsl-live-mark",
	code: "TPSL_004",
	category: "tpsl",
	priority: 201,
	getMessage: () => t`Waiting for live mark price`,
	validate: (ctx) => !hasTpSlInput(ctx) || ctx.liveMarkPx !== null,
});

export const tpPriceValidator = createTriggerValidator("tp", "tp-price-invalid", "TPSL_002", 202);

export const slPriceValidator = createTriggerValidator("sl", "sl-price-invalid", "TPSL_003", 203);
