import { noBalanceValidator } from "../definitions/balance";
import { signerNotReadyValidator, walletLoadingValidator, walletNotConnectedValidator } from "../definitions/connection";
import { marketNotReadyValidator, noMarketValidator, noMarkPriceValidator } from "../definitions/market";
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
import { enterTpSlPriceValidator, slPriceValidator, type TpSlContext, tpPriceValidator } from "../definitions/tpsl";
import {
	stopTriggerAboveMarkValidator,
	stopTriggerBelowMarkValidator,
	type TriggerContext,
	tpTriggerAboveMarkValidator,
	tpTriggerBelowMarkValidator,
} from "../definitions/trigger";
import { type TwapContext, twapMinutesRangeValidator } from "../definitions/twap";
import { runValidators, type ValidationError } from "../types";

export interface PerpOrderContext extends OrderInputContext, TpSlContext, TriggerContext, ScaleContext, TwapContext {
	isConnected: boolean;
	isWalletLoading: boolean;
	isReadyToTrade: boolean;
	needsAgentApproval: boolean;
	availableBalance: number;
	hasMarket: boolean;
	hasAssetIndex: boolean;
	orderType: string;
}

export interface PerpOrderValidationResult {
	valid: boolean;
	errors: ValidationError[];
	canSubmit: boolean;
	needsApproval: boolean;
}

const perpOrderValidators = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	noBalanceValidator,
	noMarketValidator,
	marketNotReadyValidator,
	signerNotReadyValidator,
	noMarkPriceValidator,
	enterLimitPriceValidator,
	enterTriggerPriceValidator,
	enterSizeValidator,
	minOrderNotionalValidator,
	exceedsMaxSizeValidator,
	enterTpSlPriceValidator,
	tpPriceValidator,
	slPriceValidator,
	stopTriggerAboveMarkValidator,
	stopTriggerBelowMarkValidator,
	tpTriggerAboveMarkValidator,
	tpTriggerBelowMarkValidator,
	enterPriceRangeValidator,
	scaleLevelsRangeValidator,
	scaleStartEndDifferValidator,
	scaleLevelMinNotionalValidator,
	twapMinutesRangeValidator,
];

export function validatePerpOrder(context: PerpOrderContext): PerpOrderValidationResult {
	if (!context.isConnected) {
		const errors = runValidators([walletNotConnectedValidator], context);
		return { valid: false, errors, canSubmit: false, needsApproval: false };
	}

	if (context.isWalletLoading) {
		const errors = runValidators([walletLoadingValidator], context);
		return { valid: false, errors, canSubmit: false, needsApproval: false };
	}

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

export { perpOrderValidators };
