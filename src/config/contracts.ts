export { BRIDGE2_ABI } from "./abi/bridge2";
export { USDC_ABI } from "./abi/usdc";

export const ARBITRUM_CHAIN_ID = 42161;

export const CONTRACTS = {
	arbitrum: {
		usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const,
		bridge2: "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7" as const,
	},
	arbitrumSepolia: {
		usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const,
		bridge2: "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89" as const,
	},
} as const;

export const USDC_DECIMALS = 6;
export const MIN_DEPOSIT_USDC = 5n * 10n ** 6n;
export const MIN_WITHDRAW_USD = 1;
export const WITHDRAWAL_FEE_USD = 1;
