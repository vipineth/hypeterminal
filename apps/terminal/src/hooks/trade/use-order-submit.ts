import { t } from "@lingui/core/macro";
import type { ExchangeOrder, LimitTif, OrderType } from "@/config/trade";
import type { MarketKind } from "@/domain/market";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { throwIfResponseError } from "@/domain/trade/orders";
import { buildTwapPlan } from "@/domain/trade/twap";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { useExchange } from "@/lib/hyperliquid";
import { isPositive, truncateDecimals } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";

interface SubmitMarket {
	assetId: number;
	szDecimals: number;
	kind: MarketKind;
}

export interface OrderSubmitInput {
	market: SubmitMarket;
	baseToken: string;
	side: Side;
	orderType: OrderType;
	sizeValue: number;
	price: number;
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
	tpPriceNum: number | null;
	slPriceNum: number | null;
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

function findTriggerPrice(orders: ExchangeOrder[], tpsl: "tp" | "sl"): string | undefined {
	return orders.find((order) => "trigger" in order.t && order.t.trigger.tpsl === tpsl)?.p;
}

export function useOrderSubmit(): UseOrderSubmitResult {
	const { submitPlan, isSubmitting: isSubmittingOrder } = useSubmitPlan();
	const { mutateAsync: placeTwapOrder, isPending: isSubmittingTwap } = useExchange("twapOrder");
	const { addOrder, updateOrder } = useOrderQueueActions();
	const { resetForm } = useOrderEntryActions();

	const isSubmitting = isSubmittingOrder || isSubmittingTwap;

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

		const orderId = addOrder({
			market: input.baseToken,
			side: input.side,
			size: truncateDecimals(input.sizeValue, input.market.szDecimals),
			orderType: "twap",
			status: "pending",
		});

		if (!plan.action) {
			updateOrder(orderId, { status: "failed", error: plan.errors.join("; ") });
			return false;
		}

		try {
			const result = await placeTwapOrder(plan.action);
			throwIfResponseError(result.response?.data?.status);
			updateOrder(orderId, { status: "success", outcome: "twapStarted" });
			resetForm();
			return true;
		} catch (error) {
			updateOrder(orderId, { status: "failed", error: error instanceof Error ? error.message : t`Order failed` });
			return false;
		}
	}

	async function submitEntry(input: OrderSubmitInput): Promise<boolean> {
		const { market, tpSlEnabled, canUseTpSl, tpPriceNum, slPriceNum } = input;

		const plan = buildOrderPlan({
			kind: "entry",
			assetId: market.assetId,
			side: input.side,
			orderType: input.orderType,
			sizeValue: input.sizeValue,
			szDecimals: market.szDecimals,
			marketKind: market.kind,
			markPx: input.markPx,
			price: input.price,
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
			tpPriceNum,
			slPriceNum,
		});

		const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceNum);
		const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceNum);

		const orderId = addOrder({
			market: input.baseToken,
			side: input.side,
			size: truncateDecimals(input.sizeValue, market.szDecimals),
			price: plan.orders[0]?.p,
			orderType: getQueueOrderType(input),
			tpPrice: hasTp ? findTriggerPrice(plan.orders, "tp") : undefined,
			slPrice: hasSl ? findTriggerPrice(plan.orders, "sl") : undefined,
			status: "pending",
		});

		const result = await submitPlan(plan);
		if (result.ok) {
			updateOrder(orderId, { status: "success", outcome: result.outcome });
		} else {
			updateOrder(orderId, { status: "failed", error: result.error });
		}
		resetForm();
		return result.ok;
	}

	function handleSubmit(input: OrderSubmitInput): Promise<boolean> {
		return input.twapOrder ? submitTwap(input) : submitEntry(input);
	}

	return { handleSubmit, isSubmitting };
}
