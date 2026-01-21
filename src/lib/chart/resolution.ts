import type { CandleSnapshotParameters } from "@nktkas/hyperliquid";
import type { ResolutionString } from "@/types/charting_library";

export type CandleInterval = CandleSnapshotParameters["interval"];

export const RESOLUTION_TO_INTERVAL: Record<string, CandleInterval | undefined> = {
	"1": "1m",
	"3": "3m",
	"5": "5m",
	"15": "15m",
	"30": "30m",
	"60": "1h",
	"120": "2h",
	"240": "4h",
	"480": "8h",
	"720": "12h",
	D: "1d",
	"1D": "1d",
	"3D": "3d",
	W: "1w",
	"1W": "1w",
	M: "1M",
	"1M": "1M",
};

export function resolutionToInterval(resolution: ResolutionString): CandleInterval | undefined {
	return RESOLUTION_TO_INTERVAL[resolution as string];
}

export function isValidResolution(resolution: ResolutionString): boolean {
	return RESOLUTION_TO_INTERVAL[resolution as string] !== undefined;
}
