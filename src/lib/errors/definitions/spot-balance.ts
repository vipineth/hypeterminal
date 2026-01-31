import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

export interface SpotBalanceContext {
	side: "buy" | "sell";
	sizeValue: number;
	orderValue: number;
	baseAvailable: number;
	quoteAvailable: number;
	baseToken: string;
	quoteToken: string;
}

export const insufficientQuoteBalanceValidator: Validator<SpotBalanceContext> = createValidator({
	id: "spot-insufficient-quote",
	code: "SPOT_BAL_001",
	category: "balance",
	priority: 110,
	getMessage: (ctx) => t`Insufficient ${ctx.quoteToken} balance`,
	validate: (ctx) => {
		if (ctx.side !== "buy" || ctx.orderValue <= 0) return true;
		return ctx.quoteAvailable >= ctx.orderValue;
	},
});

export const insufficientBaseBalanceValidator: Validator<SpotBalanceContext> = createValidator({
	id: "spot-insufficient-base",
	code: "SPOT_BAL_002",
	category: "balance",
	priority: 111,
	getMessage: (ctx) => t`Insufficient ${ctx.baseToken} balance`,
	validate: (ctx) => {
		if (ctx.side !== "sell" || ctx.sizeValue <= 0) return true;
		return ctx.baseAvailable >= ctx.sizeValue;
	},
});
