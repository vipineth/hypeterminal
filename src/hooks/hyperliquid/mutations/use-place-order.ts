import { ExchangeClient, type ExchangeSingleWalletConfig } from "@nktkas/hyperliquid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getHttpTransport, hyperliquidKeys } from "@/lib/hyperliquid";

interface UsePlaceOrderOptions {
	wallet: ExchangeSingleWalletConfig["wallet"];
	userAddress?: string;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export function usePlaceOrder(options: UsePlaceOrderOptions) {
	const queryClient = useQueryClient();
	const { wallet, userAddress, onSuccess, onError } = options;

	const exchangeClient = new ExchangeClient({
		transport: getHttpTransport(),
		wallet,
	});

	return useMutation({
		mutationFn: (params: Parameters<typeof exchangeClient.order>[0]) => exchangeClient.order(params),
		onSuccess: () => {
			if (userAddress) {
				queryClient.invalidateQueries({
					queryKey: hyperliquidKeys.openOrders(userAddress),
				});
				queryClient.invalidateQueries({
					queryKey: hyperliquidKeys.clearinghouseState(userAddress),
				});
			}
			onSuccess?.();
		},
		onError: (error: Error) => {
			onError?.(error);
		},
	});
}
