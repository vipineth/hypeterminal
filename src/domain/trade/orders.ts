import { SCALE_LEVELS_MAX, SCALE_LEVELS_MIN } from "@/config/constants";
import { getExecutedPrice } from "@/domain/trade/order/price";
import { clampInt, formatDecimalFloor, isPositive, toBig, toSafeBig } from "@/lib/trade/numbers";
import type { ExchangeOrder, LimitTif, OrderType } from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

export interface OrderBuildParams {
	assetId: number;
	side: Side;
	orderType: OrderType;
	sizeValue: number;
	szDecimals: number;
	markPx: number;
	price: number;
	slippageBps: number;
	reduceOnly: boolean;
	tif: LimitTif;
	limitPriceInput: string;
	triggerPriceInput: string;
	scaleStartPriceInput: string;
	scaleEndPriceInput: string;
	scaleLevelsNum: number | null;
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceNum: number | null;
	slPriceNum: number | null;
	isStopOrder: boolean;
	isTriggerOrder: boolean;
	isScaleOrder: boolean;
	usesLimitPriceForOrder: boolean;
}

export interface OrderBuildResult {
	orders: ExchangeOrder[];
	grouping: "positionTpsl" | "na";
}

export function buildOrders(params: OrderBuildParams): OrderBuildResult {
	const {
		assetId,
		side,
		orderType,
		sizeValue,
		szDecimals,
		markPx,
		price,
		slippageBps,
		reduceOnly,
		tif,
		limitPriceInput,
		triggerPriceInput,
		scaleStartPriceInput,
		scaleEndPriceInput,
		scaleLevelsNum,
		tpSlEnabled,
		canUseTpSl,
		tpPriceNum,
		slPriceNum,
		isStopOrder,
		isTriggerOrder,
		isScaleOrder,
		usesLimitPriceForOrder,
	} = params;

	const orders: ExchangeOrder[] = [];
	const formattedSize = formatSizeForOrder(sizeValue, szDecimals);
	const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceNum);
	const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceNum);
	const isBuy = side === "buy";

	if (isScaleOrder) {
		buildScaleOrders(orders, {
			assetId,
			isBuy,
			sizeValue,
			szDecimals,
			reduceOnly,
			tif,
			scaleStartPriceInput,
			scaleEndPriceInput,
			scaleLevelsNum,
		});
	} else if (isTriggerOrder) {
		buildTriggerOrder(orders, {
			assetId,
			isBuy,
			formattedSize,
			reduceOnly,
			triggerPriceInput,
			limitPriceInput,
			isStopOrder,
			usesLimitPriceForOrder,
		});
	} else {
		buildStandardOrder(orders, {
			assetId,
			isBuy,
			orderType,
			formattedSize,
			markPx,
			price,
			slippageBps,
			reduceOnly,
			tif,
		});

		if (hasTp && tpPriceNum !== null) {
			buildTpSlOrder(orders, { assetId, isBuy: !isBuy, formattedSize, triggerPrice: tpPriceNum, tpsl: "tp" });
		}
		if (hasSl && slPriceNum !== null) {
			buildTpSlOrder(orders, { assetId, isBuy: !isBuy, formattedSize, triggerPrice: slPriceNum, tpsl: "sl" });
		}
	}

	return { orders, grouping: hasTp || hasSl ? "positionTpsl" : "na" };
}

interface ScaleOrderParams {
	assetId: number;
	isBuy: boolean;
	sizeValue: number;
	szDecimals: number;
	reduceOnly: boolean;
	tif: LimitTif;
	scaleStartPriceInput: string;
	scaleEndPriceInput: string;
	scaleLevelsNum: number | null;
}

function buildScaleOrders(orders: ExchangeOrder[], params: ScaleOrderParams): void {
	const levels = clampInt(Math.round(params.scaleLevelsNum ?? SCALE_LEVELS_MIN), SCALE_LEVELS_MIN, SCALE_LEVELS_MAX);
	const start = toSafeBig(params.scaleStartPriceInput);
	const end = toSafeBig(params.scaleEndPriceInput);
	const step = levels > 1 ? end.minus(start).div(levels - 1) : start.times(0);
	const perLevelSize = toSafeBig(params.sizeValue).div(levels);

	for (let i = 0; i < levels; i += 1) {
		const levelPrice = start.plus(step.times(i)).toNumber();
		orders.push({
			a: params.assetId,
			b: params.isBuy,
			p: formatPriceForOrder(levelPrice),
			s: formatSizeForOrder(perLevelSize.toNumber(), params.szDecimals),
			r: params.reduceOnly,
			t: { limit: { tif: params.tif } },
		});
	}
}

