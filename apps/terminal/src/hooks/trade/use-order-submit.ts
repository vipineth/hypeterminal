import { t } from "@lingui/core/macro";
import { type LimitTif, type OrderType, TWAP_MINUTES_MAX, TWAP_MINUTES_MIN } from "@/config/trade";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { useExchange } from "@/lib/hyperliquid";
import { clampInt, isPositive } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";

interface SubmitMarket {
	assetId: number;
	szDecimals?: number;
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

export function useOrderSubmit(): UseOrderSubmitResult {
	const { submitPlan, isSubmitting: isSubmittingOrder } = useSubmitPlan();
	const { mutateAsync: placeTwapOrder, isPending: isSubmittingTwap } = useExchange("twapOrder");
	const { addOrder, updateOrder } = useOrderQueueActions();
	const { resetForm } = useOrderEntryActions();

	const isSubmitting = isSubmittingOrder || isSubmittingTwap;

	async function handleSubmit(input: OrderSubmitInput): Promise<boolean> {
		const {
			market,
			baseToken,
			side,
			orderType,
			sizeValue,
			price,
			markPx,
			slippageBps,
			reduceOnly,
			tif,
			limitPriceInput,
			triggerPriceInput,
			scaleStartPriceInput,
			scaleEndPriceInput,
			scaleLevelsNum,
			twapMinutesNum,
			twapRandomize,
			tpSlEnabled,
			canUseTpSl,
			tpPriceNum,
			slPriceNum,
			twapOrder,
		} = input;

		const szDecimals = market.szDecimals ?? 0;
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);
		const formattedPrice = formatPriceForOrder(price);

		const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceNum);
		const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceNum);

		const orderId = addOrder({
			market: baseToken,
			side,
			size: formattedSize,
			price: formattedPrice,
			orderType: getQueueOrderType(input),
			tpPrice: hasTp ? formatPriceForOrder(tpPriceNum ?? 0) : undefined,
			slPrice: hasSl ? formatPriceForOrder(slPriceNum ?? 0) : undefined,
			status: "pending",
		});

		try {
			if (twapOrder) {
				const minutes = clampInt(Math.round(twapMinutesNum ?? 0), TWAP_MINUTES_MIN, TWAP_MINUTES_MAX);
				const result = await placeTwapOrder({
					twap: {
						a: market.assetId,
						b: side === "buy",
						s: formattedSize,
						r: reduceOnly,
						m: minutes,
						t: twapRandomize,
					},
				});
				throwIfResponseError(result.response?.data?.status);
				updateOrder(orderId, { status: "success", outcome: "twapStarted" });
				resetForm();
				return true;
			} else {
				const plan = buildOrderPlan({
					kind: "entry",
					assetId: market.assetId,
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
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t`Order failed`;
			updateOrder(orderId, { status: "failed", error: errorMessage });
			return false;
		}
	}

	return { handleSubmit, isSubmitting };
}
