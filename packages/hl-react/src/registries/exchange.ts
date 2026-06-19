import type { ExchangeMethod } from "../types/clients";

type ExchangeClientKind = "trading" | "user";

interface ExchangeMethodConfig {
	client: ExchangeClientKind;
	injectBuilder: boolean;
	useClientKey: boolean;
}

const USER_SIGNED_METHODS: ReadonlySet<string> = new Set([
	"approveAgent",
	"approveBuilderFee",
	"cDeposit",
	"cWithdraw",
	"convertToMultiSigUser",
	"linkStakingUser",
	"sendAsset",
	"sendToEvmWithData",
	"spotSend",
	"stakingLinkDisableTradingUser",
	"tokenDelegate",
	"usdClassTransfer",
	"usdSend",
	"userDexAbstraction",
	"userPortfolioMargin",
	"userSetAbstraction",
	"withdraw3",
]);

const BUILDER_INJECTED_METHODS: ReadonlySet<string> = new Set(["order"]);

const CLIENT_KEY_METHODS: ReadonlySet<string> = new Set(["order", "cancel"]);

export function getExchangeMethodConfig(method: ExchangeMethod): ExchangeMethodConfig {
	return {
		client: USER_SIGNED_METHODS.has(method) ? "user" : "trading",
		injectBuilder: BUILDER_INJECTED_METHODS.has(method),
		useClientKey: CLIENT_KEY_METHODS.has(method),
	};
}
