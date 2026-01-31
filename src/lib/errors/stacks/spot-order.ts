import { noBalanceValidator } from "../definitions/balance";
import {
	signerNotReadyValidator,
	walletLoadingValidator,
	walletNotConnectedValidator,
} from "../definitions/connection";
import { marketNotReadyValidator, noMarketValidator } from "../definitions/market";
import {
	insufficientBaseBalanceValidator,
	insufficientQuoteBalanceValidator,
	type SpotBalanceContext,
} from "../definitions/spot-balance";
import {
	type SpotInputContext,
	spotEnterLimitPriceValidator,
	spotEnterSizeValidator,
	spotMinOrderNotionalValidator,
} from "../definitions/spot-input";
import { runValidators, type ValidationError, type Validator } from "../types";

export interface SpotOrderContext extends SpotInputContext, SpotBalanceContext {
	isConnected: boolean;
	isWalletLoading: boolean;
	isReadyToTrade: boolean;
	needsAgentApproval: boolean;
	availableBalance: number;
	hasMarket: boolean;
	hasAssetIndex: boolean;
}

export interface SpotOrderValidationResult {
	valid: boolean;
	errors: ValidationError[];
	canSubmit: boolean;
	needsApproval: boolean;
}

const spotOrderValidators: Validator<SpotOrderContext>[] = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	noBalanceValidator,
	noMarketValidator,
	marketNotReadyValidator,
	signerNotReadyValidator,
	spotEnterLimitPriceValidator,
	spotEnterSizeValidator,
	spotMinOrderNotionalValidator,
	insufficientQuoteBalanceValidator,
	insufficientBaseBalanceValidator,
];

export function validateSpotOrder(context: SpotOrderContext): SpotOrderValidationResult {
	if (context.needsAgentApproval) {
		return { valid: false, errors: [], canSubmit: false, needsApproval: true };
	}

	const errors = runValidators(spotOrderValidators, context);

	return {
		valid: errors.length === 0,
		errors,
		canSubmit: errors.length === 0,
		needsApproval: false,
	};
}
