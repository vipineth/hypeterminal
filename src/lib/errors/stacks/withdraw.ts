import { type Validator, runValidators } from "../types";
import {
	walletNotConnectedValidator,
	walletLoadingValidator,
	type ConnectionContext,
} from "../definitions/connection";
import {
	withdrawMinAmountValidator,
	withdrawInsufficientBalanceValidator,
	type WithdrawContext,
} from "../definitions/deposit";

export type WithdrawValidationContext = Pick<ConnectionContext, "isConnected" | "isWalletLoading"> & WithdrawContext;

export interface WithdrawValidationResult {
	valid: boolean;
	error: string | null;
}

const withdrawValidators: Validator<WithdrawValidationContext>[] = [
	walletNotConnectedValidator as Validator<WithdrawValidationContext>,
	walletLoadingValidator as Validator<WithdrawValidationContext>,
	withdrawMinAmountValidator as Validator<WithdrawValidationContext>,
	withdrawInsufficientBalanceValidator as Validator<WithdrawValidationContext>,
];

export function validateWithdraw(context: WithdrawValidationContext): WithdrawValidationResult {
	if (context.amount === 0) {
		return { valid: false, error: null };
	}

	const errors = runValidators(withdrawValidators, context);

	if (errors.length === 0) {
		return { valid: true, error: null };
	}

	return { valid: false, error: errors[0].message };
}
