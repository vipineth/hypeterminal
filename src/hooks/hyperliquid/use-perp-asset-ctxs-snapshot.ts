import { useEffect, useRef, useState } from "react";
import type { PerpAssetCtx, PerpAssetCtxs } from "@/types/hyperliquid";
import { useAssetCtxsSubscription } from "./socket/use-asset-ctxs-subscription";

interface UsePerpAssetCtxsSnapshotOptions {
	enabled?: boolean;
	intervalMs?: number;
}

export function usePerpAssetCtxsSnapshot(options?: UsePerpAssetCtxsSnapshotOptions) {
	const enabled = options?.enabled ?? true;
	const intervalMs = options?.intervalMs ?? 10_000;

	const { data: liveCtxs } = useAssetCtxsSubscription<PerpAssetCtxs | undefined>({
		enabled,
		params: { dex: "" },
		select: (event) => event?.ctxs,
	});

	const [snapshot, setSnapshot] = useState<PerpAssetCtxs | undefined>(undefined);

	const latestRef = useRef<PerpAssetCtxs | undefined>(undefined);
	useEffect(() => {
		latestRef.current = liveCtxs;
		setSnapshot((prev) => (prev === undefined && liveCtxs !== undefined ? liveCtxs : prev));
	}, [liveCtxs]);

	useEffect(() => {
		if (!enabled) return;

		setSnapshot(latestRef.current);

		const id = window.setInterval(() => {
			setSnapshot(latestRef.current);
		}, intervalMs);

		return () => window.clearInterval(id);
	}, [enabled, intervalMs]);

	return snapshot;
}
