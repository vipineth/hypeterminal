import { describe, expect, it } from "vitest";
import { type ScaleContext, scaleLevelMinNotionalValidator } from "@/lib/errors/definitions/scale";

const SCALE: ScaleContext = {
	scaleOrder: true,
	scaleStartPriceNum: 1,
	scaleEndPriceNum: 20,
	scaleLevelsNum: 2,
	sizeValue: 4,
	price: 10.5,
	markPx: 10,
};

describe("scaleLevelMinNotionalValidator", () => {
	it("fails when the cheapest leg is under the minimum even though the average leg is not", () => {
		expect(scaleLevelMinNotionalValidator.validate(SCALE)).toBe(false);
	});

	it("passes when every leg clears the minimum", () => {
		expect(scaleLevelMinNotionalValidator.validate({ ...SCALE, sizeValue: 20 })).toBe(true);
	});
});
