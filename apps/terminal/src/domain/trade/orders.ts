import { FormatError, formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import Big from "big.js";
import {
	DEFAULT_LEVERAGE_FALLBACK,
	type ExchangeOrder,
	HL_PERP_PRICE_MAX_DECIMALS,
	HL_PRICE_MAX_SIG_FIGS,
	HL_SPOT_PRICE_MAX_DECIMALS,
	type LimitTif,
	ORDER_MIN_NOTIONAL_USD,
	type OrderType,
	SCALE_LEVELS_MAX,
	SCALE_LEVELS_MIN,
} from "@/config/trade";
import type { AssetId, ListedMarket, Market } from "@/domain/market/model";
import { getMarketPrice } from "@/domain/trade/order/price";
import { clampInt, isPositive, type Numeric, toBig, toSafeBig } from "@/lib/trade/numbers";
import { isScaleOrderType, isStopOrderType, isTriggerOrderType, usesLimitPrice } from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

export const ORDER_PLAN_ERRORS = {
	invalidPrice: "Order price is not a valid tick for this market",
	invalidSize: "Order size is below one lot",
	belowMinNotional: "Each order must be worth at least 10",
	twapNotSupported: "TWAP orders are built by the TWAP builder",
	noTpSl: "No TP/SL provided",
} as const;

export type OrderPlanError = (typeof ORDER_PLAN_ERRORS)[keyof typeof ORDER_PLAN_ERRORS];

export class OrderBuildError extends Error {
	readonly reason: OrderPlanError;

	constructor(reason: OrderPlanError) {
		super(reason);
		this.reason = reason;
	}
}

declare const priceWireBrand: unique symbol;
declare const sizeWireBrand: unique symbol;
export type PriceWire = string & { readonly [priceWireBrand]: true };
export type SizeWire = string & { readonly [sizeWireBrand]: true };

export type WireOrder = Omit<ExchangeOrder, "a" | "p" | "s"> & { a: AssetId; p: PriceWire; s: SizeWire };

type PricedMarket = Pick<Market, "kind" | "szDecimals">;

export type PriceRounding = "passive" | "aggressive";

export type TpSl = "tp" | "sl";

export interface EntryOrderParams {
	market: ListedMarket;
	side: Side;
	orderType: OrderType;
	sizeValue: string;
	markPx: string;
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
	tpPriceInput: string;
	slPriceInput: string;
}

export interface OrderBuildResult {
	orders: WireOrder[];
	grouping: "normalTpsl" | "positionTpsl" | "na";
}

export function buildOrders(params: EntryOrderParams): OrderBuildResult {
	const {
		market,
		side,
		orderType,
		sizeValue,
		markPx,
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
		tpPriceInput,
		slPriceInput,
	} = params;

	const orders: WireOrder[] = [];
	const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceInput);
	const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceInput);
	const isBuy = side === "buy";

	if (isScaleOrderType(orderType)) {
		buildScaleOrders(orders, {
			market,
			isBuy,
			sizeValue,
			reduceOnly,
			tif,
			scaleStartPriceInput,
			scaleEndPriceInput,
			scaleLevelsNum,
		});
	} else if (isTriggerOrderType(orderType)) {
		buildTriggerOrder(orders, {
			market,
			isBuy,
			formattedSize: formatSizeForOrder(sizeValue, market),
			triggerPriceInput,
			limitPriceInput,
			isStopOrder: isStopOrderType(orderType),
			usesLimitPriceForOrder: usesLimitPrice(orderType),
		});
	} else {
		const formattedSize = formatSizeForOrder(sizeValue, market);
		buildStandardOrder(orders, {
			market,
			isBuy,
			orderType,
			formattedSize,
			markPx,
			limitPriceInput,
			slippageBps,
			reduceOnly,
			tif,
		});

		if (hasTp) {
			buildTpSlOrder(orders, { market, isBuy: !isBuy, formattedSize, triggerPrice: tpPriceInput, tpsl: "tp" });
		}
		if (hasSl) {
			buildTpSlOrder(orders, { market, isBuy: !isBuy, formattedSize, triggerPrice: slPriceInput, tpsl: "sl" });
		}
	}

	return { orders, grouping: hasTp || hasSl ? "normalTpsl" : "na" };
}

