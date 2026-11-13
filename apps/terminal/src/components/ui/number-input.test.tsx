import type * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NumberInput } from "@/components/ui/number-input";
import { typeKeys } from "@/test/type-keys";

const rendered = vi.hoisted(() => ({ props: {} as React.ComponentProps<"input"> }));

vi.mock("@base-ui/react/input", () => ({
	Input: (props: React.ComponentProps<"input">) => {
		rendered.props = props;
		return null;
	},
}));

function typeInto(maxAllowedDecimals: number, keys: string, initialValue = ""): string {
	return typeKeys(
		(value, commit) => {
			renderToString(
				<NumberInput value={value} maxAllowedDecimals={maxAllowedDecimals} onChange={(e) => commit(e.target.value)} />,
			);
			return rendered.props;
		},
		[...keys],
		initialValue,
	);
}

describe("NumberInput typing", () => {
	it("keeps every typed digit within the decimal cap", () => {
		expect(typeInto(2, "27.21")).toBe("27.21");
	});

	it("drops the digits past the decimal cap and keeps the point", () => {
		expect(typeInto(2, "1.234")).toBe("1.23");
	});

	it("never turns 27.21 into 2721 when no decimals are allowed", () => {
		expect(typeInto(0, "27.21")).toBe("27.");
	});

	it("never turns 1.5 into 15 when no decimals are allowed", () => {
		expect(typeInto(0, "1.5")).toBe("1.");
	});
});
