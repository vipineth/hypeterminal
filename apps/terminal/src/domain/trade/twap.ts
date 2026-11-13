import type { TwapOrderParameters } from "@nktkas/hyperliquid";
import { TWAP_MINUTES_MAX, TWAP_MINUTES_MIN } from "@/config/trade";
import type { ListedMarket } from "@/domain/market/model";
import { formatSizeForOrder, OrderBuildError, type OrderPlanError } from "@/domain/trade/orders";
import { clampInt } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

export interface TwapIntent {
	market: ListedMarket;
	side: Side;
	sizeValue: string;
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
					a: intent.market.assetId,
					b: intent.side === "buy",
					s: formatSizeForOrder(intent.sizeValue, intent.market),
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
