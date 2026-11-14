import { type ExchangeMethod, useExchange as useHyperliquidExchange } from "@hypeterminal/hl-react";
import { bumpCollateralGeneration } from "@/stores/use-collateral-generation-store";

type Options<M extends ExchangeMethod> = NonNullable<Parameters<typeof useHyperliquidExchange<M>>[1]>;

const COLLATERAL_SPENDS: ReadonlySet<ExchangeMethod> = new Set<ExchangeMethod>([
	"order",
	"modify",
	"batchModify",
	"twapOrder",
	"spotSend",
	"sendAsset",
	"usdSend",
	"usdClassTransfer",
	"withdraw3",
	"vaultTransfer",
	"subAccountTransfer",
	"subAccountSpotTransfer",
	"updateIsolatedMargin",
	"cDeposit",
	"sendToEvmWithData",
]);

export function useExchange<M extends ExchangeMethod>(method: M, options: Options<M> = {}) {
	return useHyperliquidExchange(method, {
		...options,
		onError(...args) {
			if (COLLATERAL_SPENDS.has(method)) bumpCollateralGeneration();
			return options.onError?.(...args);
		},
	});
}
