import { getExchangeMethodConfig } from "@hypeterminal/hl-react/registries/exchange";
import { getAccumulateConfig, getDefaultThrottle } from "@hypeterminal/hl-react/registries/subscription";
import { ExchangeClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import type { ExchangeMethod, SubMethod } from "@/lib/hyperliquid";

const EXCHANGE_METHODS: ExchangeMethod[] = Object.getOwnPropertyNames(ExchangeClient.prototype).filter(
	(name) => name !== "constructor" && name !== "config_",
) as ExchangeMethod[];

const SUB_METHODS: SubMethod[] = Object.getOwnPropertyNames(SubscriptionClient.prototype).filter(
	(name) => name !== "constructor" && name !== "config_",
) as SubMethod[];

describe("exchange registry", () => {
	it("returns a config for every ExchangeClient method", () => {
		for (const method of EXCHANGE_METHODS) {
			const config = getExchangeMethodConfig(method);
			expect(config).toBeDefined();
			expect(config.client).toMatch(/^(trading|user)$/);
			expect(typeof config.injectBuilder).toBe("boolean");
			expect(typeof config.useClientKey).toBe("boolean");
		}
	});

	const EXPECTED_USER_SIGNED: ExchangeMethod[] = [
		"approveAgent",
		"approveBuilderFee",
		"cDeposit",
		"cWithdraw",
		"convertToMultiSigUser",
		"linkStakingUser",
		"sendAsset",
		"sendToEvmWithData",
		"spotSend",
		"tokenDelegate",
		"usdClassTransfer",
		"usdSend",
		"userDexAbstraction",
		"userPortfolioMargin",
		"userSetAbstraction",
		"withdraw3",
	];

	it("routes user-signed methods to user client", () => {
		for (const method of EXPECTED_USER_SIGNED) {
			const config = getExchangeMethodConfig(method);
			expect(config.client, `${method} should use user client`).toBe("user");
		}
	});

	it("routes all other methods to trading client", () => {
		const tradingMethods = EXCHANGE_METHODS.filter((m) => !EXPECTED_USER_SIGNED.includes(m));
		for (const method of tradingMethods) {
			const config = getExchangeMethodConfig(method);
			expect(config.client, `${method} should use trading client`).toBe("trading");
		}
	});

	it("routes representative L1 methods to trading client", () => {
		const expectedL1Methods: ExchangeMethod[] = ["agentEnableDexAbstraction", "setDisplayName"];
		for (const method of expectedL1Methods) {
			const config = getExchangeMethodConfig(method);
			expect(config.client, `${method} should use trading client`).toBe("trading");
		}
	});

	it("only injects builder config for order", () => {
		for (const method of EXCHANGE_METHODS) {
			const config = getExchangeMethodConfig(method);
			if (method === "order") {
				expect(config.injectBuilder, "order should inject builder").toBe(true);
			} else {
				expect(config.injectBuilder, `${method} should not inject builder`).toBe(false);
			}
		}
	});

	it("only uses clientKey for order and cancel", () => {
		for (const method of EXCHANGE_METHODS) {
			const config = getExchangeMethodConfig(method);
			if (method === "order" || method === "cancel") {
				expect(config.useClientKey, `${method} should use clientKey`).toBe(true);
			} else {
				expect(config.useClientKey, `${method} should not use clientKey`).toBe(false);
			}
		}
	});
});

describe("subscription registry", () => {
	const EXPECTED_ACCUMULATING: SubMethod[] = [
		"trades",
		"userFills",
		"userFundings",
		"userHistoricalOrders",
		"userNonFundingLedgerUpdates",
		"userTwapHistory",
		"userTwapSliceFills",
	];

	it("has accumulate config for all accumulating subscriptions", () => {
		for (const method of EXPECTED_ACCUMULATING) {
			const config = getAccumulateConfig(method);
			expect(config, `${method} should have accumulate config`).not.toBeNull();
			if (!config) continue;
			expect(typeof config.getItems).toBe("function");
			expect(typeof config.withItems).toBe("function");
			expect(typeof config.isSnapshot).toBe("function");
			expect(config.buffer.maxSize).toBeGreaterThan(0);
			expect(typeof config.buffer.getKey).toBe("function");
			expect(typeof config.buffer.compare).toBe("function");
		}
	});

	it("returns null for non-accumulating subscriptions", () => {
		const nonAccumulating = SUB_METHODS.filter((m) => !EXPECTED_ACCUMULATING.includes(m));
		for (const method of nonAccumulating) {
			expect(getAccumulateConfig(method), `${method} should not accumulate`).toBeNull();
		}
	});

	it("has default throttle only for l2Book", () => {
		expect(getDefaultThrottle("l2Book")).toBe(16);
		const others = SUB_METHODS.filter((m) => m !== "l2Book");
		for (const method of others) {
			expect(getDefaultThrottle(method), `${method} should not have default throttle`).toBeUndefined();
		}
	});
});
