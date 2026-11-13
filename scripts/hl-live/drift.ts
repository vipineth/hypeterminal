import type { InfoClient, MetaResponse, PerpDexsResponse } from "@nktkas/hyperliquid";

export interface DriftShape {
	perpDexFields: string[];
	metaFields: string[];
	assetFields: string[];
	marginModes: string[];
	userAbstractions: string[];
}

export interface DriftInputs {
	perpDexs: PerpDexsResponse;
	metas: MetaResponse[];
	userAbstractions: string[];
}

export const DRIFT_SNAPSHOT_PATH = new URL("./drift-snapshot.json", import.meta.url).pathname;

const LABELS: Record<keyof DriftShape, string> = {
	perpDexFields: "perpDexs field",
	metaFields: "meta field",
	assetFields: "meta universe field",
	marginModes: "marginMode value",
	userAbstractions: "userAbstraction value",
};

function sorted(values: Iterable<string>): string[] {
	return [...new Set(values)].sort();
}

export function collectDrift({ perpDexs, metas, userAbstractions }: DriftInputs): DriftShape {
	const assets = metas.flatMap((meta) => meta.universe);
	return {
		perpDexFields: sorted(perpDexs.flatMap((dex) => (dex ? Object.keys(dex) : []))),
		metaFields: sorted(metas.flatMap((meta) => Object.keys(meta))),
		assetFields: sorted(assets.flatMap((asset) => Object.keys(asset))),
		marginModes: sorted(assets.flatMap((asset) => (asset.marginMode ? [asset.marginMode] : []))),
		userAbstractions: sorted(userAbstractions),
	};
}

export function diffDrift(snapshot: DriftShape, live: DriftShape): string[] {
	return (Object.keys(LABELS) as (keyof DriftShape)[]).flatMap((key) => {
		const known = new Set(snapshot[key]);
		return live[key].filter((value) => !known.has(value)).map((value) => `new ${LABELS[key]}: ${value}`);
	});
}

export function mergeDrift(snapshot: DriftShape, live: DriftShape): DriftShape {
	const merged = { ...snapshot };
	for (const key of Object.keys(LABELS) as (keyof DriftShape)[]) merged[key] = sorted([...snapshot[key], ...live[key]]);
	return merged;
}

export async function fetchDriftInputs(info: InfoClient, users: `0x${string}`[]): Promise<DriftInputs> {
	const [perpDexs, metas, userAbstractions] = await Promise.all([
		info.perpDexs(),
		info.allPerpMetas(),
		Promise.all(users.map((user) => info.userAbstraction({ user }))),
	]);
	return { perpDexs, metas, userAbstractions };
}
