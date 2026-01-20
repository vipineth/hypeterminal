import type { OrderParameters } from "@nktkas/hyperliquid";

export type HyperliquidEnv = "Mainnet" | "Testnet";

export type BuilderConfig = OrderParameters["builder"];

export type AgentStatus =
	| "loading"
	| "needs_builder_fee"
	| "needs_agent"
	| "ready"
	| "invalid";

export type RegistrationStatus =
	| "idle"
	| "approving_fee"
	| "approving_agent"
	| "verifying"
	| "error";

export interface AgentWallet {
	privateKey: `0x${string}`;
	publicKey: `0x${string}`;
}
