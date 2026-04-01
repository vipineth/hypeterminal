import type { ISubscription, SubscriptionClient } from "@nktkas/hyperliquid";
import { useRef } from "react";
import { RingBuffer } from "../internal/circular-buffer/ring-buffer";
import { useHyperliquid } from "../provider";
import { serializeKey, subscriptionKeys } from "../query/keys";
import { getAccumulateConfig, getDefaultThrottle } from "../registries/subscription";
import type { SubscriptionOptions, SubscriptionResult } from "../types";
import type { SubEvent, SubMethod, SubParams } from "../types/clients";
import { useSub } from "./utils/useSub";

export function useSubscription<M extends SubMethod>(
	method: M,
	params: SubParams<M>,
	options: SubscriptionOptions = {},
): SubscriptionResult<SubEvent<M>> {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method(method, params));

	const defaultThrottle = getDefaultThrottle(method);
	const mergedOptions = defaultThrottle ? { throttleMs: defaultThrottle, ...options } : options;

	const accConfig = getAccumulateConfig(method);
	const bufferRef = useRef<RingBuffer<unknown> | null>(null);
	const prevMethodRef = useRef(method);
	if (accConfig && (!bufferRef.current || prevMethodRef.current !== method)) {
		bufferRef.current = new RingBuffer(accConfig.buffer);
		prevMethodRef.current = method;
	}

	return useSub(
		key,
		(listener: (data: SubEvent<M>) => void) => {
			const fn = (subscription as SubscriptionClient)[method] as (...args: unknown[]) => Promise<ISubscription>;

			if (accConfig) {
				const wrappedListener = (event: SubEvent<M>) => {
					const buffer = bufferRef.current!;
					if (accConfig.isSnapshot(event)) {
						buffer.clear();
					}
					buffer.add(accConfig.getItems(event));
					listener(accConfig.withItems(event, buffer.getItems()) as SubEvent<M>);
				};
				return params !== undefined
					? fn.call(subscription, params, wrappedListener)
					: fn.call(subscription, wrappedListener);
			}

			return params !== undefined ? fn.call(subscription, params, listener) : fn.call(subscription, listener);
		},
		mergedOptions,
	);
}
