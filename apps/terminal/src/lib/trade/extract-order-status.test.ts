import { describe, expect, it } from "vitest";
import { interpretOrderStatuses, NO_EXCHANGE_RESPONSE } from "@/lib/trade/extract-order-status";

describe("interpretOrderStatuses (unified result handling)", () => {
	it("treats a status-level error as a failure (the positions-tab bug this fixes)", () => {
		expect(interpretOrderStatuses([{ error: "Insufficient margin" }])).toEqual({
			ok: false,
			error: "Insufficient margin",
		});
	});

	it("joins multiple status errors", () => {
		expect(interpretOrderStatuses([{ error: "a" }, { error: "b" }])).toEqual({ ok: false, error: "a; b" });
	});

	it("fails an empty response instead of reporting silent success", () => {
		expect(interpretOrderStatuses([])).toEqual({ ok: false, error: NO_EXCHANGE_RESPONSE });
	});

	it("reports filled and resting outcomes", () => {
		expect(interpretOrderStatuses([{ filled: { totalSz: "1" } }])).toEqual({ ok: true, outcome: "filled" });
		expect(interpretOrderStatuses([{ resting: { oid: 1 } }])).toEqual({ ok: true, outcome: "resting" });
		expect(interpretOrderStatuses(["waitingForFill"])).toEqual({ ok: true, outcome: "resting" });
		expect(interpretOrderStatuses(["waitingForTrigger"])).toEqual({ ok: true, outcome: "triggerSet" });
	});

	it("lets any error win over a resting sibling", () => {
		expect(interpretOrderStatuses([{ resting: { oid: 1 } }, { error: "rejected" }])).toEqual({
			ok: false,
			error: "rejected",
		});
	});
});
