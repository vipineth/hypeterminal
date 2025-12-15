import type { WebSocketSubscription } from "@nktkas/hyperliquid";
import { useEffect, useRef } from "react";

type SubscribeOnceFn = () => Promise<WebSocketSubscription>;

export interface SharedSubscriptionOptions {
	enabled?: boolean;
	onLastUnsubscribe?: () => void;
}

interface SharedSubscriptionEntry {
	subscription: Promise<WebSocketSubscription>;
	refCount: number;
}

const sharedSubscriptions = new Map<string, SharedSubscriptionEntry>();

export function useSharedSubscription(key: string, subscribeFn: SubscribeOnceFn, options?: SharedSubscriptionOptions) {
	const enabled = options?.enabled ?? true;

	const subscribeFnRef = useRef(subscribeFn);
	subscribeFnRef.current = subscribeFn;

	const onLastUnsubscribeRef = useRef<SharedSubscriptionOptions["onLastUnsubscribe"]>(undefined);
	onLastUnsubscribeRef.current = options?.onLastUnsubscribe;

	useEffect(() => {
		if (!enabled) return;

		let entry = sharedSubscriptions.get(key);

		if (!entry) {
			let subscription: Promise<WebSocketSubscription>;
			subscription = subscribeFnRef.current().catch((error) => {
				console.error(error);
				const current = sharedSubscriptions.get(key);
				if (current?.subscription === subscription) {
					sharedSubscriptions.delete(key);
				}
				return { unsubscribe: async () => {}, failureSignal: new AbortController().signal };
			});
			entry = { subscription, refCount: 0 };
			sharedSubscriptions.set(key, entry);
		}

		entry.refCount++;

		return () => {
			if (!entry) return;

			entry.refCount--;

			if (entry.refCount === 0) {
				entry.subscription.then((sub) => sub.unsubscribe()).catch(console.error);
				onLastUnsubscribeRef.current?.();
				sharedSubscriptions.delete(key);
			}
		};
	}, [key, enabled]);
}

export function getActiveSubscriptions(): string[] {
	return Array.from(sharedSubscriptions.keys());
}

export function getSubscriptionCount(): number {
	return sharedSubscriptions.size;
}
