import type { CandleSnapshotParameters } from "@nktkas/hyperliquid";
import type { ResolutionString } from "@/types/charting_library";

export type CandleInterval = CandleSnapshotParameters["interval"];

export interface ResolutionConfig {
	label: string;
	candleInterval: CandleInterval;
	barMs: number;
}

export const RESOLUTIONS: Record<string, ResolutionConfig> = {
	"1": { label: "1m", candleInterval: "1m", barMs: 60_000 },
	"3": { label: "3m", candleInterval: "3m", barMs: 3 * 60_000 },
	"5": { label: "5m", candleInterval: "5m", barMs: 5 * 60_000 },
	"15": { label: "15m", candleInterval: "15m", barMs: 15 * 60_000 },
	"30": { label: "30m", candleInterval: "30m", barMs: 30 * 60_000 },
	"60": { label: "1h", candleInterval: "1h", barMs: 3_600_000 },
	"120": { label: "2h", candleInterval: "2h", barMs: 2 * 3_600_000 },
	"240": { label: "4h", candleInterval: "4h", barMs: 4 * 3_600_000 },
	"480": { label: "8h", candleInterval: "8h", barMs: 8 * 3_600_000 },
	"720": { label: "12h", candleInterval: "12h", barMs: 12 * 3_600_000 },
	"1D": { label: "1D", candleInterval: "1d", barMs: 86_400_000 },
	"1W": { label: "1W", candleInterval: "1w", barMs: 7 * 86_400_000 },
	"1M": { label: "1M", candleInterval: "1M", barMs: 30 * 86_400_000 },
};

export function resolutionToInterval(resolution: ResolutionString): CandleInterval | undefined {
	return RESOLUTIONS[resolution as string]?.candleInterval;
}
