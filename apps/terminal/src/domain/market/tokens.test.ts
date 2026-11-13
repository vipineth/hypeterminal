import { describe, expect, it } from "vitest";
import { getTokenDisplayNames } from "@/domain/market/tokens";

function unit(name: string) {
	return { name, fullName: `Unit ${name.slice(1)}` };
}

describe("getTokenDisplayNames", () => {
	it("drops the U from a Unit token whose plain name is free", () => {
		expect(getTokenDisplayNames([unit("UBTC"), { name: "USDC" }])).toEqual(["BTC", "USDC"]);
	});

	it("keeps the U when another token already has the plain name", () => {
		expect(getTokenDisplayNames([unit("UANSEM"), { name: "ANSEM" }])).toEqual(["UANSEM", "ANSEM"]);
		expect(getTokenDisplayNames([{ name: "ANSEM" }, unit("UANSEM")])).toEqual(["ANSEM", "UANSEM"]);
	});

	it("keeps both real names when two tokens claim the same plain name", () => {
		expect(getTokenDisplayNames([{ name: "USDT0" }, unit("UUSDT")])).toEqual(["USDT0", "UUSDT"]);
	});

	it("applies the same check to fixed replacements", () => {
		expect(getTokenDisplayNames([{ name: "USDT0" }])).toEqual(["USDT"]);
		expect(getTokenDisplayNames([{ name: "USDT0" }, { name: "USDT" }])).toEqual(["USDT0", "USDT"]);
	});
});
