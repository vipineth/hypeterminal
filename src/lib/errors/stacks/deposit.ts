import { walletLoadingValidator, walletNotConnectedValidator } from "../definitions/connection";
import { type DepositContext, depositInsufficientBalanceValidator, depositMinAmountValidator } from "../definitions/deposit";
import { runValidators, type Validator } from "../types";

export interface DepositValidationContext extends DepositContext {
	isConnected: boolean;
	isWalletLoading: boolean;
}

export interface DepositValidationResult {
	valid: boolean;
	error: string | null;
}

const depositValidators: Validator<DepositValidationContext>[] = [
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
	const firstError = errors[0]?.message ?? null;

	return {
		valid: errors.length === 0,
		error: firstError,
	};
}
