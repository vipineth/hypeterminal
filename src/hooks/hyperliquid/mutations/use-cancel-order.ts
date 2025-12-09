import { ExchangeClient, type ExchangeSingleWalletConfig } from "@nktkas/hyperliquid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getHttpTransport, hyperliquidKeys } from "@/lib/hyperliquid";

interface UseCancelOrderOptions {
	wallet: ExchangeSingleWalletConfig["wallet"];
	userAddress?: string;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function useCancelOrder(options: UseCancelOrderOptions) {
	const queryClient = useQueryClient();
	const { wallet, userAddress, onSuccess, onError } = options;

	const exchangeClient = new ExchangeClient({
		transport: getHttpTransport(),
		wallet,
	});

	return useMutation({
		mutationFn: (params: Parameters<typeof exchangeClient.cancel>[0]) => exchangeClient.cancel(params),
		onSuccess: () => {
			if (userAddress) {
				queryClient.invalidateQueries({
					queryKey: hyperliquidKeys.openOrders(userAddress),
				});
			}
			onSuccess?.();
		},
		onError: (error: Error) => {
			onError?.(error);
		},
	});
}
