/**
 * Core trading types used across order entry, validation, and execution.
 */

export type Side = "buy" | "sell";
export type SizeMode = "asset" | "usd";

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	canSubmit: boolean;
	needsApproval: boolean;
}

export interface ButtonContent {
	text: string;
	action: () => void;
	disabled: boolean;
	variant: "cyan" | "buy" | "sell";
}

export interface TpSlState {
	enabled: boolean;
	tp: string;
	sl: string;
}

export type ActiveDialog = "wallet" | "deposit" | "settings" | "marginMode" | "spotSwap" | null;

export interface OrderRequest {
	a: number;
	b: boolean;
	p: string;
	s: string;
	r: boolean;
	t: OrderTimeInForce | OrderTrigger;
}

export interface OrderTimeInForce {
	limit: { tif: "FrontendMarket" | "Gtc" };
}

export interface OrderTrigger {
	trigger: {
		isMarket: boolean;
		triggerPx: string;
		tpsl: "tp" | "sl";
	};
}

export type OrderGrouping = "na" | "positionTpsl";
