import { type PerpOrderContext, validatePerpOrder } from "@/lib/errors/stacks/perp-order";
import { type SpotOrderContext, validateSpotOrder } from "@/lib/errors/stacks/spot-order";
import type { Side, ValidationResult } from "@/lib/trade/types";

export interface BaseOrderInput {
	isConnected: boolean;
	isWalletLoading: boolean;
	availableBalance: number;
	hasMarket: boolean;
	hasAssetIndex: boolean;
	needsAgentApproval: boolean;
	isReadyToTrade: boolean;
	price: number;
	sizeValue: number;
	orderValue: number;
	side: Side;
	usesLimitPrice: boolean;
}

export interface SpotOrderFields {
	baseAvailable: number;
	quoteAvailable: number;
	baseToken: string;
	quoteToken: string;
}

export interface PerpOrderFields {
	orderType: string;
	markPx: number;
	maxSize: number;
	usesTriggerPrice: boolean;
	triggerPriceNum: number | null;
	stopOrder: boolean;
	takeProfitOrder: boolean;
	scaleOrder: boolean;
	twapOrder: boolean;
	scaleStartPriceNum: number | null;
	scaleEndPriceNum: number | null;
	scaleLevelsNum: number | null;
	twapMinutesNum: number | null;
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceNum: number | null;
	slPriceNum: number | null;
}

type SpotValidationInput = BaseOrderInput & SpotOrderFields & { isSpotMarket: true };
type PerpValidationInput = BaseOrderInput & PerpOrderFields & { isSpotMarket: false };
type ValidationInput = SpotValidationInput | PerpValidationInput;

export function spotInput(base: BaseOrderInput, spot: SpotOrderFields): SpotValidationInput {
	return { ...base, ...spot, isSpotMarket: true };
}

export function perpInput(base: BaseOrderInput, perp: PerpOrderFields): PerpValidationInput {
	return { ...base, ...perp, isSpotMarket: false };
}

function toResult(result: { valid: boolean; errors: { message: string }[]; canSubmit: boolean; needsApproval: boolean }): ValidationResult {
	return {
		valid: result.valid,
		errors: result.errors.map((e) => e.message),
		canSubmit: result.canSubmit,
		needsApproval: result.needsApproval,
	};
}

export function useOrderValidation(input: ValidationInput): ValidationResult {
	if (input.isSpotMarket) {
		const context: SpotOrderContext = input;
		return toResult(validateSpotOrder(context));
	}

	const context: PerpOrderContext = input;
	return toResult(validatePerpOrder(context));
}
