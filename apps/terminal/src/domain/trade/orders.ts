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
import type { MarketKind } from "@/domain/market";
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

export interface WireMarket {
	szDecimals: number;
	kind: MarketKind;
}

export type PriceRounding = "passive" | "aggressive";

export interface EntryOrderParams {
	assetId: number;
	side: Side;
	orderType: OrderType;
	sizeValue: number;
	szDecimals: number;
	marketKind: MarketKind;
	markPx: number;
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
}

export interface OrderBuildResult {
	orders: ExchangeOrder[];
	grouping: "normalTpsl" | "positionTpsl" | "na";
}

export function buildOrders(params: EntryOrderParams): OrderBuildResult {
	const {
		assetId,
		side,
		orderType,
		sizeValue,
		szDecimals,
		marketKind,
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
		tpPriceNum,
		slPriceNum,
	} = params;

	const market: WireMarket = { szDecimals, kind: marketKind };
	const orders: ExchangeOrder[] = [];
	const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceNum);
	const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceNum);
	const isBuy = side === "buy";

	if (isScaleOrderType(orderType)) {
		buildScaleOrders(orders, {
			assetId,
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
			assetId,
			market,
			isBuy,
			formattedSize: formatSizeForOrder(sizeValue, szDecimals),
			triggerPriceInput,
			limitPriceInput,
			isStopOrder: isStopOrderType(orderType),
			usesLimitPriceForOrder: usesLimitPrice(orderType),
		});
	} else {
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);
		buildStandardOrder(orders, {
			assetId,
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

		if (hasTp && tpPriceNum !== null) {
			buildTpSlOrder(orders, { assetId, market, isBuy: !isBuy, formattedSize, triggerPrice: tpPriceNum, tpsl: "tp" });
		}
		if (hasSl && slPriceNum !== null) {
			buildTpSlOrder(orders, { assetId, market, isBuy: !isBuy, formattedSize, triggerPrice: slPriceNum, tpsl: "sl" });
		}
	}

	return { orders, grouping: hasTp || hasSl ? "normalTpsl" : "na" };
}

interface ScaleOrderParams {
	assetId: number;
	market: WireMarket;
	isBuy: boolean;
	sizeValue: number;
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

function buildScaleOrders(orders: ExchangeOrder[], params: ScaleOrderParams): void {
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
			a: params.assetId,
			b: params.isBuy,
			p: formatPriceForOrder(price, params.market, side, "passive"),
			s: formatSizeForOrder(legSizes[i], params.market.szDecimals),
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
	assetId: number;
	market: WireMarket;
	isBuy: boolean;
	formattedSize: string;
	triggerPriceInput: string;
	limitPriceInput: string;
	isStopOrder: boolean;
	usesLimitPriceForOrder: boolean;
}

function buildTriggerOrder(orders: ExchangeOrder[], params: TriggerOrderParams): void {
	const side = params.isBuy ? "buy" : "sell";
	const triggerPx = formatPriceForOrder(params.triggerPriceInput, params.market, side, "passive");

	orders.push({
		a: params.assetId,
		b: params.isBuy,
		p: params.usesLimitPriceForOrder
			? formatPriceForOrder(params.limitPriceInput, params.market, side, "passive")
			: triggerPx,
		s: params.formattedSize,
		r: true,
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
	market: WireMarket;
	isBuy: boolean;
	orderType: OrderType;
	formattedSize: string;
	markPx: number;
	limitPriceInput: string;
	slippageBps: number;
	reduceOnly: boolean;
	tif: LimitTif;
}

function buildStandardOrder(orders: ExchangeOrder[], params: StandardOrderParams): void {
	const side = params.isBuy ? "buy" : "sell";
	const isMarket = params.orderType === "market";
	const orderPrice = isMarket ? getMarketPrice(side, params.markPx, params.slippageBps) : params.limitPriceInput;

	orders.push({
		a: params.assetId,
		b: params.isBuy,
		p: formatPriceForOrder(orderPrice, params.market, side, isMarket ? "aggressive" : "passive"),
		s: params.formattedSize,
		r: params.reduceOnly,
		t: isMarket ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: params.tif } },
	});
}

interface TpSlOrderParams {
	assetId: number;
	market: WireMarket;
	isBuy: boolean;
	formattedSize: string;
	triggerPrice: number;
	tpsl: "tp" | "sl";
}

function buildTpSlOrder(orders: ExchangeOrder[], params: TpSlOrderParams): void {
	const triggerPx = formatPriceForOrder(params.triggerPrice, params.market, params.isBuy ? "buy" : "sell", "passive");
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

export function formatPriceForOrder(price: Numeric, market: WireMarket, side: Side, rounding: PriceRounding): string {
	const value = toBig(price);
	if (!value?.gt(0)) throw new OrderBuildError(ORDER_PLAN_ERRORS.invalidPrice);

	const type = market.kind === "spot" ? "spot" : "perp";
	const maxDecimals = type === "spot" ? HL_SPOT_PRICE_MAX_DECIMALS : HL_PERP_PRICE_MAX_DECIMALS;
	const roundsUp = (side === "buy") === (rounding === "aggressive");
	const mode = roundsUp ? Big.roundUp : Big.roundDown;
	const onDecimals = value.round(Math.max(maxDecimals - market.szDecimals, 0), mode);
	const onTick = onDecimals.eq(onDecimals.round(0, Big.roundDown))
		? onDecimals
		: onDecimals.prec(HL_PRICE_MAX_SIG_FIGS, mode);

	return formatWithSdk(() => formatPrice(onTick.toFixed(), market.szDecimals, type), ORDER_PLAN_ERRORS.invalidPrice);
}

export function formatSizeForOrder(size: Numeric, szDecimals: number): string {
	const value = toBig(size);
	if (!value?.gt(0)) throw new OrderBuildError(ORDER_PLAN_ERRORS.invalidSize);
	return formatWithSdk(() => formatSize(value.toFixed(), szDecimals), ORDER_PLAN_ERRORS.invalidSize);
}
