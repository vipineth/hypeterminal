import { type Balances, getBalances } from "@/domain/trade/balances";
import { useMarkets } from "@/lib/hyperliquid/markets/use-markets";
import { useHideSmallBalances } from "@/stores/use-global-settings-store";
import { useAccountState } from "./use-account-balances";

export function useBalances(): Balances {
	const account = useAccountState();
	const { dexes } = useMarkets();
	const hideSmall = useHideSmallBalances();
	return getBalances(account, dexes, hideSmall);
}
