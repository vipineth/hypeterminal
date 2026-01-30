import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

interface HasAvailableBalance {
	availableBalance: number;
}

export type BalanceContext = HasAvailableBalance;

export const noBalanceValidator: Validator<HasAvailableBalance> = createValidator({
	id: "no-balance",
	code: "BAL_001",
	category: "balance",
	priority: 30,
	getMessage: () => t`No balance`,
	validate: (ctx) => ctx.availableBalance > 0,
});

export const balanceValidators: Validator<BalanceContext>[] = [noBalanceValidator];
