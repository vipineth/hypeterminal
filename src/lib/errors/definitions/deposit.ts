import { t } from "@lingui/core/macro";
import { MIN_DEPOSIT_USDC, MIN_WITHDRAW_USD } from "@/config/contracts";
import { createValidator, type Validator } from "../types";

export interface DepositContext {
	amount: number;
	walletBalance: number;
	minDeposit: number;
}

export interface WithdrawContext {
	amount: number;
	withdrawableBalance: number;
	minWithdraw: number;
}

export const depositMinAmountValidator: Validator<DepositContext> = createValidator({
	id: "deposit-min-amount",
	code: "DEP_001",
	category: "deposit",
	priority: 100,
	getMessage: () => t`Minimum deposit is 5 USDC`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount >= ctx.minDeposit,
});

export const depositInsufficientBalanceValidator: Validator<DepositContext> = createValidator({
	id: "deposit-insufficient-balance",
	code: "DEP_002",
	category: "deposit",
	priority: 101,
	getMessage: () => t`Insufficient balance`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount <= ctx.walletBalance,
});

export const withdrawMinAmountValidator: Validator<WithdrawContext> = createValidator({
	id: "withdraw-min-amount",
	code: "WDR_001",
	category: "withdraw",
	priority: 100,
	getMessage: () => t`Minimum withdrawal is $${MIN_WITHDRAW_USD}`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount >= ctx.minWithdraw,
});

export const withdrawInsufficientBalanceValidator: Validator<WithdrawContext> = createValidator({
	id: "withdraw-insufficient-balance",
	code: "WDR_002",
	category: "withdraw",
	priority: 101,
	getMessage: () => t`Insufficient balance`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount <= ctx.withdrawableBalance,
});

export const depositValidators: Validator<DepositContext>[] = [
	depositMinAmountValidator,
	depositInsufficientBalanceValidator,
];

export const withdrawValidators: Validator<WithdrawContext>[] = [
	withdrawMinAmountValidator,
	withdrawInsufficientBalanceValidator,
];
