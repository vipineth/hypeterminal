import { deriveOrderEntry } from "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/order/derive.ts";
try {
	const d = deriveOrderEntry({ isConnected: true, market: { kind: "builderPerp", name: "xyz:NVDA", pairName: "NVDA-USDC", szDecimals: 3, maxLeverage: 20, quoteToken: { name: "USDC", displayName: "USDC" } } as never, side: "buy", conversionPrice: 171, sizeMode: "quote", sizeInput: "100", spotBalances: [{ coin: "USDC", token: 0, total: "73414.61", hold: "0", entryNtl: "0" }] as never, maxTradeSzs: [0, 0], availableToTrade: [0, 0] });
	console.log(JSON.stringify({ availableBalance: d.availableBalance, spotQuote: d.spotBalance.quoteAvailable, maxSize: d.maxSize, sizeValue: d.sizeValue }));
} catch (e) { console.log("throws:", (e as Error).message.slice(0, 120)); }
