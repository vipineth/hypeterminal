import type {
	ActiveAssetDataResponse,
	AllDexsClearinghouseStateWsEvent,
	SpotClearinghouseStateResponse,
	WebData3WsEvent,
} from "@nktkas/hyperliquid";
import { buildAccountState, type QuoteCheck, type ReadyAccount } from "@/domain/trade/account-mode";

export interface AccountFixture {
	network: "mainnet" | "testnet";
	user: string;
	capturedAt: string;
	userAbstraction: string | null;
	webData3UserState: WebData3WsEvent["userState"];
	spot: SpotClearinghouseStateResponse;
	clearinghouseStates: AllDexsClearinghouseStateWsEvent["clearinghouseStates"];
	activeAssetData: Record<string, ActiveAssetDataResponse>;
}

export const TEST_USER = "0x0000000000000000000000000000000000000001";

interface TestSpotBalance {
	coin: string;
	token: number;
	total: string;
}

export function standardAccount(balances: TestSpotBalance[], mainWithdrawable = "0", user = TEST_USER): ReadyAccount {
	return buildAccountState({
		user,
		mode: { kind: "standard", raw: "default" },
		current: true,
		clearinghouseStates: [["", clearinghouse(mainWithdrawable)]],
		spot: { balances: balances.map((balance) => ({ ...balance, hold: "0", entryNtl: "0" })) },
	});
}

export function liveQuote(
	coin: string,
	availableToTrade: [string, string],
	maxTradeSzs: [string, string],
	user = TEST_USER,
): QuoteCheck {
	return {
		status: "live",
		quote: {
			user: user as `0x${string}`,
			coin,
			leverage: { type: "cross", value: 10 },
			availableToTrade,
			maxTradeSzs,
			markPx: "0",
		},
		applied: null,
	};
}

export function clearinghouse(
	value: string,
	withdrawable = value,
	marginUsed = "0.0",
): AllDexsClearinghouseStateWsEvent["clearinghouseStates"][number][1] {
	const summary = { accountValue: value, totalNtlPos: "0.0", totalRawUsd: value, totalMarginUsed: marginUsed };
	return {
		marginSummary: summary,
		crossMarginSummary: summary,
		crossMaintenanceMarginUsed: "0.0",
		withdrawable,
		assetPositions: [],
		time: 0,
	};
}
