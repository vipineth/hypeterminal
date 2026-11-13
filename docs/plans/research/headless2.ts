const r: Record<string, string> = {};
for (const [name, path] of [["derive", "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/order/derive.ts"], ["perpStack", "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/lib/errors/stacks/perp-order.ts"], ["balances", "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/balances.ts"], ["status", "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/lib/trade/extract-order-status.ts"], ["agentUtils", "/Users/ankit/Documents/make/hypeterminal/packages/hl-react/src/signing/agent-utils.ts"]] as const) {
	try {
		const m = await import(path);
		r[name] = "loaded: " + Object.keys(m).join(",");
		if (name === "perpStack") {
			try { r.perpRun = JSON.stringify(m.validatePerpOrder({ isConnected: true, isWalletLoading: false, isReadyToTrade: true, needsAgentApproval: false, availableBalance: 0, hasMarket: true, hasAssetIndex: true, orderType: "market", markPx: 171, usesLimitPrice: false, usesTriggerPrice: false, price: 171, triggerPriceNum: null, sizeValue: 0.1, orderValue: 17.1, maxSize: 0, tpSlEnabled: false, canUseTpSl: false, tpPriceNum: null, slPriceNum: null, side: "buy", stopOrder: false, takeProfitOrder: false, scaleOrder: false, twapOrder: false, scaleStartPriceNum: null, scaleEndPriceNum: null, scaleLevelsNum: null, twapMinutesNum: null })); } catch (e) { r.perpRun = "throws: " + (e as Error).message.slice(0, 160); }
		}
		if (name === "agentUtils") r.fee = m.convertFeeToPercentageString(10);
	} catch (e) { r[name] = "FAILS: " + (e as Error).message.slice(0, 200); }
}
console.log(JSON.stringify(r, null, 1));
