import { t } from "@lingui/core/macro";
import { createValidator, type Validator } from "../types";

interface HasConnection {
	isConnected: boolean;
}

interface HasWalletLoading {
	isWalletLoading: boolean;
}

interface HasReadyToTrade {
	isReadyToTrade: boolean;
}

export type ConnectionContext = HasConnection & HasWalletLoading & HasReadyToTrade & {
	needsAgentApproval: boolean;
};

export const walletNotConnectedValidator: Validator<HasConnection> = createValidator({
	id: "wallet-not-connected",
	code: "CONN_001",
	category: "connection",
	priority: 10,
	getMessage: () => t`Not connected`,
	validate: (ctx) => ctx.isConnected,
});

export const walletLoadingValidator: Validator<HasWalletLoading> = createValidator({
	id: "wallet-loading",
	code: "CONN_002",
	category: "connection",
	priority: 11,
	getMessage: () => t`Loading wallet...`,
	validate: (ctx) => !ctx.isWalletLoading,
});

export const signerNotReadyValidator: Validator<HasReadyToTrade> = createValidator({
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
