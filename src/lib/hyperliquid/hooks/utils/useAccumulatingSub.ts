import type { ISubscription } from "@nktkas/hyperliquid";
import { useRef } from "react";
import { RingBuffer, type RingBufferOptions } from "@/lib/circular-buffer";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useSub } from "./useSub";

interface AccumulateConfig<TEvent, TItem> {
	getItems: (event: TEvent) => TItem[];
	withItems: (event: TEvent, items: TItem[]) => TEvent;
	isSnapshot: (event: TEvent) => boolean;
	buffer: RingBufferOptions<TItem>;
}

/**
 * Subscription hook that accumulates array items across snapshot + delta WS events.
 *
 * Many Hyperliquid subscriptions (userFills, userFundings, etc.) send an initial
 * snapshot with `isSnapshot: true`, followed by delta updates containing only new items.
 * This hook uses a RingBuffer to merge deltas into the snapshot, providing bounded
 * memory, deduplication, and sorted output.
 */
export function useAccumulatingSub<TEvent, TItem>(
	key: string,
	subscribe: (listener: (data: TEvent) => void) => Promise<ISubscription>,
	config: AccumulateConfig<TEvent, TItem>,
	options: SubscriptionOptions = {},
): SubscriptionResult<TEvent> {
	const bufferRef = useRef<RingBuffer<TItem> | null>(null);
	if (!bufferRef.current) {
		bufferRef.current = new RingBuffer(config.buffer);
	}

	return useSub(
		key,
		(listener) =>
			subscribe((event) => {
				const buffer = bufferRef.current!;
				if (config.isSnapshot(event)) {
					buffer.clear();
				}
				buffer.add(config.getItems(event));
				listener(config.withItems(event, buffer.getItems()));
			}),
		options,
	);
}
