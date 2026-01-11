export type RawBookLevel = { px: string; sz: string; n: number };

export type BookLevel = {
	price: number;
	size: number;
	total: number;
};

export type L2BookPriceGroupOption = {
	nSigFigs: 2 | 3 | 4 | 5;
	mantissa?: 2 | 5;
	label: string;
};

export function processLevels(raw: RawBookLevel[] | undefined, limit?: number): BookLevel[] {
	if (!raw?.length) return [];
	const levels = limit ? raw.slice(0, limit) : raw;
	let total = 0;
	return levels.map(({ px, sz }) => {
		const price = Number(px);
		const size = Number(sz);
		total += size;
		return { price, size, total };
	});
}

export function getSpreadInfo(bids: BookLevel[], asks: BookLevel[]) {
	const bestBid = bids[0]?.price;
	const bestAsk = asks[0]?.price;
	if (!bestBid || !bestAsk) return { mid: undefined, spread: undefined, spreadPct: undefined };
	const mid = (bestBid + bestAsk) / 2;
	const spread = bestAsk - bestBid;
	return { mid, spread, spreadPct: (spread / mid) * 100 };
}

export function getTickSizes(price: number | undefined): number[] {
	if (!price || price <= 0) return [];
	const magnitude = 10 ** Math.floor(Math.log10(price));
	const base = magnitude / 10000;
	return [base, base * 2, base * 5, base * 10, base * 100, base * 1000];
}

export function aggregateLevels(levels: BookLevel[], tickSize: number, side: "bid" | "ask"): BookLevel[] {
	if (!tickSize || !levels.length) return levels;

	const round =
		side === "bid"
			? (p: number) => Math.floor(p / tickSize) * tickSize
			: (p: number) => Math.ceil(p / tickSize) * tickSize;

	const grouped = new Map<number, number>();
	for (const { price, size } of levels) {
		const key = round(price);
		grouped.set(key, (grouped.get(key) ?? 0) + size);
	}

	const sorted = [...grouped.entries()].sort((a, b) => (side === "bid" ? b[0] - a[0] : a[0] - b[0]));
	let total = 0;
	return sorted.map(([price, size]) => {
		total += size;
		return { price, size, total };
	});
}

export function getMaxTotal(bids: BookLevel[], asks: BookLevel[]): number {
	const bidMax = bids[bids.length - 1]?.total ?? 0;
	const askMax = asks[asks.length - 1]?.total ?? 0;
	return Math.max(bidMax, askMax);
}

export function getPriceGroupingOptions(mid: number | undefined): L2BookPriceGroupOption[] {
	if (!mid || mid <= 0) {
		return [{ nSigFigs: 5, label: "0.01" }];
	}

	const magnitude = Math.floor(Math.log10(mid));

	return [
		{ nSigFigs: 5, mantissa: 5, label: String(10 ** (magnitude - 4) * 5) },
		{ nSigFigs: 5, mantissa: 2, label: String(10 ** (magnitude - 4) * 2) },
		{ nSigFigs: 5, label: String(10 ** (magnitude - 4)) },
		{ nSigFigs: 4, label: String(10 ** (magnitude - 3)) },
		{ nSigFigs: 3, label: String(10 ** (magnitude - 2)) },
		{ nSigFigs: 2, label: String(10 ** (magnitude - 1)) },
	].sort((a, b) => Number(a.label) - Number(b.label)) as L2BookPriceGroupOption[];
}
