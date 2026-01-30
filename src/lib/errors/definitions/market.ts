import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

interface HasMarket {
	hasMarket: boolean;
}

interface HasAssetIndex {
	hasAssetIndex: boolean;
}

interface HasMarkPrice {
	markPx: number;
	orderType: string;
}

export type MarketContext = HasMarket & HasAssetIndex & HasMarkPrice;

export const noMarketValidator: Validator<HasMarket> = createValidator({
	id: "no-market",
	code: "MKT_001",
	category: "market",
	priority: 40,
	getMessage: () => t`No market`,
	validate: (ctx) => ctx.hasMarket,
});

export const marketNotReadyValidator: Validator<HasAssetIndex> = createValidator({
	id: "market-not-ready",
	code: "MKT_002",
	category: "market",
	priority: 41,
	getMessage: () => t`Market not ready`,
	validate: (ctx) => ctx.hasAssetIndex,
});

export const noMarkPriceValidator: Validator<HasMarkPrice> = createValidator({
	id: "no-mark-price",
	code: "MKT_003",
	category: "market",
	priority: 65,
	getMessage: () => t`No mark price`,
	validate: (ctx) => ctx.orderType !== "market" || ctx.markPx > 0,
});

export const marketValidators: Validator<MarketContext>[] = [
	noMarketValidator,
	marketNotReadyValidator,
	noMarkPriceValidator,
];
