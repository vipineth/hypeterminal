import type { TwapOrderParameters } from "@nktkas/hyperliquid";
import { TWAP_MINUTES_MAX, TWAP_MINUTES_MIN } from "@/config/trade";
import { formatSizeForOrder, OrderBuildError, type OrderPlanError } from "@/domain/trade/orders";
import { clampInt } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

export interface TwapIntent {
	assetId: number;
	side: Side;
	sizeValue: number;
	szDecimals: number;
	reduceOnly: boolean;
	minutes: number | null;
	randomize: boolean;
}

type TwapAction = TwapOrderParameters & { twap: { s: string } };

export type TwapPlan = { action: TwapAction; errors: [] } | { action: null; errors: OrderPlanError[] };

export function buildTwapPlan(intent: TwapIntent): TwapPlan {
	try {
		return {
			action: {
				twap: {
					a: intent.assetId,
					b: intent.side === "buy",
					s: formatSizeForOrder(intent.sizeValue, intent.szDecimals),
					r: intent.reduceOnly,
					m: clampInt(Math.round(intent.minutes ?? 0), TWAP_MINUTES_MIN, TWAP_MINUTES_MAX),
					t: intent.randomize,
				},
			},
			errors: [],
		};
	} catch (error) {
		if (error instanceof OrderBuildError) return { action: null, errors: [error.reason] };
		throw error;
	}
}