interface ScaleOrderParams {
	market: Market;
	isBuy: boolean;
	sizeValue: string;
	reduceOnly: boolean;
	tif: LimitTif;
	scaleStartPriceInput: string;
	scaleEndPriceInput: string;
	scaleLevelsNum: number | null;
}

const BigDividingDown = Big();
BigDividingDown.RM = Big.roundDown;
const BigDividingUp = Big();
BigDividingUp.RM = Big.roundUp;

function buildScaleOrders(orders: WireOrder[], params: ScaleOrderParams): void {
	const levels = clampInt(Math.round(params.scaleLevelsNum ?? SCALE_LEVELS_MIN), SCALE_LEVELS_MIN, SCALE_LEVELS_MAX);
	const steps = levels - 1;
	const start = toSafeBig(params.scaleStartPriceInput);
	const span = toSafeBig(params.scaleEndPriceInput).minus(start);
	const sizesCheapestFirst = allocateScaleSizes(params.sizeValue, levels, params.market.szDecimals);
	const legSizes = span.lt(0) ? sizesCheapestFirst.reverse() : sizesCheapestFirst;
	const side = params.isBuy ? "buy" : "sell";
	const PassiveBig = params.isBuy ? BigDividingDown : BigDividingUp;

	for (let i = 0; i < levels; i += 1) {
		const price = new PassiveBig(start.times(steps).plus(span.times(i))).div(steps);
		orders.push({
			a: params.market.assetId,
			b: params.isBuy,
			p: formatPriceForOrder(price, params.market, side, "passive"),
			s: formatSizeForOrder(legSizes[i], params.market),
			r: params.reduceOnly,
			t: { limit: { tif: params.tif } },
		});
	}
}

function allocateScaleSizes(total: Numeric, levels: number, szDecimals: number): Big[] {
	const lotsPerUnit = Big(10).pow(szDecimals);
	const totalLots = toSafeBig(total).times(lotsPerUnit).round(0, Big.roundDown);
	const baseLots = totalLots.div(levels).round(0, Big.roundDown);
	const extraLots = totalLots.minus(baseLots.times(levels)).toNumber();
	return Array.from({ length: levels }, (_, i) => baseLots.plus(i < extraLots ? 1 : 0).div(lotsPerUnit));
}

interface TriggerOrderParams {
	market: Market;
	isBuy: boolean;
	formattedSize: SizeWire;
	triggerPriceInput: string;
	limitPriceInput: string;
	isStopOrder: boolean;
	usesLimitPriceForOrder: boolean;
}

function buildTriggerOrder(orders: WireOrder[], params: TriggerOrderParams): void {
	const side = params.isBuy ? "buy" : "sell";
	const tpsl = params.isStopOrder ? "sl" : "tp";
	const limitPriceInput = params.usesLimitPriceForOrder ? params.limitPriceInput : params.triggerPriceInput;

	orders.push({
		a: params.market.assetId,
		b: params.isBuy,
		p: formatPriceForOrder(limitPriceInput, params.market, side, "passive"),
		s: params.formattedSize,
		r: true,
		t: {
			trigger: {
				isMarket: !params.usesLimitPriceForOrder,
				triggerPx: formatTriggerPxForOrder(params.triggerPriceInput, params.market, side, tpsl),
				tpsl,
			},
		},
	});
}

interface StandardOrderParams {
	market: Market;
	isBuy: boolean;
	orderType: OrderType;
	formattedSize: SizeWire;
	markPx: string;
	limitPriceInput: string;
	slippageBps: number;
	reduceOnly: boolean;
	tif: LimitTif;
}

