import { walletLoadingValidator, walletNotConnectedValidator } from "../definitions/connection";
import { type WithdrawContext, withdrawInsufficientBalanceValidator, withdrawMinAmountValidator } from "../definitions/deposit";
import { runValidators, type Validator } from "../types";

export interface WithdrawValidationContext extends WithdrawContext {
	isConnected: boolean;
	isWalletLoading: boolean;
}

export interface WithdrawValidationResult {
	valid: boolean;
	error: string | null;
}

const withdrawValidators: Validator<WithdrawValidationContext>[] = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	withdrawMinAmountValidator,
	withdrawInsufficientBalanceValidator,
];

export function validateWithdraw(context: WithdrawValidationContext): WithdrawValidationResult {
	if (context.amount === 0) {
		return { valid: false, error: null };
	}

	const errors = runValidators(withdrawValidators, context);
	const firstError = errors[0]?.message ?? null;

	return {
		valid: errors.length === 0,
		error: firstError,
	};
}
