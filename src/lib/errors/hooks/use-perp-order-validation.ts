import { useMemo } from "react";
import type { Side } from "@/lib/trade/types";
import { validatePerpOrder, type PerpOrderContext, type PerpOrderValidationResult } from "../stacks/perp-order";

interface UsePerpOrderValidationInput {
	isConnected: boolean;
	isWalletLoading: boolean;
	availableBalance: number;
	hasMarket: boolean;
	hasAssetIndex: boolean;
	needsAgentApproval: boolean;
	isReadyToTrade: boolean;
	orderType: string;
	markPx: number;
	price: number;
	sizeValue: number;
	orderValue: number;
	maxSize: number;
	side: Side;
	usesLimitPrice: boolean;
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

export interface PerpOrderValidationOutput {
	valid: boolean;
	errors: string[];
	canSubmit: boolean;
	needsApproval: boolean;
}

export function usePerpOrderValidation(input: UsePerpOrderValidationInput): PerpOrderValidationOutput {
	return useMemo(() => {
		const context: PerpOrderContext = {
			isConnected: input.isConnected,
			isWalletLoading: input.isWalletLoading,
			availableBalance: input.availableBalance,
			hasMarket: input.hasMarket,
			hasAssetIndex: input.hasAssetIndex,
			needsAgentApproval: input.needsAgentApproval,
			isReadyToTrade: input.isReadyToTrade,
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