interface TriggerOrderParams {
	assetId: number;
	isBuy: boolean;
	formattedSize: string;
	reduceOnly: boolean;
	triggerPriceInput: string;
	limitPriceInput: string;
	isStopOrder: boolean;
	usesLimitPriceForOrder: boolean;
}

function buildTriggerOrder(orders: ExchangeOrder[], params: TriggerOrderParams): void {
	const triggerPx = formatPriceForOrder(toBig(params.triggerPriceInput)?.toNumber() ?? 0);
	const limitPx = formatPriceForOrder(toBig(params.limitPriceInput)?.toNumber() ?? 0);

	orders.push({
		a: params.assetId,
		b: params.isBuy,
		p: params.usesLimitPriceForOrder ? limitPx : triggerPx,
		s: params.formattedSize,
		r: params.reduceOnly,
		t: {
			trigger: {
				isMarket: !params.usesLimitPriceForOrder,
				triggerPx,
				tpsl: params.isStopOrder ? "sl" : "tp",
			},
		},
	});
}

interface StandardOrderParams {
	assetId: number;
	isBuy: boolean;
	orderType: OrderType;
	formattedSize: string;
	markPx: number;
	price: number;
	slippageBps: number;
	reduceOnly: boolean;
	tif: LimitTif;
}

function buildStandardOrder(orders: ExchangeOrder[], params: StandardOrderParams): void {
	const orderPrice = getExecutedPrice(
		params.orderType,
		params.isBuy ? "buy" : "sell",
		params.markPx,
		params.slippageBps,
		params.price,
	);
	const formattedPrice = formatPriceForOrder(orderPrice);

	orders.push({
		a: params.assetId,
		b: params.isBuy,
		p: formattedPrice,
		s: params.formattedSize,
		r: params.reduceOnly,
		t: params.orderType === "market" ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: params.tif } },
	});
}

interface TpSlOrderParams {
	assetId: number;
	isBuy: boolean;
	formattedSize: string;
	triggerPrice: number;
	tpsl: "tp" | "sl";
}

function buildTpSlOrder(orders: ExchangeOrder[], params: TpSlOrderParams): void {
	const triggerPx = formatPriceForOrder(params.triggerPrice);
	orders.push({
		a: params.assetId,
		b: params.isBuy,
		p: triggerPx,
		s: params.formattedSize,
		r: true,
		t: { trigger: { isMarket: true, triggerPx, tpsl: params.tpsl } },
	});
}

function extractResponseError(status: unknown): string | null {
	if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
		return status.error;
	}
	return null;
}

export function throwIfResponseError(status: unknown): void {
	const error = extractResponseError(status);
	if (error) throw new Error(error);
}

export function throwIfAnyResponseError(statuses: unknown[] | undefined): void {
	if (!statuses) return;
	for (const status of statuses) {
		throwIfResponseError(status);
	}
}

export function getDefaultLeverage(maxLeverage: number): number {
	if (maxLeverage <= 5) return maxLeverage;
	return Math.floor(maxLeverage / 2);
}

/**
 * Format price according to Hyperliquid's tick size rules.
 * Prices must have at most 5 significant figures.
 * The number of decimal places depends on the price magnitude.
 */
export function formatPriceForOrder(price: number): string {
	if (!Number.isFinite(price) || price <= 0) return "0";

	const maxSignificantFigures = 5;
	const log10Price = Math.log10(price);
	const integerDigits = Math.floor(log10Price) + 1;

	let decimals: number;
	if (price >= 1) {
		decimals = Math.max(0, maxSignificantFigures - integerDigits);
	} else {
		decimals = maxSignificantFigures - integerDigits;
	}

	decimals = Math.min(decimals, 8);

	const multiplier = 10 ** decimals;
	const rounded = Math.round(price * multiplier) / multiplier;

	if (decimals === 0) {
		return rounded.toFixed(0);
	}

	return rounded
		.toFixed(decimals)
		.replace(/(\.\d*?)0+$/, "$1")
		.replace(/\.$/, "");
}

export function formatSizeForOrder(size: string | number, szDecimals: number): string {
	return formatDecimalFloor(size, szDecimals);
}
