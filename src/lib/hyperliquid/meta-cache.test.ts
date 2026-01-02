import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MetaResponse } from "@nktkas/hyperliquid";
import { STORAGE_KEYS } from "@/constants/app";
import { readCachedMeta, writeCachedMeta } from "./meta-cache";

type StorageLike = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
	clear: () => void;
};

function createMemoryStorage(): StorageLike {
	const store = new Map<string, string>();
	return {
		getItem: (key) => store.get(key) ?? null,
		setItem: (key, value) => {
			store.set(key, value);
		},
		removeItem: (key) => {
			store.delete(key);
		},
		clear: () => {
			store.clear();
		},
	};
}

let originalWindow: unknown;
let storage: StorageLike;

beforeEach(() => {
	originalWindow = (globalThis as { window?: unknown }).window;
	storage = createMemoryStorage();
	(globalThis as { window: { localStorage: StorageLike } }).window = { localStorage: storage };
});

afterEach(() => {
	const globalWithWindow = globalThis as { window?: unknown };
	if (originalWindow) {
		globalWithWindow.window = originalWindow;
		return;
	}
	delete globalWithWindow.window;
});

describe("meta-cache", () => {
	it("reads and writes cached meta", () => {
		const meta = { universe: [] } as unknown as MetaResponse;
		const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000);

		writeCachedMeta(meta);
		const cached = readCachedMeta();

		expect(cached?.value).toEqual(meta);
		expect(cached?.updatedAt).toBe(1_000);

		nowSpy.mockRestore();
	});

	it("expires stale cached meta", () => {
		const payload = { updatedAt: 0, value: { universe: [] } };
		storage.setItem(STORAGE_KEYS.META_CACHE, JSON.stringify(payload));
		expect(readCachedMeta()).toBeNull();
	});
});
