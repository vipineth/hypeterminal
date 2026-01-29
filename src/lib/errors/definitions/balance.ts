import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

export interface BalanceContext {
	availableBalance: number;
}

export const noBalanceValidator: Validator<BalanceContext> = createValidator({
	id: "no-balance",
	code: "BAL_001",
	category: "balance",
	priority: 30,
	getMessage: () => t`No balance`,
	validate: (ctx) => ctx.availableBalance > 0,
});

export const balanceValidators: Validator<BalanceContext>[] = [noBalanceValidator];
