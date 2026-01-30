import { walletLoadingValidator, walletNotConnectedValidator } from "../definitions/connection";
import { type WithdrawContext, withdrawInsufficientBalanceValidator, withdrawMinAmountValidator } from "../definitions/deposit";
import { runValidators } from "../types";

export interface WithdrawValidationContext extends WithdrawContext {
	isConnected: boolean;
	isWalletLoading: boolean;
}

export interface WithdrawValidationResult {
	valid: boolean;
	error: string | null;
}

const withdrawValidators = [
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

	if (errors.length === 0) {
		return { valid: true, error: null };
	}

	return { valid: false, error: errors[0].message };
}

export { withdrawValidators };
