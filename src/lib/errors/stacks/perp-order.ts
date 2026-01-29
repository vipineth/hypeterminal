import type { Side } from "@/lib/trade/types";
import { type Validator, runValidators, type ValidationError } from "../types";
import {
	walletNotConnectedValidator,
	walletLoadingValidator,
	signerNotReadyValidator,
	type ConnectionContext,
} from "../definitions/connection";
import { noBalanceValidator, type BalanceContext } from "../definitions/balance";
import {
	noMarketValidator,
	marketNotReadyValidator,
	noMarkPriceValidator,
	type MarketContext,
} from "../definitions/market";
import {
	enterLimitPriceValidator,
	enterTriggerPriceValidator,
	enterSizeValidator,
	minOrderNotionalValidator,
	exceedsMaxSizeValidator,
	type OrderInputContext,
} from "../definitions/order-input";
import {
	enterTpSlPriceValidator,
	createTpPriceValidator,
	createSlPriceValidator,
	type TpSlContext,
} from "../definitions/tpsl";
import {
	stopTriggerAboveMarkValidator,
	stopTriggerBelowMarkValidator,
	tpTriggerAboveMarkValidator,
	tpTriggerBelowMarkValidator,
	type TriggerContext,
} from "../definitions/trigger";
import {
	enterPriceRangeValidator,
	scaleLevelsRangeValidator,
	scaleStartEndDifferValidator,
	scaleLevelMinNotionalValidator,
	type ScaleContext,
} from "../definitions/scale";
import { twapMinutesRangeValidator, type TwapContext } from "../definitions/twap";

export type PerpOrderContext = ConnectionContext &
	BalanceContext &
	MarketContext &
	OrderInputContext &
	TpSlContext &
	TriggerContext &
	ScaleContext &
	TwapContext & {
		needsAgentApproval: boolean;
	};

export interface PerpOrderValidationResult {
	valid: boolean;
	errors: ValidationError[];
	canSubmit: boolean;
	needsApproval: boolean;
}

function createPerpOrderValidators(side: Side): Validator<PerpOrderContext>[] {
	return [
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
		createTpPriceValidator(side),
		createSlPriceValidator(side),
		stopTriggerAboveMarkValidator,
		stopTriggerBelowMarkValidator,
		tpTriggerAboveMarkValidator,
		tpTriggerBelowMarkValidator,
		enterPriceRangeValidator,
		scaleLevelsRangeValidator,
		scaleStartEndDifferValidator,
		scaleLevelMinNotionalValidator,
		twapMinutesRangeValidator,
	] as Validator<PerpOrderContext>[];
}

export function validatePerpOrder(context: PerpOrderContext): PerpOrderValidationResult {
	if (!context.isConnected) {
		const errors = runValidators([walletNotConnectedValidator] as Validator<PerpOrderContext>[], context);
		return { valid: false, errors, canSubmit: false, needsApproval: false };
	}

	if (context.isWalletLoading) {
		const errors = runValidators([walletLoadingValidator] as Validator<PerpOrderContext>[], context);
		return { valid: false, errors, canSubmit: false, needsApproval: false };
	}

	if (context.needsAgentApproval) {
		return { valid: false, errors: [], canSubmit: false, needsApproval: true };
	}

	const validators = createPerpOrderValidators(context.side);
	const errors = runValidators(validators, context);

	return {
		valid: errors.length === 0,
		errors,
		canSubmit: errors.length === 0,
		needsApproval: false,
	};
}
