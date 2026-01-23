import { useMemo } from "react";
import { useConnection } from "wagmi";
import { useSubClearinghouseState, useSubSpotState } from "@/lib/hyperliquid/hooks/subscription";

export interface SpotBalance {
	coin: string;
	total: string;
	hold: string;
	entryNtl: string;
}

export interface PerpBalance {
	accountValue: string;
	totalMarginUsed: string;
}

export interface AccountBalances {
	perp: PerpBalance;
	spot: SpotBalance[];
	isLoading: boolean;
	hasError: boolean;
}

export function useAccountBalances(): AccountBalances {
	const { address, isConnected } = useConnection();

	const { data: perpEvent, status: perpStatus } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);

	const { data: spotEvent, status: spotStatus } = useSubSpotState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);

	const perp = useMemo((): PerpBalance => {
		const summary = perpEvent?.clearinghouseState?.crossMarginSummary;
		return {
			accountValue: summary?.accountValue ?? "0",
			totalMarginUsed: summary?.totalMarginUsed ?? "0",
		};
	}, [perpEvent]);

	const spot = useMemo((): SpotBalance[] => {
		const balances = spotEvent?.spotState?.balances;
		if (!balances) return [];

		return balances
			.filter((b) => parseFloat(b.total ?? "0") !== 0)
			.map((b) => ({
				coin: b.coin,
				total: b.total ?? "0",
				hold: b.hold ?? "0",
				entryNtl: b.entryNtl ?? "0",
			}));
	}, [spotEvent]);

	const isLoading =
		perpStatus === "subscribing" || spotStatus === "subscribing" || perpStatus === "idle" || spotStatus === "idle";
	const hasError = perpStatus === "error" || spotStatus === "error";

	return { perp, spot, isLoading, hasError };
}

export function getSpotBalance(balances: SpotBalance[], coin: string): SpotBalance | null {
	return balances.find((b) => b.coin === coin) ?? null;
}
