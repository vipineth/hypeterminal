import { describe, expect, it } from "vitest";
import { buildPageHead, mergeHead, SEO_DEFAULTS } from "@/lib/seo";

describe("seo", () => {
	it("builds page head with title and canonical link", () => {
		const head = buildPageHead({
			title: "Trade",
			description: "Trade page",
			path: "/trade",
			keywords: ["perps"],
		});

		const titleMeta = head.meta.find((m) => m.title);
		expect(titleMeta?.title).toBe(`Trade | ${SEO_DEFAULTS.siteName}`);

		const canonical = head.links.find((l) => l.rel === "canonical");
		expect(canonical?.href).toBe(`${SEO_DEFAULTS.siteUrl}/trade`);
	});

	it("adds robots tag when noIndex is set", () => {
		const head = buildPageHead({ noIndex: true });
		const robots = head.meta.find((m) => m.name === "robots");
		expect(robots?.content).toBe("noindex, nofollow");
	});

	it("merges head entries", () => {
		const base = buildPageHead({ title: "Base" });
		const merged = mergeHead(base, {
			meta: [{ name: "custom", content: "yes" }],
			links: [{ rel: "preload", href: "/x" }],
		});

		expect(merged.meta.some((m) => m.name === "custom")).toBe(true);
		expect(merged.links.some((l) => l.rel === "preload")).toBe(true);
	});
});
