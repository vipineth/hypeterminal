import type { ChainType, ExtendedChain, GetWalletBalanceExtendedResponse, WalletTokenExtended } from "@lifi/sdk";
import { getChains } from "@lifi/sdk";
import { useQuery } from "@tanstack/react-query";
import Big from "big.js";
import { getLiFiClient } from "./config";

const DUST_THRESHOLD_USD = 2;

export interface BridgeToken {
	chainId: number;
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	logoURI: string | undefined;
	priceUSD: string;
	amount: string;
	amountUSD: number;
	chainName: string;
	chainLogoURI: string | undefined;
	isDust: boolean;
}

async function getWalletBalances(walletAddress: string): Promise<Record<number, WalletTokenExtended[]>> {
	const { apiUrl, integrator } = getLiFiClient().config;
	const response = await fetch(`${apiUrl}/wallets/${walletAddress}/balances?extended=true`, {
		headers: { "x-lifi-integrator": integrator },
	});
	if (!response.ok) throw new Error(`LI.FI balances request failed: ${response.status}`);
	const body: GetWalletBalanceExtendedResponse = await response.json();
	return body.balances ?? {};
}

function buildTokenList(
	balancesByChain: Record<number, WalletTokenExtended[]>,
	chainsMap: Map<number, ExtendedChain>,
): BridgeToken[] {
	const tokens: BridgeToken[] = [];

	for (const [chainIdStr, chainTokens] of Object.entries(balancesByChain)) {
		const chainId = Number(chainIdStr);
		const chain = chainsMap.get(chainId);

		for (const token of chainTokens) {
			if (!token.amount || token.amount === "0") continue;

			const amountUSD = Big(token.amount)
				.div(Big(10).pow(token.decimals))
				.times(token.priceUSD || "0")
				.toNumber();

			if (amountUSD <= 0) continue;

			tokens.push({
				chainId,
				address: token.address,
				symbol: token.symbol,
				name: token.name,
				decimals: token.decimals,
				logoURI: token.logoURI,
				priceUSD: token.priceUSD,
				amount: token.amount,
				amountUSD,
				chainName: chain?.name ?? `Chain ${chainId}`,
				chainLogoURI: chain?.logoURI,
				isDust: amountUSD < DUST_THRESHOLD_USD,
			});
		}
	}

	tokens.sort((a, b) => b.amountUSD - a.amountUSD);
	return tokens;
}

export function useBridgeBalances(walletAddress: string | undefined) {
	return useQuery({
		queryKey: ["lifi-balances", walletAddress],
		queryFn: async () => {
			const [balancesByChain, chains] = await Promise.all([
				getWalletBalances(walletAddress as string),
				getChains(getLiFiClient(), { chainTypes: ["EVM" as ChainType] }),
			]);

			const chainsMap = new Map<number, ExtendedChain>();
			for (const chain of chains) {
				chainsMap.set(chain.id, chain);
			}

			return buildTokenList(balancesByChain, chainsMap);
		},
		enabled: !!walletAddress,
		staleTime: 60_000,
	});
}
