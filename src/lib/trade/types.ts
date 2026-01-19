export type Side = "buy" | "sell";
export type SizeMode = "asset" | "usd";
export type ApiSide = "B" | "A";

export function toApiSide(side: Side): ApiSide {
	return side === "buy" ? "B" : "A";
}

export function fromApiSide(side: ApiSide): Side {
	return side === "B" ? "buy" : "sell";
}

export function isApiBuy(side: ApiSide): boolean {
	return side === "B";
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	canSubmit: boolean;
	needsApproval: boolean;
}

export type ActiveDialog = "wallet" | "deposit" | "settings" | "marginMode" | null;
