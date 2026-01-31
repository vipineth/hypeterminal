import { t } from "@lingui/core/macro";
import { TWAP_MINUTES_MAX, TWAP_MINUTES_MIN } from "@/config/constants";
import { createValidator, type Validator } from "../types";

export interface TwapContext {
	twapOrder: boolean;
	twapMinutesNum: number | null;
}

export const twapMinutesRangeValidator: Validator<TwapContext> = createValidator({
	id: "twap-minutes-range",
	code: "TWAP_001",
	category: "twap",
	priority: 500,
	getMessage: () => t`TWAP minutes must be ${TWAP_MINUTES_MIN}-${TWAP_MINUTES_MAX}`,
	validate: (ctx) => {
		if (!ctx.twapOrder) return true;
		const minutes = Math.round(ctx.twapMinutesNum ?? 0);
		return minutes >= TWAP_MINUTES_MIN && minutes <= TWAP_MINUTES_MAX;
	},
});

export const twapValidators: Validator<TwapContext>[] = [twapMinutesRangeValidator];
