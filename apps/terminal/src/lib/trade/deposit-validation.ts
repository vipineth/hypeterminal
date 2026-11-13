import { t } from "@lingui/core/macro";
import { formatUnits, parseUnits } from "viem";
import { MIN_DEPOSIT_USDC, USDC_DECIMALS } from "@/config/contracts";

export type UsdcBalance =
	| { status: "loading" }
	| { status: "error" }
	| { status: "ready"; raw: bigint; formatted: string };

export interface DepositValidation {
	valid: boolean;
	error: string | null;
}

interface BalanceRead {
	data: bigint | undefined;
	isError: boolean;
}

export function getUsdcBalance({ data, isError }: BalanceRead): UsdcBalance {
	if (data !== undefined) return { status: "ready", raw: data, formatted: formatUnits(data, USDC_DECIMALS) };
	if (isError) return { status: "error" };
	return { status: "loading" };
}

export function validateDeposit(amount: string, balance: UsdcBalance): DepositValidation {
	const trimmed = amount.trim();
	if (!trimmed) return { valid: false, error: null };

	try {
		const raw = parseUnits(trimmed, USDC_DECIMALS);
		if (raw === 0n) return { valid: false, error: null };
		if (raw < MIN_DEPOSIT_USDC) return { valid: false, error: t`Minimum deposit is 5 USDC` };
		if (balance.status !== "ready") return { valid: false, error: null };
		if (raw > balance.raw) return { valid: false, error: t`Insufficient balance` };
		return { valid: true, error: null };
	} catch {
		return { valid: false, error: t`Invalid amount` };
	}
}
