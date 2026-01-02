import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
	it("merges tailwind class names", () => {
		const result = cn("px-2", "px-4", "text-sm");
		expect(result).toContain("px-4");
		expect(result).toContain("text-sm");
		expect(result).not.toContain("px-2");
	});
});
