import type { HttpTransport } from "@nktkas/hyperliquid";
import {
	approveAgent,
	cancel,
	type CancelParameters,
	type ExchangeSingleWalletConfig,
	type OrderParameters,
	order,
	updateLeverage,
} from "@nktkas/hyperliquid/api/exchange";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";

export type TimeInForce = "Gtc" | "Ioc" | "Alo" | "FrontendMarket" | "LiquidationMarket";

export type CurrentLeverageInfo =
	| { type: "cross" | "isolated"; value: number }
	| { type: "isolated"; value: number; rawUsd: string }
	| null
	| undefined;

export function makeExchangeConfig(transport: HttpTransport, wallet: AbstractWallet): ExchangeSingleWalletConfig {
	return { transport, wallet };
}

export async function ensureLeverage(
	config: ExchangeSingleWalletConfig,
	params: { asset: number; isCross: boolean; leverage: number; current?: CurrentLeverageInfo },
) {
	const desiredType = params.isCross ? "cross" : "isolated";
	const currentType = params.current?.type;
	const currentValue = params.current?.value;

	const shouldUpdate = currentType !== desiredType || currentValue !== params.leverage;
	if (!shouldUpdate) return;

	await updateLeverage(config, { asset: params.asset, isCross: params.isCross, leverage: params.leverage });
}

export async function placeSingleOrder(
	config: ExchangeSingleWalletConfig,
	params: { order: OrderParameters["orders"][number]; grouping?: OrderParameters["grouping"] },
) {
	return await order(config, { orders: [params.order], grouping: params.grouping ?? "na" });
}

export async function cancelOrders(
	config: ExchangeSingleWalletConfig,
	params: { cancels: CancelParameters["cancels"] },
) {
	return await cancel(config, { cancels: params.cancels });
}

export async function approveApiWallet(
	config: ExchangeSingleWalletConfig,
	params: { agentAddress: `0x${string}`; agentName?: string | null },
) {
	return await approveAgent(config, { agentAddress: params.agentAddress, agentName: params.agentName });
}

export function isAgentApproved(
	extraAgents: Array<{ address: `0x${string}`; validUntil: number }> | null | undefined,
	agentAddress: string | null | undefined,
	nowMs = Date.now(),
) {
	if (!extraAgents || !agentAddress) return false;
	const needle = agentAddress.toLowerCase();
	return extraAgents.some((a) => a.address.toLowerCase() === needle && a.validUntil > nowMs);
}
