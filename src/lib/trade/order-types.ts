import { t } from "@lingui/core/macro";
import type { OrderParameters, TwapOrderParameters } from "@nktkas/hyperliquid";

export const ORDER_TYPES = [
	"market",
	"limit",
	"stopMarket",
	"stopLimit",
	"takeProfitMarket",
	"takeProfitLimit",
	"twap",
	"scale",
] as const;

export type OrderType = (typeof ORDER_TYPES)[number];
export type AdvancedOrderType = Exclude<OrderType, "market" | "limit">;
export type AdvancedOrderGroup = "trigger" | "execution";
export type ExchangeOrder = OrderParameters["orders"][number];
export type TwapOrderParams = TwapOrderParameters;

export const ADVANCED_ORDER_TYPES: AdvancedOrderType[] = [
	"stopMarket",
	"stopLimit",
	"takeProfitMarket",
	"takeProfitLimit",
	"twap",
	"scale",
];

export const ADVANCED_ORDER_GROUPS: Record<AdvancedOrderType, AdvancedOrderGroup> = {
	stopMarket: "trigger",
	stopLimit: "trigger",
	takeProfitMarket: "trigger",
	takeProfitLimit: "trigger",
	twap: "execution",
	scale: "execution",
};

export const ADVANCED_ORDER_LABELS: Record<AdvancedOrderType, string> = {
	stopMarket: t`Stop Market`,
	stopLimit: t`Stop Limit`,
	takeProfitMarket: t`Take Market`,
	takeProfitLimit: t`Take Limit`,
	twap: t`TWAP`,
	scale: t`Scale`,
};

export function getAdvancedOrderLabel(orderType: OrderType, fallback: string): string {
	return isAdvancedOrderType(orderType) ? ADVANCED_ORDER_LABELS[orderType] : fallback;
}

export function isAdvancedOrderType(orderType: OrderType): orderType is AdvancedOrderType {
	return orderType !== "market" && orderType !== "limit";
}

export function isStopOrderType(orderType: OrderType): boolean {
	return orderType === "stopMarket" || orderType === "stopLimit";
}

export function isTakeProfitOrderType(orderType: OrderType): boolean {
	return orderType === "takeProfitMarket" || orderType === "takeProfitLimit";
}

export function isTriggerOrderType(orderType: OrderType): boolean {
	return isStopOrderType(orderType) || isTakeProfitOrderType(orderType);
}

export function isScaleOrderType(orderType: OrderType): boolean {
	return orderType === "scale";
}

export function isTwapOrderType(orderType: OrderType): boolean {
	return orderType === "twap";
}

export function usesLimitPrice(orderType: OrderType): boolean {
	return orderType === "limit" || orderType === "stopLimit" || orderType === "takeProfitLimit";
}

export function usesTriggerPrice(orderType: OrderType): boolean {
	return isTriggerOrderType(orderType);
}

export function canUseTpSl(orderType: OrderType): boolean {
	return orderType === "market" || orderType === "limit";
}

export function isTakerOrderType(orderType: OrderType): boolean {
	return (
		orderType === "market" || orderType === "stopMarket" || orderType === "takeProfitMarket" || orderType === "twap"
	);
}

export function isMarketExecutionOrderType(orderType: OrderType): boolean {
	return orderType === "market" || orderType === "stopMarket" || orderType === "takeProfitMarket";
}

export function getTabsOrderType(orderType: OrderType): "market" | "limit" | "advanced" {
	return orderType === "market" || orderType === "limit" ? orderType : "advanced";
}
