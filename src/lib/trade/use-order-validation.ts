import { useMemo } from "react";
import { type PerpOrderContext, validatePerpOrder } from "@/lib/errors/stacks/perp-order";
import { type SpotOrderContext, validateSpotOrder } from "@/lib/errors/stacks/spot-order";
import type { Side, ValidationResult } from "@/lib/trade/types";

interface BaseValidationInput {
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

interface PerpValidationInput extends BaseValidationInput {
	isSpotMarket: false;
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

interface SpotValidationInput extends BaseValidationInput {
	isSpotMarket: true;
	baseAvailable: number;
	quoteAvailable: number;
	baseToken: string;
	quoteToken: string;
}

type ValidationInput = PerpValidationInput | SpotValidationInput;

export function useOrderValidation(input: ValidationInput): ValidationResult {
	return useMemo<ValidationResult>(() => {
		if (input.isSpotMarket) {
			const context: SpotOrderContext = {
				isConnected: input.isConnected,
				isWalletLoading: input.isWalletLoading,
				isReadyToTrade: input.isReadyToTrade,
				needsAgentApproval: input.needsAgentApproval,
				availableBalance: input.availableBalance,
				hasMarket: input.hasMarket,
				hasAssetIndex: input.hasAssetIndex,
				usesLimitPrice: input.usesLimitPrice,
				price: input.price,
				sizeValue: input.sizeValue,
				orderValue: input.orderValue,
				side: input.side,
				baseAvailable: input.baseAvailable,
				quoteAvailable: input.quoteAvailable,
				baseToken: input.baseToken,
				quoteToken: input.quoteToken,
			};

			const result = validateSpotOrder(context);

			return {
				valid: result.valid,
				errors: result.errors.map((e) => e.message),
				canSubmit: result.canSubmit,
				needsApproval: result.needsApproval,
			};
		}

		const context: PerpOrderContext = {
			isConnected: input.isConnected,
			isWalletLoading: input.isWalletLoading,
			isReadyToTrade: input.isReadyToTrade,
			needsAgentApproval: input.needsAgentApproval,
			availableBalance: input.availableBalance,
			hasMarket: input.hasMarket,
			hasAssetIndex: input.hasAssetIndex,
			orderType: input.orderType,
			markPx: input.markPx,
			price: input.price,
			sizeValue: input.sizeValue,
			orderValue: input.orderValue,
			maxSize: input.maxSize,
			side: input.side,
			usesLimitPrice: input.usesLimitPrice,
			usesTriggerPrice: input.usesTriggerPrice,
			triggerPriceNum: input.triggerPriceNum,
			stopOrder: input.stopOrder,
			takeProfitOrder: input.takeProfitOrder,
			scaleOrder: input.scaleOrder,
			twapOrder: input.twapOrder,
			scaleStartPriceNum: input.scaleStartPriceNum,
			scaleEndPriceNum: input.scaleEndPriceNum,
			scaleLevelsNum: input.scaleLevelsNum,
			twapMinutesNum: input.twapMinutesNum,
			tpSlEnabled: input.tpSlEnabled,
			canUseTpSl: input.canUseTpSl,
			tpPriceNum: input.tpPriceNum,
			slPriceNum: input.slPriceNum,
		};

		const result = validatePerpOrder(context);

		return {
			valid: result.valid,
			errors: result.errors.map((e) => e.message),
			canSubmit: result.canSubmit,
			needsApproval: result.needsApproval,
		};
	}, [input]);
}

export type { ValidationInput };
