/**
 * SEO utilities for generating meta tags in TanStack Router routes.
 *
 * Usage in route files:
 * ```ts
 * export const Route = createFileRoute("/")({
 *   head: () => buildPageHead({
 *     title: "Trade",
 *     description: "Trade perpetuals on Hyperliquid",
 *   }),
 *   component: App,
 * });
 * ```
 */

export const SEO_DEFAULTS = {
	siteName: "HypeTerminal",
	siteUrl: "https://hypeterminal.xyz",
	defaultTitle: "HypeTerminal - Hyperliquid Trading Terminal",
	defaultDescription:
		"A professional trading terminal for Hyperliquid DEX. Trade perpetuals and spot markets with real-time data, advanced charting, and seamless wallet connectivity.",
	twitterHandle: "@hypeterminal",
	locale: "en_US",
	themeColor: "#0a0a0a",
} as const;

export interface PageSeoOptions {
	/** Page title (will be suffixed with site name unless `fullTitle` is true) */
	title?: string;
	/** Use title as-is without appending site name */
	fullTitle?: boolean;
	/** Meta description (max ~155 chars for search results) */
	description?: string;
	/** Canonical URL path (e.g., "/trade") */
	path?: string;
	/** Open Graph image URL (absolute) */
	ogImage?: string;
	/** Page type for Open Graph */
	ogType?: "website" | "article";
	/** Additional keywords for meta keywords tag */
	keywords?: string[];
	/** Prevent search engine indexing */
	noIndex?: boolean;
}

interface MetaTag {
	title?: string;
	name?: string;
	property?: string;
	content?: string;
	charSet?: string;
}

interface LinkTag {
	rel: string;
	href: string;
	type?: string;
	sizes?: string;
}

interface HeadOutput {
	meta: MetaTag[];
	links: LinkTag[];
}

/**
 * Builds the complete head configuration for a route.
 * Includes base meta tags, Open Graph, Twitter Cards, and links.
 */
export function buildPageHead(options: PageSeoOptions = {}): HeadOutput {
	const {
		title,
		fullTitle = false,
		description = SEO_DEFAULTS.defaultDescription,
		path = "",
		ogImage = `${SEO_DEFAULTS.siteUrl}/og-image.png`,
		ogType = "website",
		keywords = [],
		noIndex = false,
	} = options;

	const pageTitle = title
		? fullTitle
			? title
			: `${title} | ${SEO_DEFAULTS.siteName}`
		: SEO_DEFAULTS.defaultTitle;

	const canonicalUrl = `${SEO_DEFAULTS.siteUrl}${path}`;

	const baseKeywords = ["hyperliquid", "trading", "dex", "perpetuals", "crypto", "defi"];
	const allKeywords = Array.from(new Set([...baseKeywords, ...keywords]));

	const meta: MetaTag[] = [
		{ charSet: "utf-8" },
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
		{ title: pageTitle },
		{ name: "description", content: description },
		{ name: "keywords", content: allKeywords.join(", ") },
		{ name: "theme-color", content: SEO_DEFAULTS.themeColor },
		{ name: "color-scheme", content: "dark light" },
		{ name: "author", content: SEO_DEFAULTS.siteName },

		// Open Graph
		{ property: "og:type", content: ogType },
		{ property: "og:site_name", content: SEO_DEFAULTS.siteName },
		{ property: "og:title", content: pageTitle },
		{ property: "og:description", content: description },
		{ property: "og:url", content: canonicalUrl },
		{ property: "og:image", content: ogImage },
		{ property: "og:locale", content: SEO_DEFAULTS.locale },

		// Twitter Card
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:site", content: SEO_DEFAULTS.twitterHandle },
		{ name: "twitter:title", content: pageTitle },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: ogImage },
	];

	if (noIndex) {
		meta.push({ name: "robots", content: "noindex, nofollow" });
	}

	const links: LinkTag[] = [
		{ rel: "canonical", href: canonicalUrl },
		{ rel: "icon", href: "/favicon.ico", sizes: "32x32" },
		{ rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
		{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
	];

	return { meta, links };
}

/**
 * Merges custom head configuration with defaults.
 * Useful for adding route-specific links or scripts.
 */
export function mergeHead(base: HeadOutput, overrides: Partial<HeadOutput>): HeadOutput {
	return {
		meta: [...base.meta, ...(overrides.meta ?? [])],
		links: [...base.links, ...(overrides.links ?? [])],
	};
}
