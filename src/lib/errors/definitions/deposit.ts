import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

interface HasDepositAmount {
	amount: number;
	minDeposit: number;
}

interface HasWalletBalance {
	amount: number;
	walletBalance: number;
}

interface HasWithdrawAmount {
	amount: number;
	minWithdraw: number;
}

interface HasWithdrawableBalance {
	amount: number;
	withdrawableBalance: number;
}

export type DepositContext = HasDepositAmount & HasWalletBalance;

export type WithdrawContext = HasWithdrawAmount & HasWithdrawableBalance;

export const depositMinAmountValidator: Validator<HasDepositAmount> = createValidator({
	id: "deposit-min-amount",
	code: "DEP_001",
	category: "deposit",
	priority: 100,
	getMessage: (ctx) => t`Minimum deposit is ${ctx.minDeposit} USDC`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount >= ctx.minDeposit,
});

export const depositInsufficientBalanceValidator: Validator<HasWalletBalance> = createValidator({
	id: "deposit-insufficient-balance",
	code: "DEP_002",
	category: "deposit",
	priority: 101,
	getMessage: () => t`Insufficient balance`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount <= ctx.walletBalance,
});

export const withdrawMinAmountValidator: Validator<HasWithdrawAmount> = createValidator({
	id: "withdraw-min-amount",
	code: "WDR_001",
	category: "withdraw",
	priority: 100,
	getMessage: (ctx) => t`Minimum withdrawal is $${ctx.minWithdraw}`,
	validate: (ctx) => ctx.amount === 0 || ctx.amount >= ctx.minWithdraw,
});

export const withdrawInsufficientBalanceValidator: Validator<HasWithdrawableBalance> = createValidator({
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
