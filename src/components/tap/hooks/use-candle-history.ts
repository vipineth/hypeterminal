import { useQuery } from "@tanstack/react-query";
import { getInfoClient } from "@/lib/hyperliquid/clients";

const infoClient = getInfoClient();

interface UseCandleHistoryParams {
	coin: string;
	interval?: "1m" | "5m" | "15m";
	enabled?: boolean;
}

export interface CandlePoint {
	time: number;
	open: number;
	high: number;
	low: number;
	close: number;
}

export function useCandleHistory({ coin, interval = "1m", enabled = true }: UseCandleHistoryParams) {
	return useQuery({
		queryKey: ["candleHistory", coin, interval],
		queryFn: async () => {
			const endTime = Date.now();
			const startTime = endTime - 60 * 60 * 1000; // Last 1 hour

			const candles = await infoClient.candleSnapshot({
				coin,
				interval,
				startTime,
				endTime,
			});

			return candles.map((c) => ({
				time: c.t,
				open: parseFloat(c.o),
				high: parseFloat(c.h),
				low: parseFloat(c.l),
				close: parseFloat(c.c),
			})) as CandlePoint[];
		},
		enabled: enabled && !!coin,
		staleTime: 30_000, // Refetch every 30 seconds
		refetchInterval: 30_000,
	});
}
