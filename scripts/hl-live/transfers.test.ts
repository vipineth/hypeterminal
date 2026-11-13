import { describe, expect, it } from "vitest";
import { transferScenarios } from "./scenarios/transfers";

function stranded() {
	const balances: Record<string, number> = { "": 0, spot: 830, xyz: 1 };
	const h = {
		user: "0x00000000000000000000000000000000000000aa",
		info: {
			userAbstraction: async () => "unifiedAccount",
			clearinghouseState: async ({ dex = "" }: { dex?: string }) => ({
				marginSummary: { accountValue: String(balances[dex]) },
				withdrawable: String(balances[dex]),
				assetPositions: [],
			}),
			spotClearinghouseState: async () => ({ balances: [{ coin: "USDC", total: String(balances.spot) }] }),
			spotMeta: async () => ({ tokens: [{ name: "USDC", tokenId: "0x6d1e7cde53ba9467b783cb7c530ce054" }] }),
		},
		principal: {
			sendAsset: async ({ sourceDex, destinationDex, amount }: Record<string, string>) => {
				balances[sourceDex] -= Number(amount);
				balances[destinationDex] += Number(amount);
			},
		},
	};
	return { h, balances };
}

describe("dex sendAsset", () => {
	it("refuses to adopt collateral an earlier transfer stranded on the builder dex", async () => {
		const { h, balances } = stranded();
		const scenario = transferScenarios.find((entry) => entry.name === "dex sendAsset");
		await expect(scenario?.run({ h: h as never, venue: { label: "xyz", dex: "xyz", coin: "xyz:NVDA" } as never })).rejects.toThrow(/xyz already holds 1 USDC/);
		expect(balances.xyz).toBe(1);
	});
});
