import type { OrderStatusResponse } from "@nktkas/hyperliquid";

export type PlacedOutcome = "filled" | "resting" | "triggerSet";

export type LegState =
	| { status: "placed"; outcome: PlacedOutcome; filledSz?: string }
	| { status: "rejected"; reason?: string }
	| { status: "canceled" }
	| { status: "missing" };

export type LegFate = "placed" | "rejected" | "unknown";

export function toLegState(status: unknown): LegState {
	if (status === "waitingForTrigger") return { status: "placed", outcome: "triggerSet" };
	if (status === "waitingForFill") return { status: "placed", outcome: "resting" };
	if (isRecord(status)) {
		if (typeof status.error === "string") return { status: "rejected", reason: status.error };
		if ("resting" in status) return { status: "placed", outcome: "resting" };
		if (isRecord(status.filled) && typeof status.filled.totalSz === "string") {
			return { status: "placed", outcome: "filled", filledSz: status.filled.totalSz };
		}
	}
	return { status: "placed", outcome: "filled" };
}

export function lookupToLegState(lookup: OrderStatusResponse): LegState {
	if (lookup.status === "unknownOid") return { status: "missing" };
	const { status, order } = lookup.order;
	if (status === "filled") return { status: "placed", outcome: "filled" };
	if (status === "open" || status === "triggered") {
		return { status: "placed", outcome: order.isTrigger ? "triggerSet" : "resting" };
	}
	if (status === "rejected" || status.endsWith("Rejected")) return { status: "rejected" };
	return { status: "canceled" };
}

export function toLegFate(state: LegState): LegFate {
	switch (state.status) {
		case "placed":
		case "canceled":
			return "placed";
		case "rejected":
			return "rejected";
		case "missing":
			return "unknown";
	}
}

export function readStatuses(response: unknown): unknown[] {
	const data = isRecord(response) && isRecord(response.data) ? response.data : null;
	return data && Array.isArray(data.statuses) ? data.statuses : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
