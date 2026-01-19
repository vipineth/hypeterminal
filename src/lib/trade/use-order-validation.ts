import { t } from "@lingui/core/macro";
import { useMemo } from "react";
import { ORDER_MIN_NOTIONAL_USD } from "@/config/constants";
import { clampInt, isPositive } from "@/lib/trade/numbers";
import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
import type { Side, ValidationResult } from "@/lib/trade/types";

interface ValidationInput {
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

export function useOrderValidation(input: ValidationInput): ValidationResult {
	return useMemo<ValidationResult>(() => {
		if (!input.isConnected) {
			return { valid: false, errors: [t`Not connected`], canSubmit: false, needsApproval: false };
		}
		if (input.isWalletLoading) {
			return { valid: false, errors: [t`Loading wallet...`], canSubmit: false, needsApproval: false };
		}
		if (input.availableBalance <= 0) {
			return { valid: false, errors: [t`No balance`], canSubmit: false, needsApproval: false };
		}
		if (!input.hasMarket) {
			return { valid: false, errors: [t`No market`], canSubmit: false, needsApproval: false };
		}
		if (!input.hasAssetIndex) {
			return { valid: false, errors: [t`Market not ready`], canSubmit: false, needsApproval: false };
		}
		if (input.needsAgentApproval) {
			return { valid: false, errors: [], canSubmit: false, needsApproval: true };
		}
		if (!input.isReadyToTrade) {
			return { valid: false, errors: [t`Signer not ready`], canSubmit: false, needsApproval: false };
		}
		if (input.orderType === "market" && !input.markPx) {
			return { valid: false, errors: [t`No mark price`], canSubmit: false, needsApproval: false };
		}

		const errors: string[] = [];

		if (input.usesLimitPrice && !input.price) errors.push(t`Enter limit price`);
		if (input.usesTriggerPrice && !isPositive(input.triggerPriceNum)) errors.push(t`Enter trigger price`);
		if (!input.sizeValue || input.sizeValue <= 0) errors.push(t`Enter size`);
		if (input.orderValue > 0 && input.orderValue < ORDER_MIN_NOTIONAL_USD) errors.push(t`Min order $10`);
		if (input.sizeValue > input.maxSize && input.maxSize > 0) errors.push(t`Exceeds max size`);

		if (input.tpSlEnabled && input.canUseTpSl) {
			const hasTp = isPositive(input.tpPriceNum);
			const hasSl = isPositive(input.slPriceNum);
			if (!hasTp && !hasSl) errors.push(t`Enter TP or SL price`);
			if (hasTp && !validateTpPrice(input.price, input.tpPriceNum, input.side)) {
				errors.push(input.side === "buy" ? t`TP must be above entry` : t`TP must be below entry`);
			}
			if (hasSl && !validateSlPrice(input.price, input.slPriceNum, input.side)) {
				errors.push(input.side === "buy" ? t`SL must be below entry` : t`SL must be above entry`);
			}
		}

		if (input.usesTriggerPrice && isPositive(input.triggerPriceNum) && input.markPx > 0) {
			if (input.stopOrder) {
				const needsAbove = input.side === "buy";
				if (needsAbove && input.triggerPriceNum <= input.markPx) errors.push(t`Stop trigger must be above mark`);
				if (!needsAbove && input.triggerPriceNum >= input.markPx) errors.push(t`Stop trigger must be below mark`);
			}
			if (input.takeProfitOrder) {
				const needsAbove = input.side === "sell";
				if (needsAbove && input.triggerPriceNum <= input.markPx) errors.push(t`Take profit trigger must be above mark`);
				if (!needsAbove && input.triggerPriceNum >= input.markPx) errors.push(t`Take profit trigger must be below mark`);
			}
		}

		if (input.scaleOrder) {
			const levels = clampInt(Math.round(input.scaleLevelsNum ?? 0), 0, 100);
			if (!isPositive(input.scaleStartPriceNum) || !isPositive(input.scaleEndPriceNum)) {
				errors.push(t`Enter price range`);
			}
			if (levels < 2 || levels > 20) errors.push(t`Scale levels must be 2-20`);
			if (
				isPositive(input.scaleStartPriceNum) &&
				isPositive(input.scaleEndPriceNum) &&
				input.scaleStartPriceNum === input.scaleEndPriceNum
			) {
				errors.push(t`Start and end must differ`);
			}
			if (levels >= 2 && input.sizeValue > 0) {
				const averagePrice = input.price > 0 ? input.price : input.markPx;
				const perLevelSize = input.sizeValue / levels;
				const perLevelNotional = averagePrice > 0 ? perLevelSize * averagePrice : 0;
				if (perLevelNotional > 0 && perLevelNotional < ORDER_MIN_NOTIONAL_USD) {
					errors.push(t`Scale level below min notional`);
				}
			}
		}

		if (input.twapOrder) {
			const minutes = Math.round(input.twapMinutesNum ?? 0);
			if (minutes < 5 || minutes > 1440) errors.push(t`TWAP minutes must be 5-1440`);
		}

		return { valid: errors.length === 0, errors, canSubmit: errors.length === 0, needsApproval: false };
	}, [input]);
}

export type { ValidationInput };
