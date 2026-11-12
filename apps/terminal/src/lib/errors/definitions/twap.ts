import { t } from "@lingui/core/macro";
import { TWAP_MIN_NOTIONAL_PER_MINUTE_USD, TWAP_MINUTES_MAX, TWAP_MINUTES_MIN } from "@/config/trade";
import { createValidator, type Validator } from "../types";

export interface TwapContext {
	twapOrder: boolean;
	twapMinutesNum: number | null;
	orderValue: number;
}

export const twapMinutesRangeValidator: Validator<TwapContext> = createValidator({
	id: "twap-minutes-range",
	code: "TWAP_001",
	category: "twap",
	priority: 50,
	getMessage: () => t`TWAP minutes must be ${TWAP_MINUTES_MIN}-${TWAP_MINUTES_MAX}`,
	validate: (ctx) => {
		if (!ctx.twapOrder) return true;
		const minutes = Math.round(ctx.twapMinutesNum ?? 0);
		return minutes >= TWAP_MINUTES_MIN && minutes <= TWAP_MINUTES_MAX;
	},
});

export const twapMinNotionalValidator: Validator<TwapContext> = createValidator({
	id: "twap-min-notional",
	code: "TWAP_002",
	category: "twap",
	priority: 51,
	getMessage: (ctx) => {
		const minutes = Math.round(ctx.twapMinutesNum ?? 0);
		const min = minutes * TWAP_MIN_NOTIONAL_PER_MINUTE_USD;
		return t`TWAP order value too small. Min is $${min}, which is $${TWAP_MIN_NOTIONAL_PER_MINUTE_USD} per minute.`;
	},
	validate: (ctx) => {
		if (!ctx.twapOrder) return true;
		if (ctx.orderValue <= 0) return true;
		const minutes = Math.round(ctx.twapMinutesNum ?? 0);
		if (minutes < TWAP_MINUTES_MIN) return true;
		return ctx.orderValue >= minutes * TWAP_MIN_NOTIONAL_PER_MINUTE_USD;
	},
});
