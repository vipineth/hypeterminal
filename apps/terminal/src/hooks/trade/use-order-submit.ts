import { type ExchangeOrder, type LimitTif, type OrderType, TWAP_SUBORDER_MAX_SLIPPAGE_BPS } from "@/config/trade";
import type { ListedMarket } from "@/domain/market/model";
import type { FundingLeg } from "@/domain/trade/dex-transfer";
import { getAssetLabel } from "@/domain/trade/order/derive";
import { getMarketPrice } from "@/domain/trade/order/price";
import { buildOrderPlan, type EntryOrderIntent } from "@/domain/trade/order-intent";
import { formatPriceForOrder, OrderBuildError, type TpSl } from "@/domain/trade/orders";
import { buildTwapPlan, type TwapIntent } from "@/domain/trade/twap";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { isPositive, truncateDecimals } from "@/lib/trade/numbers";
import type { RequestLabel } from "@/lib/trade/pending-requests";
import type { Side } from "@/lib/trade/types";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { resultToQueueUpdate, shouldClearTicket, useOrderQueueActions } from "@/stores/use-order-queue-store";

export interface OrderSubmitInput {
	market: ListedMarket;
	baseToken: string;
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
	twapMinutesNum: number | null;
	twapRandomize: boolean;
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceInput: string;
	slPriceInput: string;
	twapOrder: boolean;
	scaleOrder: boolean;
	triggerOrder: boolean;
}

interface UseOrderSubmitResult {
	handleSubmit: (input: OrderSubmitInput) => Promise<boolean>;
	isSubmitting: boolean;
}

type QueueOrderType = "twap" | "scale" | "trigger" | "limit" | "market";

function getQueueOrderType(input: OrderSubmitInput): QueueOrderType {
	if (input.twapOrder) return "twap";
	if (input.scaleOrder) return "scale";
	if (input.triggerOrder) return "trigger";
	if (input.orderType === "limit") return "limit";
	return "market";
}

function getQueuePrice({ p, t }: ExchangeOrder): string {
	return "trigger" in t && t.trigger.isMarket ? String(t.trigger.triggerPx) : p;
}

function findTriggerPrice(orders: ExchangeOrder[], tpsl: TpSl): string | undefined {
	for (const { t } of orders) {
		if ("trigger" in t && t.trigger.tpsl === tpsl) return String(t.trigger.triggerPx);
	}
	return undefined;
}

function getLabel(input: OrderSubmitInput): RequestLabel {
	return {
		market: getAssetLabel(input.market, input.baseToken),
		side: input.side,
		size: truncateDecimals(input.sizeValue, input.market.szDecimals),
	};
}

function toTwapIntent(input: OrderSubmitInput): TwapIntent {
	return {
		market: input.market,
		side: input.side,
		sizeValue: input.sizeValue,
		reduceOnly: input.reduceOnly,
		minutes: input.twapMinutesNum,
		randomize: input.twapRandomize,
	};
}

function toEntryIntent(input: OrderSubmitInput): EntryOrderIntent {
	return {
		kind: "entry",
		market: input.market,
		side: input.side,
		orderType: input.orderType,
		sizeValue: input.sizeValue,
		markPx: input.markPx,
		slippageBps: input.slippageBps,
		reduceOnly: input.reduceOnly,
		tif: input.tif,
		limitPriceInput: input.limitPriceInput,
		triggerPriceInput: input.triggerPriceInput,
		scaleStartPriceInput: input.scaleStartPriceInput,
		scaleEndPriceInput: input.scaleEndPriceInput,
		scaleLevelsNum: input.scaleLevelsNum,
		tpSlEnabled: input.tpSlEnabled,
		canUseTpSl: input.canUseTpSl,
		tpPriceInput: input.tpPriceInput,
		slPriceInput: input.slPriceInput,
	};
}

function getTwapLegs(input: OrderSubmitInput): FundingLeg[] {
	const { action } = buildTwapPlan(toTwapIntent(input));
	if (!action || action.twap.r) return [];
	const worst = getMarketPrice(input.side, input.markPx, TWAP_SUBORDER_MAX_SLIPPAGE_BPS);
	try {
		return [
			{
				side: input.side,
				size: action.twap.s,
				price: formatPriceForOrder(worst, input.market, input.side, "aggressive"),
			},
		];
	} catch (error) {
		if (error instanceof OrderBuildError) return [];
		throw error;
	}
}

export function getOpeningLegs(input: OrderSubmitInput): FundingLeg[] {
	if (input.twapOrder) return getTwapLegs(input);
	return buildOrderPlan(toEntryIntent(input))
		.orders.filter((order) => !order.r)
		.map((order): FundingLeg => ({ side: order.b ? "buy" : "sell", size: order.s, price: order.p }));
}

export function useOrderSubmit(): UseOrderSubmitResult {
	const { submitPlan, submitTwap: sendTwap, isSubmitting } = useSubmitPlan();
	const { addOrder, updateOrder } = useOrderQueueActions();
	const { resetForm } = useOrderEntryActions();

	async function submitTwap(input: OrderSubmitInput): Promise<boolean> {
		const plan = buildTwapPlan(toTwapIntent(input));

		const label = getLabel(input);
		const orderId = addOrder({ ...label, orderType: "twap", status: "pending" });

		if (!plan.action) {
			updateOrder(orderId, { status: "notSent", error: plan.errors.join("; ") });
			return false;
		}

		const result = await sendTwap(plan.action, { coin: input.market.name, label });
		updateOrder(orderId, resultToQueueUpdate(result));
		if (shouldClearTicket(result)) resetForm();
		return result.ok;
	}

	async function submitEntry(input: OrderSubmitInput): Promise<boolean> {
		const { tpSlEnabled, canUseTpSl, tpPriceInput, slPriceInput } = input;

		const plan = buildOrderPlan(toEntryIntent(input));

		const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceInput);
		const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceInput);

		const label = getLabel(input);
		const orderType = getQueueOrderType(input);
		const orderId = addOrder({
			...label,
			price: orderType !== "market" && plan.orders[0] ? getQueuePrice(plan.orders[0]) : undefined,
			orderType,
			tpPrice: hasTp ? findTriggerPrice(plan.orders, "tp") : undefined,
			slPrice: hasSl ? findTriggerPrice(plan.orders, "sl") : undefined,
			status: "pending",
		});

		const result = await submitPlan(plan, label);
		updateOrder(orderId, resultToQueueUpdate(result));
		if (shouldClearTicket(result)) resetForm();
		return result.ok;
	}

	function handleSubmit(input: OrderSubmitInput): Promise<boolean> {
		return input.twapOrder ? submitTwap(input) : submitEntry(input);
	}

	return { handleSubmit, isSubmitting };
}
