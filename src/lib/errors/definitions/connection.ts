import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

export interface ConnectionContext {
	isConnected: boolean;
	isWalletLoading: boolean;
	needsAgentApproval: boolean;
	isReadyToTrade: boolean;
}

export const walletNotConnectedValidator: Validator<ConnectionContext> = createValidator({
	id: "wallet-not-connected",
	code: "CONN_001",
	category: "connection",
	priority: 10,
	getMessage: () => t`Not connected`,
	validate: (ctx) => ctx.isConnected,
});

export const walletLoadingValidator: Validator<ConnectionContext> = createValidator({
	id: "wallet-loading",
	code: "CONN_002",
	category: "connection",
	priority: 11,
	getMessage: () => t`Loading wallet...`,
	validate: (ctx) => !ctx.isWalletLoading,
});

export const signerNotReadyValidator: Validator<ConnectionContext> = createValidator({
	id: "signer-not-ready",
	code: "CONN_003",
	category: "connection",
	priority: 60,
	getMessage: () => t`Signer not ready`,
	validate: (ctx) => ctx.isReadyToTrade,
});

export const connectionValidators: Validator<ConnectionContext>[] = [
	walletNotConnectedValidator,
	walletLoadingValidator,
	signerNotReadyValidator,
];
