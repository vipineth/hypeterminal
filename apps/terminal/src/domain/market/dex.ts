import type { Market } from "./model";

export function getPositionDex(market: Market): string | undefined {
	return market.kind === "spot" ? undefined : market.dex.name;
}
