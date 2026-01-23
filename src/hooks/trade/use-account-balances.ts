import Big from "big.js";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { useSubClearinghouseState, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";

export function percent(value: string, pct: number): string {
	return Big(value).times(pct).div(100).toString();
}

export interface SpotTokenBalance {
	coin: string;
	total: string;
	hold: string;
	available: string;
	entryNtl: string;
}

export interface PerpBalance {
	accountValue: string;
	totalMarginUsed: string;
	available: string;
}

export interface AccountBalances {
	perp: PerpBalance;
	spot: SpotTokenBalance[];
	isLoading: boolean;
	hasError: boolean;
}

export function useAccountBalances(): AccountBalances {
	const { address, isConnected } = useConnection();

	const { data: perpEvent, status: perpStatus } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const perpData = perpEvent?.clearinghouseState;

	const { data: spotEvent, status: spotStatus } = useSubSpotState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const spotData = spotEvent?.spotState;

	const perp = useMemo((): PerpBalance => {
		const accountValue = perpData?.crossMarginSummary?.accountValue ?? "0";
		const totalMarginUsed = perpData?.crossMarginSummary?.totalMarginUsed ?? "0";
		const diff = Big(accountValue).minus(totalMarginUsed);
		const available = diff.gt(0) ? diff.toString() : "0";

		return { accountValue, totalMarginUsed, available };
	}, [perpData]);

	const spot = useMemo((): SpotTokenBalance[] => {
		if (!spotData?.balances) return [];

		return spotData.balances
			.filter((b) => !Big(b.total ?? "0").eq(0))
			.map((b) => {
				const total = b.total ?? "0";
				const hold = b.hold ?? "0";
				const diff = Big(total).minus(hold);
				const available = diff.gt(0) ? diff.toString() : "0";

				return {
					coin: b.coin,
					total,
					hold,
					available,
					entryNtl: b.entryNtl ?? "0",
				};
			});
	}, [spotData]);

	const isLoading =
		perpStatus === "subscribing" || spotStatus === "subscribing" || perpStatus === "idle" || spotStatus === "idle";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return { perp, spot, isLoading, hasError };
}

export function getSpotBalance(balances: SpotTokenBalance[], coin: string): SpotTokenBalance | null {
	return balances.find((b) => b.coin === coin) ?? null;
}

export function getAvailableForCoin(balances: SpotTokenBalance[], coin: string): string {
	return getSpotBalance(balances, coin)?.available ?? "0";
}
