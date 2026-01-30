import { walletLoadingValidator, walletNotConnectedValidator } from "../definitions/connection";
import { type DepositContext, depositInsufficientBalanceValidator, depositMinAmountValidator } from "../definitions/deposit";
import { runValidators } from "../types";

export interface DepositValidationContext extends DepositContext {
	isConnected: boolean;
	isWalletLoading: boolean;
}

export interface DepositValidationResult {
	valid: boolean;
	error: string | null;
}

const depositValidators = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	depositMinAmountValidator,
	depositInsufficientBalanceValidator,
];

export function validateDeposit(context: DepositValidationContext): DepositValidationResult {
	if (context.amount === 0) {
		return { valid: false, error: null };
	}

	const errors = runValidators(depositValidators, context);

	if (errors.length === 0) {
		return { valid: true, error: null };
	}

	return { valid: false, error: errors[0].message };
}

export { depositValidators };
