import { t } from "@lingui/core/macro";
import { ORDER_MIN_NOTIONAL_USD } from "@/config/constants";
import { noBalanceValidator } from "../definitions/balance";
import { signerNotReadyValidator, walletLoadingValidator, walletNotConnectedValidator } from "../definitions/connection";
import { marketNotReadyValidator, noMarketValidator } from "../definitions/market";
import { createValidator, runValidators, type ValidationError } from "../types";

export interface SpotOrderContext {
	isConnected: boolean;
	isWalletLoading: boolean;
	isReadyToTrade: boolean;
	needsAgentApproval: boolean;
	availableBalance: number;
	hasMarket: boolean;
	hasAssetIndex: boolean;
	usesLimitPrice: boolean;
	price: number;
	sizeValue: number;
	orderValue: number;
	side: "buy" | "sell";
	baseAvailable: number;
	quoteAvailable: number;
	baseToken: string;
	quoteToken: string;
}

export interface SpotOrderValidationResult {
	valid: boolean;
	errors: ValidationError[];
	canSubmit: boolean;
	needsApproval: boolean;
}

const enterLimitPriceValidator = createValidator<SpotOrderContext>({
	id: "spot-enter-limit-price",
	code: "SPOT_INP_001",
	category: "input",
	priority: 100,
	getMessage: () => t`Enter limit price`,
	validate: (ctx) => !ctx.usesLimitPrice || ctx.price > 0,
});

const enterSizeValidator = createValidator<SpotOrderContext>({
	id: "spot-enter-size",
	code: "SPOT_INP_002",
	category: "input",
	priority: 101,
	getMessage: () => t`Enter size`,
	validate: (ctx) => ctx.sizeValue > 0,
});

const minOrderNotionalValidator = createValidator<SpotOrderContext>({
	id: "spot-min-order-notional",
	code: "SPOT_INP_003",
	category: "input",
	priority: 102,
	getMessage: () => t`Min order $${ORDER_MIN_NOTIONAL_USD}`,
	validate: (ctx) => ctx.orderValue <= 0 || ctx.orderValue >= ORDER_MIN_NOTIONAL_USD,
});

const insufficientQuoteBalanceValidator = createValidator<SpotOrderContext>({
	id: "spot-insufficient-quote",
	code: "SPOT_BAL_001",
	category: "balance",
	priority: 110,
	getMessage: (ctx) => t`Insufficient ${ctx.quoteToken} balance`,
	validate: (ctx) => {
		if (ctx.side !== "buy") return true;
		if (ctx.orderValue <= 0) return true;
		return ctx.quoteAvailable >= ctx.orderValue;
	},
});

const insufficientBaseBalanceValidator = createValidator<SpotOrderContext>({
	id: "spot-insufficient-base",
	code: "SPOT_BAL_002",
	category: "balance",
	priority: 111,
	getMessage: (ctx) => t`Insufficient ${ctx.baseToken} balance`,
	validate: (ctx) => {
		if (ctx.side !== "sell") return true;
		if (ctx.sizeValue <= 0) return true;
		return ctx.baseAvailable >= ctx.sizeValue;
	},
});

const spotOrderValidators = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	noBalanceValidator,
	noMarketValidator,
	marketNotReadyValidator,
	signerNotReadyValidator,
	enterLimitPriceValidator,
	enterSizeValidator,
	minOrderNotionalValidator,
	insufficientQuoteBalanceValidator,
	insufficientBaseBalanceValidator,
];

export function validateSpotOrder(context: SpotOrderContext): SpotOrderValidationResult {
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

	const errors = runValidators(spotOrderValidators, context);

	return {
		valid: errors.length === 0,
		errors,
		canSubmit: errors.length === 0,
		needsApproval: false,
	};
}

export { spotOrderValidators };
