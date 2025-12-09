import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useHyperliquid } from "@/providers/hyperliquid-provider";

interface UseSubscriptionOptions {
	enabled?: boolean;
}

export function useAllMidsSubscription(options?: UseSubscriptionOptions) {
	const { subscriptionClient } = useHyperliquid();
	const queryClient = useQueryClient();
	const subscriptionRef = useRef<Awaited<ReturnType<typeof subscriptionClient.allMids>> | null>(null);
	const enabled = options?.enabled ?? true;

	useEffect(() => {
		if (!enabled) return;

		let isMounted = true;

		const subscribe = async () => {
			try {
				const subscription = await subscriptionClient.allMids((event) => {
					if (isMounted) {
						queryClient.setQueryData(["hyperliquid", "allMids"], event.mids);
					}
				});

				if (isMounted) {
					subscriptionRef.current = subscription;
				} else {
					subscription.unsubscribe();
				}
			} catch (error) {
				console.error("AllMids subscription error:", error);
			}
		};

		subscribe();

		return () => {
			isMounted = false;
			subscriptionRef.current?.unsubscribe();
			subscriptionRef.current = null;
		};
	}, [enabled, subscriptionClient, queryClient]);
}

interface UseL2BookSubscriptionOptions extends UseSubscriptionOptions {
	coin: string;
}

export function useL2BookSubscription(options: UseL2BookSubscriptionOptions) {
	const { subscriptionClient } = useHyperliquid();
	const queryClient = useQueryClient();
	const subscriptionRef = useRef<Awaited<ReturnType<typeof subscriptionClient.l2Book>> | null>(null);
	const { coin, enabled = true } = options;

	useEffect(() => {
		if (!enabled || !coin) return;

		let isMounted = true;

		const subscribe = async () => {
			try {
				const subscription = await subscriptionClient.l2Book({ coin }, (event) => {
					if (isMounted) {
						queryClient.setQueryData(["hyperliquid", "orderBook", coin], {
							levels: event.levels,
						});
					}
				});

				if (isMounted) {
					subscriptionRef.current = subscription;
				} else {
					subscription.unsubscribe();
				}
			} catch (error) {
				console.error("L2Book subscription error:", error);
			}
		};

		subscribe();

		return () => {
			isMounted = false;
			subscriptionRef.current?.unsubscribe();
			subscriptionRef.current = null;
		};
	}, [coin, enabled, subscriptionClient, queryClient]);
}

interface UseTradesSubscriptionOptions extends UseSubscriptionOptions {
	coin: string;
	onTrade?: (
		trades: Parameters<Parameters<typeof import("@nktkas/hyperliquid").SubscriptionClient.prototype.trades>[1]>[0],
	) => void;
}

export function useTradesSubscription(options: UseTradesSubscriptionOptions) {
	const { subscriptionClient } = useHyperliquid();
	const queryClient = useQueryClient();
	const subscriptionRef = useRef<Awaited<ReturnType<typeof subscriptionClient.trades>> | null>(null);
	const { coin, enabled = true, onTrade } = options;

	useEffect(() => {
		if (!enabled || !coin) return;

		let isMounted = true;

		const subscribe = async () => {
			try {
				const subscription = await subscriptionClient.trades({ coin }, (event) => {
					if (isMounted) {
						queryClient.setQueryData(["hyperliquid", "trades", coin], event);
						onTrade?.(event);
					}
				});

				if (isMounted) {
					subscriptionRef.current = subscription;
				} else {
					subscription.unsubscribe();
				}
			} catch (error) {
				console.error("Trades subscription error:", error);
			}
		};

		subscribe();

		return () => {
			isMounted = false;
			subscriptionRef.current?.unsubscribe();
			subscriptionRef.current = null;
		};
	}, [coin, enabled, subscriptionClient, queryClient, onTrade]);
}
