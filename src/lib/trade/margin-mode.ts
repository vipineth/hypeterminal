export type MarginMode = "cross" | "isolated";

interface LeverageConfig {
	type: "cross" | "isolated";
	value: number;
	rawUsd?: string;
}

export function isIsolatedLeverage(leverage: LeverageConfig | undefined | null): boolean {
	return leverage?.type === "isolated";
}

export function getMarginModeFromLeverage(leverage: LeverageConfig | undefined | null): MarginMode {
	return leverage?.type === "isolated" ? "isolated" : "cross";
}