function buildStandardOrder(orders: WireOrder[], params: StandardOrderParams): void {
	const side = params.isBuy ? "buy" : "sell";
	const isMarket = params.orderType === "market";
	const orderPrice = isMarket ? getMarketPrice(side, params.markPx, params.slippageBps) : params.limitPriceInput;

	orders.push({
		a: params.market.assetId,
		b: params.isBuy,
		p: formatPriceForOrder(orderPrice, params.market, side, isMarket ? "aggressive" : "passive"),
		s: params.formattedSize,
		r: params.reduceOnly,
		t: isMarket ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: params.tif } },
	});
}

interface TpSlOrderParams {
	market: Market;
	isBuy: boolean;
	formattedSize: SizeWire;
	triggerPrice: string;
	tpsl: TpSl;
}

function buildTpSlOrder(orders: WireOrder[], params: TpSlOrderParams): void {
	const side = params.isBuy ? "buy" : "sell";
	orders.push({
		a: params.market.assetId,
		b: params.isBuy,
		p: formatPriceForOrder(params.triggerPrice, params.market, side, "passive"),
		s: params.formattedSize,
		r: true,
		t: {
			trigger: {
				isMarket: true,
				triggerPx: formatTriggerPxForOrder(params.triggerPrice, params.market, side, params.tpsl),
				tpsl: params.tpsl,
			},
		},
	});
}

export function getDefaultLeverage(maxLeverage: number): number {
	if (maxLeverage <= DEFAULT_LEVERAGE_FALLBACK) return maxLeverage;
	return Math.floor(maxLeverage / 2);
}

export function isBelowMinNotional(order: ExchangeOrder): boolean {
	return !order.r && Big(order.s).times(order.p).lt(ORDER_MIN_NOTIONAL_USD);
}

function formatWithSdk(format: () => string, reason: OrderPlanError): string {
	try {
		return format();
	} catch (error) {
		if (error instanceof FormatError) throw new OrderBuildError(reason);
		throw error;
	}
}

export function formatPriceForOrder(price: Numeric, market: PricedMarket, side: Side, rounding: PriceRounding): PriceWire {
	return formatPriceOnTick(price, market, (side === "buy") === (rounding === "aggressive"));
}

export function formatTriggerPxForOrder(price: Numeric, market: PricedMarket, side: Side, tpsl: TpSl): PriceWire {
	const firesOnRise = (side === "buy") === (tpsl === "sl");
	return formatPriceOnTick(price, market, firesOnRise);
}

function formatPriceOnTick(price: Numeric, market: PricedMarket, roundsUp: boolean): PriceWire {
	const value = toBig(price);
	if (!value?.gt(0)) throw new OrderBuildError(ORDER_PLAN_ERRORS.invalidPrice);

	const type = market.kind === "spot" ? "spot" : "perp";
	const maxDecimals = type === "spot" ? HL_SPOT_PRICE_MAX_DECIMALS : HL_PERP_PRICE_MAX_DECIMALS;
	const mode = roundsUp ? Big.roundUp : Big.roundDown;
	const onDecimals = value.round(Math.max(maxDecimals - market.szDecimals, 0), mode);
	const onTick = onDecimals.eq(onDecimals.round(0, Big.roundDown))
		? onDecimals
		: onDecimals.prec(HL_PRICE_MAX_SIG_FIGS, mode);

	return formatWithSdk(
		() => formatPrice(onTick.toFixed(), market.szDecimals, type),
		ORDER_PLAN_ERRORS.invalidPrice,
	) as PriceWire;
}

export function formatSizeForOrder(size: Numeric, market: Market): SizeWire {
	const value = toBig(size);
	if (!value?.gt(0)) throw new OrderBuildError(ORDER_PLAN_ERRORS.invalidSize);
	return formatWithSdk(() => formatSize(value.toFixed(), market.szDecimals), ORDER_PLAN_ERRORS.invalidSize) as SizeWire;
}
