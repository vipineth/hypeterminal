import { readFileSync } from "node:fs";
import { buildOrderPlan } from "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/order-intent.ts";
import { formatPriceForOrder, formatSizeForOrder } from "/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/domain/trade/orders.ts";
import { formatPrice, formatSize } from "/Users/ankit/Documents/make/hypeterminal/node_modules/.pnpm/@nktkas+hyperliquid@0.33.3_typescript@7.0.2/node_modules/@nktkas/hyperliquid/esm/utils/mod.js";

const metas = JSON.parse(readFileSync("/private/tmp/claude-501/-Users-ankit-Documents-make-hypeterminal/44e5db3f-67f9-455b-98bf-30786ec67377/scratchpad/allPerpMetas.json", "utf8"));
const ctxs = JSON.parse(readFileSync("/private/tmp/claude-501/-Users-ankit-Documents-make-hypeterminal/44e5db3f-67f9-455b-98bf-30786ec67377/scratchpad/allDexsCtxs.json", "utf8"));
const dexs = JSON.parse(readFileSync("/private/tmp/claude-501/-Users-ankit-Documents-make-hypeterminal/44e5db3f-67f9-455b-98bf-30786ec67377/scratchpad/perpDexs.json", "utf8"));

function validTick(p: string, szDecimals: number): boolean {
	const n = Number(p);
	if (!(n > 0)) return false;
	const dec = p.includes(".") ? p.split(".")[1].length : 0;
	if (dec > Math.max(6 - szDecimals, 0)) return false;
	if (Number.isInteger(n)) return true;
	const sig = p.replace(".", "").replace(/^0+/, "").length;
	return sig <= 5;
}

let checked = 0;
const badPrice: string[] = [];
const badSize: string[] = [];
for (let d = 0; d < metas.length; d++) {
	const dexName = d === 0 ? "" : dexs[d].name;
	const dexCtx = ctxs.find((c: [string, unknown[]]) => c[0] === dexName)?.[1] ?? [];
	metas[d].universe.forEach((asset: any, i: number) => {
		if (asset.isDelisted) return;
		const markPx = Number(dexCtx[i]?.markPx ?? 0);
		if (!(markPx > 0)) return;
		const assetId = d === 0 ? i : 100000 + d * 10000 + i;
		for (const side of ["buy", "sell"] as const) {
			const plan = buildOrderPlan({
				kind: "entry", assetId, side, orderType: "market", sizeValue: 10, szDecimals: asset.szDecimals,
				markPx, price: markPx, slippageBps: 250, reduceOnly: false, tif: "Gtc",
				limitPriceInput: "", triggerPriceInput: "", scaleStartPriceInput: "", scaleEndPriceInput: "",
				scaleLevelsNum: null, tpSlEnabled: false, canUseTpSl: false, tpPriceNum: null, slPriceNum: null,
			});
			const o = plan.orders[0];
			checked++;
			if (!validTick(o.p, asset.szDecimals)) badPrice.push(`${asset.name} sz${asset.szDecimals} mark=${markPx} ${side} app=${o.p} sdk=${formatPrice(markPx * (side === "buy" ? 1.025 : 0.975), asset.szDecimals)}`);
		}
		const s = formatSizeForOrder(10, asset.szDecimals);
		if (s !== formatSize(10, asset.szDecimals)) badSize.push(`${asset.name} sz${asset.szDecimals} size10 app=${s} sdk=${formatSize(10, asset.szDecimals)}`);
	});
}
console.log("market plans checked", checked, "invalid price ticks", badPrice.length, "size mismatches", badSize.length);
console.log(badPrice.slice(0, 12).join("\n"));
console.log(badSize.slice(0, 8).join("\n"));
const nvda = metas[1].universe.findIndex((a: any) => a.name === "xyz:NVDA");
console.log("xyz:NVDA", JSON.stringify(buildOrderPlan({ kind: "entry", assetId: 110000 + nvda, side: "buy", orderType: "market", sizeValue: 0.123, szDecimals: 3, markPx: Number(ctxs.find((c: any) => c[0] === "xyz")[1][nvda].markPx), price: 0, slippageBps: 250, reduceOnly: false, tif: "Gtc", limitPriceInput: "", triggerPriceInput: "", scaleStartPriceInput: "", scaleEndPriceInput: "", scaleLevelsNum: null, tpSlEnabled: false, canUseTpSl: false, tpPriceNum: null, slPriceNum: null })));
console.log("formatSizeForOrder(10,0)=", formatSizeForOrder(10, 0), "(20,0)=", formatSizeForOrder(20, 0), "(100,0)=", formatSizeForOrder(100, 0), "formatPriceForOrder(0.123456)=", formatPriceForOrder(0.123456));
