import type { LockManagerLike } from "@/lib/trade/order-sender";
import type { StorageLike } from "@/lib/trade/pending-requests";

export function getBrowserStorage(): StorageLike | null {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

export function getBrowserLocks(): LockManagerLike | null {
	if (typeof window === "undefined" || !navigator.locks) return null;
	return { request: (name, callback) => navigator.locks.request(name, () => callback()) };
}

export function subscribeToStorageEvents(listener: () => void): () => void {
	if (typeof window === "undefined") return () => {};
	window.addEventListener("storage", listener);
	return () => window.removeEventListener("storage", listener);
}
