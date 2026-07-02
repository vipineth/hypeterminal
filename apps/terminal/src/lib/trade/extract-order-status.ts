export type OrderOutcome = "filled" | "resting" | "triggerSet" | "twapStarted";

export type OrderResult = { ok: true; outcome: OrderOutcome } | { ok: false; error: string };

export const NO_EXCHANGE_RESPONSE = "No response from exchange";

export function interpretOrderStatuses(statuses: unknown[]): OrderResult {
	const errors = extractStatusErrors(statuses);
	if (errors.length > 0) return { ok: false, error: errors.join("; ") };
	if (statuses.length === 0) return { ok: false, error: NO_EXCHANGE_RESPONSE };
	return { ok: true, outcome: deriveOrderOutcome(statuses) };
}

export function extractStatusErrors(statuses: unknown[]): string[] {
	const errors: string[] = [];
	for (const status of statuses) {
		if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
			errors.push(status.error);
		}
	}
	return errors;
}

export function deriveOrderOutcome(statuses: unknown[]): OrderOutcome {
	const primary = statuses[0];
	if (primary === "waitingForTrigger") return "triggerSet";
	if (primary === "waitingForFill") return "resting";
	if (primary && typeof primary === "object") {
		if ("resting" in primary) return "resting";
		if ("filled" in primary) return "filled";
	}
	return "filled";
}
