import { readFileSync } from "node:fs";
import type { MetaResponse, PerpDexsResponse } from "@nktkas/hyperliquid";
import { describe, expect, it } from "vitest";
import { collectDrift, DRIFT_SNAPSHOT_PATH, type DriftShape, diffDrift } from "./drift";

const snapshot = JSON.parse(readFileSync(DRIFT_SNAPSHOT_PATH, "utf8")) as DriftShape;

function liveFrom(shape: DriftShape) {
	const asset = Object.fromEntries(shape.assetFields.map((field) => [field, 1]));
	return {
		perpDexs: [null, Object.fromEntries(shape.perpDexFields.map((field) => [field, ""]))] as unknown as PerpDexsResponse,
		metas: [
			{
				...Object.fromEntries(shape.metaFields.map((field) => [field, []])),
				universe: shape.marginModes.map((marginMode) => ({ ...asset, marginMode })),
			},
		] as unknown as MetaResponse[],
		userAbstractions: shape.userAbstractions,
	};
}

describe("drift check", () => {
	it("passes when live meta matches the committed snapshot", () => {
		expect(diffDrift(snapshot, collectDrift(liveFrom(snapshot)))).toEqual([]);
	});

	it("fails on a marginMode value the snapshot has never seen", () => {
		const live = liveFrom({ ...snapshot, marginModes: [...snapshot.marginModes, "fakeMode"] });
		expect(diffDrift(snapshot, collectDrift(live))).toEqual(["new marginMode value: fakeMode"]);
	});

	it("fails on a new meta universe field and a new userAbstraction value", () => {
		const live = liveFrom({
			...snapshot,
			assetFields: [...snapshot.assetFields, "isNew"],
			userAbstractions: [...snapshot.userAbstractions, "superAccount"],
		});
		expect(diffDrift(snapshot, collectDrift(live))).toEqual([
			"new meta universe field: isNew",
			"new userAbstraction value: superAccount",
		]);
	});

	it("ignores a field that disappeared", () => {
		const live = liveFrom({ ...snapshot, perpDexFields: snapshot.perpDexFields.slice(1) });
		expect(diffDrift(snapshot, collectDrift(live))).toEqual([]);
	});
});
