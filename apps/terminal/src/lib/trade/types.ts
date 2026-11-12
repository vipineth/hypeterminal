/**
 * Core trading types used across order entry, validation, and execution.
 */

export type Side = "buy" | "sell";
export type SizeMode = "base" | "quote";

export interface FormValidationResult {
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

export type ActiveModal = "wallet" | "marginMode" | null;
