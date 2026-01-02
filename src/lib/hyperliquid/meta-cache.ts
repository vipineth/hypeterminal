import type { MetaResponse } from "@nktkas/hyperliquid";
import { META_CACHE_TTL_MS, STORAGE_KEYS } from "@/constants/app";

export type CachedMeta = {
	updatedAt: number;
	value: MetaResponse;
};

export function readCachedMeta(): CachedMeta | null {
	if (typeof window === "undefined") return null;

	try {
		const raw = window.localStorage.getItem(STORAGE_KEYS.META_CACHE);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;

		if (typeof parsed !== "object" || parsed === null) return null;
		const updatedAt = (parsed as { updatedAt?: unknown }).updatedAt;
		const value = (parsed as { value?: unknown }).value;
		if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt)) return null;
		if (typeof value !== "object" || value === null) return null;

		if (Date.now() - updatedAt > META_CACHE_TTL_MS) return null;
		return { updatedAt, value: value as MetaResponse };
	} catch {
		return null;
	}
}

export function writeCachedMeta(meta: MetaResponse) {
	if (typeof window === "undefined") return;
	try {
		const payload: CachedMeta = { updatedAt: Date.now(), value: meta };
		window.localStorage.setItem(STORAGE_KEYS.META_CACHE, JSON.stringify(payload));
	} catch {}
}
