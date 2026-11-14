import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

interface HasAvailableBalance {
	availableBalance: number;
}

interface HasCollateralStatus {
	collateralPending: boolean;
}

export const collateralPendingValidator: Validator<HasCollateralStatus> = createValidator({
	id: "collateral-pending",
	code: "BAL_002",
	category: "balance",
	priority: 29,
	getMessage: () => t`Checking margin…`,
	validate: (ctx) => !ctx.collateralPending,
});

export const noBalanceValidator: Validator<HasAvailableBalance> = createValidator({
	id: "no-balance",
	code: "BAL_001",
	category: "balance",
	priority: 30,
	getMessage: () => t`No balance`,
	validate: (ctx) => ctx.availableBalance > 0,
});
