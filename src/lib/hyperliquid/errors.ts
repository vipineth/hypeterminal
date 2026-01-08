export class ProviderNotFoundError extends Error {
	constructor() {
		super("HyperliquidProvider is missing in the React tree");
		this.name = "ProviderNotFoundError";
	}
}

export class MissingTransportError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MissingTransportError";
	}
}

export class MissingWalletError extends Error {
	constructor() {
		super("Wallet is required for exchange actions");
		this.name = "MissingWalletError";
	}
}
