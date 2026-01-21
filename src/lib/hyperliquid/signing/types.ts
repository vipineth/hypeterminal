import type { OrderParameters } from "@nktkas/hyperliquid";
import type { Address, Hex } from "viem";

export type HyperliquidEnv = "Mainnet" | "Testnet";

export type BuilderConfig = OrderParameters["builder"];

export type RegistrationStatus = "idle" | "approving_fee" | "approving_agent" | "verifying" | "error";

export interface AgentWallet {
	privateKey: Hex;
	publicKey: Address;
}
