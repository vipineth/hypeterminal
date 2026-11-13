import type { ExchangeOrder, LimitTif, OrderType } from "@/config/trade";
import type { MarketKind } from "@/domain/market";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import type { TpSl } from "@/domain/trade/orders";
import { buildTwapPlan } from "@/domain/trade/twap";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { isPositive, truncateDecimals } from "@/lib/trade/numbers";
import type { RequestLabel } from "@/lib/trade/pending-requests";
import type { Side } from "@/lib/trade/types";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { resultToQueueUpdate, useOrderQueueActions } from "@/stores/use-order-queue-store";

interface SubmitMarket {
	assetId: number;
	szDecimals: number;
	kind: MarketKind;
	name: string;
}

export interface OrderSubmitInput {
	market: SubmitMarket;
	baseToken: string;
	side: Side;
	orderType: OrderType;
	sizeValue: number;
	markPx: number;
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
		market: input.baseToken,
		side: input.side,
		size: truncateDecimals(input.sizeValue, input.market.szDecimals),
	};
}

export function useOrderSubmit(): UseOrderSubmitResult {
	const { submitPlan, submitTwap: sendTwap, isSubmitting } = useSubmitPlan();
	const { addOrder, updateOrder } = useOrderQueueActions();
	const { resetForm } = useOrderEntryActions();

	async function submitTwap(input: OrderSubmitInput): Promise<boolean> {
		const plan = buildTwapPlan({
			assetId: input.market.assetId,
			side: input.side,
			sizeValue: input.sizeValue,
			szDecimals: input.market.szDecimals,
			reduceOnly: input.reduceOnly,
			minutes: input.twapMinutesNum,
			randomize: input.twapRandomize,
		});

		const label = getLabel(input);
		const orderId = addOrder({ ...label, orderType: "twap", status: "pending" });

		if (!plan.action) {
			updateOrder(orderId, { status: "failed", error: plan.errors.join("; ") });
			return false;
		}

		const result = await sendTwap(plan.action, { coin: input.market.name, label });
		updateOrder(orderId, resultToQueueUpdate(result));
		if (result.ok) resetForm();
		return result.ok;
	}

	async function submitEntry(input: OrderSubmitInput): Promise<boolean> {
		const { market, tpSlEnabled, canUseTpSl, tpPriceInput, slPriceInput } = input;

		const plan = buildOrderPlan({
			kind: "entry",
			assetId: market.assetId,
			side: input.side,
			orderType: input.orderType,
			sizeValue: input.sizeValue,
			szDecimals: market.szDecimals,
			marketKind: market.kind,
			markPx: input.markPx,
			slippageBps: input.slippageBps,
			reduceOnly: input.reduceOnly,
			tif: input.tif,
			limitPriceInput: input.limitPriceInput,
			triggerPriceInput: input.triggerPriceInput,
			scaleStartPriceInput: input.scaleStartPriceInput,
			scaleEndPriceInput: input.scaleEndPriceInput,
			scaleLevelsNum: input.scaleLevelsNum,
			tpSlEnabled,
			canUseTpSl,
			tpPriceInput,
			slPriceInput,
		});

		const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceInput);
		const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceInput);

		const label = getLabel(input);
		const orderId = addOrder({
			...label,
			price: plan.orders[0] && getQueuePrice(plan.orders[0]),
			orderType: getQueueOrderType(input),
			tpPrice: hasTp ? findTriggerPrice(plan.orders, "tp") : undefined,
			slPrice: hasSl ? findTriggerPrice(plan.orders, "sl") : undefined,
			status: "pending",
		});

		const result = await submitPlan(plan, label);
		updateOrder(orderId, resultToQueueUpdate(result));
		if (plan.errors.length === 0) resetForm();
		return result.ok;
	}

	function handleSubmit(input: OrderSubmitInput): Promise<boolean> {
		return input.twapOrder ? submitTwap(input) : submitEntry(input);
	}

	return { handleSubmit, isSubmitting };
}
