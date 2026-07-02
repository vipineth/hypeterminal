import { describe, expect, it } from "vitest";
import { LRU } from "./lru";

describe("LRU", () => {
	it("stores and retrieves values", () => {
		const lru = new LRU<string, number>(4);
		lru.set("a", 1);
		lru.set("b", 2);
		expect(lru.get("a")).toBe(1);
		expect(lru.get("b")).toBe(2);
	});

	it("evicts oldest entry when capacity exceeded", () => {
		const lru = new LRU<string, number>(4);
		lru.set("a", 1);
		lru.set("b", 2);
		lru.set("c", 3);
		lru.set("d", 4);
		lru.set("e", 5);

		expect(lru.get("a")).toBeUndefined();
		expect(lru.get("b")).toBe(2);
		expect(lru.size).toBe(4);
	});

	it("get bumps recency — accessed item survives eviction", () => {
		const lru = new LRU<string, number>(3);
		lru.set("a", 1);
		lru.set("b", 2);
		lru.set("c", 3);

		lru.get("a");

		lru.set("d", 4);

		expect(lru.get("a")).toBe(1);
		expect(lru.get("b")).toBeUndefined();
	});

	it("evicts in LRU order, not insertion order", () => {
		const lru = new LRU<string, number>(2);
		lru.set("a", 1);
		lru.set("b", 2);
		lru.get("a");
		lru.set("c", 3);

		expect(lru.get("b")).toBeUndefined();
		expect(lru.get("a")).toBe(1);
		expect(lru.get("c")).toBe(3);
	});

	it("overwriting a key does not increase size", () => {
		const lru = new LRU<string, number>(2);
		lru.set("a", 1);
		lru.set("a", 2);
		expect(lru.size).toBe(1);
		expect(lru.get("a")).toBe(2);
	});

	it("returns undefined for missing keys", () => {
		const lru = new LRU<string, number>(2);
		expect(lru.get("x")).toBeUndefined();
	});
});
