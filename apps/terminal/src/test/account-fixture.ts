import type {
	ActiveAssetDataResponse,
	AllDexsClearinghouseStateWsEvent,
	SpotClearinghouseStateResponse,
	WebData3WsEvent,
} from "@nktkas/hyperliquid";

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
