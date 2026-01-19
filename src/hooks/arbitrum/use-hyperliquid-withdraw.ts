import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import { useExchangeWithdraw3 } from "@/lib/hyperliquid/hooks/exchange/useExchangeWithdraw3";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription/useSubClearinghouseState";
import { isPositive, parseNumber } from "@/lib/trade/numbers";

const MIN_WITHDRAW_USD = 1;

export function useHyperliquidWithdraw() {
	const { address } = useConnection();

	const { data: clearinghouse, status: balanceStatus } = useSubClearinghouseState(
		{ user: address ?? "0x" },
		{ enabled: !!address },
	);

	const { mutate: withdraw, isPending, isSuccess, error, reset } = useExchangeWithdraw3();

	const withdrawable = useMemo(() => {
		if (!clearinghouse?.clearinghouseState) return "0";
		return clearinghouse.clearinghouseState.withdrawable;
	}, [clearinghouse]);

	const withdrawableRaw = parseNumber(withdrawable);

	const validateAmount = useCallback(
		(amount: string): { valid: boolean; error: string | null } => {
			if (!amount || amount === "0") {
				return { valid: false, error: null };
			}

			const amountNum = parseNumber(amount);
			if (!isPositive(amountNum)) {
				return { valid: false, error: "Invalid amount" };
			}

			if (amountNum < MIN_WITHDRAW_USD) {
				return { valid: false, error: `Minimum withdrawal is $${MIN_WITHDRAW_USD}` };
			}

			if (amountNum > withdrawableRaw) {
				return { valid: false, error: "Insufficient balance" };
			}

			return { valid: true, error: null };
		},
		[withdrawableRaw],
	);

	const startWithdraw = useCallback(
		(amount: string, destination?: string) => {
			if (!address) return;

			withdraw({
				destination: destination ?? address,
				amount,
			});
		},
		[address, withdraw],
	);

	return {
		address,
		withdrawable,
		withdrawableRaw,
		balanceStatus,

		validateAmount,
		startWithdraw,
		reset,

		isPending,
		isSuccess,
		error,
	};
}
