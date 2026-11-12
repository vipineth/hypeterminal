import type { LiFiStep } from "@lifi/sdk";
import { getQuote } from "@lifi/sdk";
import { useQuery } from "@tanstack/react-query";
import Big from "big.js";

import { HYPERCORE_CHAIN_ID, HYPERCORE_USDC_ADDRESS } from "@/config/contracts";
import { getLiFiClient } from "./config";

interface QuoteParams {
	fromChainId: number;
	fromTokenAddress: string;
	fromTokenDecimals: number;
	fromAddress: string;
	amount: string;
}

function toSmallestUnit(amount: string, decimals: number): string {
	return Big(amount).times(Big(10).pow(decimals)).toFixed(0);
}

function isValidAmount(amount: string): boolean {
	if (!amount || amount === "." || amount === "0") return false;
	try {
		return Big(amount).gt(0);
	} catch {
		return false;
	}
}

export interface BridgeQuote {
	step: LiFiStep;
	fromAmount: string;
	fromAmountUSD: string;
	toAmount: string;
	toAmountMin: string;
	toAmountUSD: string;
	executionDuration: number;
	gasCosts: Array<{ amount: string; amountUSD: string; token: { symbol: string } }>;
	feeCosts: Array<{ name: string; amount: string; amountUSD: string; token: { symbol: string }; description: string }>;
	totalFeesUSD: string;
}

function transformQuote(step: LiFiStep): BridgeQuote {
	const estimate = step.estimate ?? {
		fromAmount: "0",
		fromAmountUSD: "0",
		toAmount: "0",
		toAmountMin: "0",
		toAmountUSD: "0",
		executionDuration: 0,
		approvalAddress: "",
		gasCosts: [],
		feeCosts: [],
	};

	const totalFeesUSD = Big(
		(estimate.gasCosts ?? []).reduce(
			(sum, g) =>
				Big(sum)
					.plus(g.amountUSD || "0")
					.toString(),
			"0",
		),
	)
		.plus(
			(estimate.feeCosts ?? []).reduce(
				(sum, f) =>
					Big(sum)
						.plus(f.amountUSD || "0")
						.toString(),
				"0",
			),
		)
		.toString();

	return {
		step,
		fromAmount: estimate.fromAmount,
		fromAmountUSD: estimate.fromAmountUSD ?? "0",
		toAmount: estimate.toAmount,
		toAmountMin: estimate.toAmountMin,
		toAmountUSD: estimate.toAmountUSD ?? "0",
		executionDuration: estimate.executionDuration,
		gasCosts: (estimate.gasCosts ?? []).map((g) => ({
			amount: g.amount,
			amountUSD: g.amountUSD,
			token: { symbol: g.token.symbol },
		})),
		feeCosts: (estimate.feeCosts ?? []).map((f) => ({
			name: f.name,
			amount: f.amount,
			amountUSD: f.amountUSD,
			token: { symbol: f.token.symbol },
			description: f.description,
		})),
		totalFeesUSD,
	};
}

export function useBridgeQuote(params: QuoteParams | null) {
	const enabled = params !== null && isValidAmount(params.amount);

	return useQuery({
		queryKey: ["lifi-quote", params?.fromChainId, params?.fromTokenAddress, params?.fromAddress, params?.amount],
		queryFn: async (): Promise<BridgeQuote> => {
			const p = params as QuoteParams;
			const step = await getQuote(getLiFiClient(), {
				fromChain: p.fromChainId,
				fromToken: p.fromTokenAddress,
				fromAddress: p.fromAddress,
				fromAmount: toSmallestUnit(p.amount, p.fromTokenDecimals),
				toChain: HYPERCORE_CHAIN_ID,
				toToken: HYPERCORE_USDC_ADDRESS,
				toAddress: p.fromAddress,
				executionType: "all",
			});
			return transformQuote(step);
		},
		enabled,
		staleTime: 30_000,
		refetchInterval: 30_000,
		retry: false,
	});
}
