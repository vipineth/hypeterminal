import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@nktkas/hyperliquid/api/exchange", () => ({
	order: vi.fn(async () => ({ statuses: [] })),
	updateLeverage: vi.fn(async () => {}),
	approveAgent: vi.fn(async () => {}),
	cancel: vi.fn(async () => ({ response: { data: { statuses: [] } } })),
}));

import { approveAgent, cancel, order, updateLeverage } from "@nktkas/hyperliquid/api/exchange";
import { approveApiWallet, cancelOrders, ensureLeverage, isAgentApproved, placeSingleOrder } from "./exchange";

describe("exchange", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("updates leverage only when needed", async () => {
		const config = {} as never;

		await ensureLeverage(config, { asset: 1, isCross: true, leverage: 10, current: { type: "cross", value: 10 } });
		expect(updateLeverage).not.toHaveBeenCalled();

		await ensureLeverage(config, { asset: 1, isCross: true, leverage: 10, current: { type: "isolated", value: 5 } });
		expect(updateLeverage).toHaveBeenCalledWith(config, { asset: 1, isCross: true, leverage: 10 });
	});

	it("places a single order with default grouping", async () => {
		const config = {} as never;
		const orderParams = { a: 1, b: true, p: "100", s: "1", r: false, t: { limit: { tif: "Gtc" } } };

		await placeSingleOrder(config, { order: orderParams });
		expect(order).toHaveBeenCalledWith(config, { orders: [orderParams], grouping: "na" });
	});

	it("approves api wallet via exchange client", async () => {
		const config = {} as never;
		await approveApiWallet(config, { agentAddress: "0xabc" });
		expect(approveAgent).toHaveBeenCalledWith(config, { agentAddress: "0xabc", agentName: undefined });
	});

	it("cancels orders via exchange client", async () => {
		const config = {} as never;
		const cancels = [{ a: 1, o: 123 }];
		await cancelOrders(config, { cancels });
		expect(cancel).toHaveBeenCalledWith(config, { cancels });
	});

	it("checks agent approval status", () => {
		const now = Date.now();
		const agents = [
			{ address: "0xabc", validUntil: now + 1000 },
			{ address: "0xdef", validUntil: now - 1000 },
		];

		expect(isAgentApproved(agents, "0xAbc", now)).toBe(true);
		expect(isAgentApproved(agents, "0xdef", now)).toBe(false);
		expect(isAgentApproved(null, "0xabc", now)).toBe(false);
	});
});
