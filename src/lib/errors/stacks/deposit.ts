import { type Validator, runValidators, type ValidationError } from "../types";
import {
	walletNotConnectedValidator,
	walletLoadingValidator,
	type ConnectionContext,
} from "../definitions/connection";
import {
	depositMinAmountValidator,
	depositInsufficientBalanceValidator,
	type DepositContext,
} from "../definitions/deposit";

export type DepositValidationContext = Pick<ConnectionContext, "isConnected" | "isWalletLoading"> & DepositContext;

export interface DepositValidationResult {
	valid: boolean;
	error: string | null;
}

const depositValidators: Validator<DepositValidationContext>[] = [
	walletNotConnectedValidator as Validator<DepositValidationContext>,
	walletLoadingValidator as Validator<DepositValidationContext>,
	depositMinAmountValidator as Validator<DepositValidationContext>,
	depositInsufficientBalanceValidator as Validator<DepositValidationContext>,
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
