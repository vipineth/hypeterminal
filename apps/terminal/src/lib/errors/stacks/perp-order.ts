import { collateralPendingValidator, noBalanceValidator } from "../definitions/balance";
import {
	signerNotReadyValidator,
	walletLoadingValidator,
	walletNotConnectedValidator,
} from "../definitions/connection";
import {
	marketDelistedValidator,
	marketNotReadyValidator,
	noMarketValidator,
	noMarkPriceValidator,
} from "../definitions/market";
import {
	enterLimitPriceValidator,
	enterSizeValidator,
	enterTriggerPriceValidator,
	exceedsMaxSizeValidator,
	minOrderNotionalValidator,
	type OrderInputContext,
} from "../definitions/order-input";
import {
	enterPriceRangeValidator,
	type ScaleContext,
	scaleLevelMinNotionalValidator,
	scaleLevelsRangeValidator,
	scaleStartEndDifferValidator,
} from "../definitions/scale";
import {
	enterTpSlPriceValidator,
	slPriceValidator,
	tpPriceValidator,
	type TpSlContext,
	tpSlLiveMarkValidator,
} from "../definitions/tpsl";
import { type TriggerContext, triggerLiveMarkValidator, triggerPriceValidator } from "../definitions/trigger";
import { type TwapContext, twapMinNotionalValidator, twapMinutesRangeValidator } from "../definitions/twap";
import { runValidators, type ValidationError, type Validator } from "../types";

export interface PerpOrderContext extends OrderInputContext, TpSlContext, TriggerContext, ScaleContext, TwapContext {
	isConnected: boolean;
	isWalletLoading: boolean;
	isReadyToTrade: boolean;
	needsAgentApproval: boolean;
	availableBalance: number;
	collateralPending: boolean;
	hasMarket: boolean;
	hasAssetIndex: boolean;
	isDelisted: boolean;
	orderType: string;
}

export interface PerpOrderValidationResult {
	valid: boolean;
	errors: ValidationError[];
	canSubmit: boolean;
	needsApproval: boolean;
}

const perpOrderValidators: Validator<PerpOrderContext>[] = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	collateralPendingValidator,
	noBalanceValidator,
	noMarketValidator,
	marketNotReadyValidator,
	marketDelistedValidator,
	signerNotReadyValidator,
	noMarkPriceValidator,
	enterLimitPriceValidator,
	enterTriggerPriceValidator,
	enterSizeValidator,
	minOrderNotionalValidator,
	exceedsMaxSizeValidator,
	enterTpSlPriceValidator,
	tpSlLiveMarkValidator,
	tpPriceValidator,
	slPriceValidator,
	triggerLiveMarkValidator,
	triggerPriceValidator,
	enterPriceRangeValidator,
	scaleLevelsRangeValidator,
	scaleStartEndDifferValidator,
	scaleLevelMinNotionalValidator,
	twapMinutesRangeValidator,
	twapMinNotionalValidator,
];

export function validatePerpOrder(context: PerpOrderContext): PerpOrderValidationResult {
	if (context.needsAgentApproval) {
		return { valid: false, errors: [], canSubmit: false, needsApproval: true };
	}

	const errors = runValidators(perpOrderValidators, context);

	return {
		valid: errors.length === 0,
		errors,
		canSubmit: errors.length === 0,
		needsApproval: false,
	};
}
