import { t } from "@lingui/core/macro";
import type { FetchStatus } from "@tanstack/react-query";
import { formatUnits, parseUnits } from "viem";
import { MIN_DEPOSIT_USDC, USDC_DECIMALS } from "@/config/contracts";

export type UsdcBalance =
	| { status: "loading" }
	| { status: "error" }
	| { status: "ready" | "refreshing"; raw: bigint; formatted: string };

export interface DepositValidation {
	valid: boolean;
	error: string | null;
}

interface BalanceRead {
	data: bigint | undefined;
	isError: boolean;
	fetchStatus: FetchStatus;
}

export function getUsdcBalance({ data, isError, fetchStatus }: BalanceRead): UsdcBalance {
	if (fetchStatus === "idle" && isError) return { status: "error" };
	if (data === undefined || isError) return { status: "loading" };
	const status = fetchStatus === "idle" ? "ready" : "refreshing";
	return { status, raw: data, formatted: formatUnits(data, USDC_DECIMALS) };
}

export function validateDeposit(amount: string, balance: UsdcBalance): DepositValidation {
	const trimmed = amount.trim();
	if (!trimmed) return { valid: false, error: null };

	try {
		const raw = parseUnits(trimmed, USDC_DECIMALS);
		if (raw === 0n) return { valid: false, error: null };
		if (raw < MIN_DEPOSIT_USDC) return { valid: false, error: t`Minimum deposit is 5 USDC` };
		if (balance.status === "loading" || balance.status === "error") return { valid: false, error: null };
		if (raw > balance.raw) return { valid: false, error: t`Insufficient balance` };
		return { valid: balance.status === "ready", error: null };
	} catch {
		return { valid: false, error: t`Invalid amount` };
	}
}
