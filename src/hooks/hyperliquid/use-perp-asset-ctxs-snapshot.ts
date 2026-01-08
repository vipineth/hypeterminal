import { useEffect, useRef, useState } from "react";
import { useSubAssetCtxs } from "@/lib/hl-react/hooks/subscription";
import type { PerpAssetCtxs } from "@/types/hyperliquid";

interface UsePerpAssetCtxsSnapshotOptions {
	enabled?: boolean;
	intervalMs?: number;
}

/**
 * Provides a throttled snapshot of perp asset contexts.
 * Updates at most every `intervalMs` (default 10s) instead of on every WebSocket tick.
 */
export function usePerpAssetCtxsSnapshot(options?: UsePerpAssetCtxsSnapshotOptions) {
	const enabled = options?.enabled ?? true;
	const intervalMs = options?.intervalMs ?? 10_000;

	const { data: assetCtxsEvent } = useSubAssetCtxs(
		{ dex: "" },
		{
			enabled,
		},
	);
	const liveCtxs = assetCtxsEvent?.ctxs as PerpAssetCtxs | undefined;

	const [snapshot, setSnapshot] = useState<PerpAssetCtxs | undefined>(undefined);

	const latestRef = useRef<PerpAssetCtxs | undefined>(undefined);

	useEffect(() => {
		// Always track latest value in ref
		latestRef.current = liveCtxs;

		// Set initial snapshot when first data arrives
		if (snapshot === undefined && liveCtxs !== undefined) {
			setSnapshot(liveCtxs);
		}

		// Only set up interval when enabled
		if (!enabled) return;

		// Set up periodic snapshot updates
		const id = window.setInterval(() => {
			if (latestRef.current !== undefined) {
				setSnapshot(latestRef.current);
			}
		}, intervalMs);

		return () => window.clearInterval(id);
	}, [enabled, intervalMs, liveCtxs, snapshot]);

	return snapshot;
}
