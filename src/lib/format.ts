const formatterCache = new Map<string, Intl.NumberFormat>();

export interface FormatOptions extends Intl.NumberFormatOptions {
	digits?: number;
	compact?: boolean;
}

export interface FormatTokenOptions extends FormatOptions {
	symbol?: string;
}

function getFormatter(locale: string | undefined, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
	// Create a unique key for the cache based on locale and options
	// JSON.stringify is fast enough for small option objects
	const key = `${locale || "default"}-${JSON.stringify(opts)}`;

	if (!formatterCache.has(key)) {
		formatterCache.set(key, new Intl.NumberFormat(locale || "en-US", opts));
	}

	const formatter = formatterCache.get(key);
	if (!formatter) {
		throw new Error("Formatter not found in cache");
	}
	return formatter;
}

// Helper to normalize options
function resolveOptions(opts?: number | FormatOptions): FormatOptions {
	if (typeof opts === "number") return { digits: opts };
	return opts || {};
}

// Helper to merge options and prevent RangeError
function mergeOptions(defaults: Intl.NumberFormatOptions, opts: FormatOptions): Intl.NumberFormatOptions {
	const merged = { ...defaults, ...opts };

	// Ensure max >= min to prevent RangeError
	if (
		typeof merged.minimumFractionDigits === "number" &&
		typeof merged.maximumFractionDigits === "number" &&
		merged.minimumFractionDigits > merged.maximumFractionDigits
	) {
		merged.maximumFractionDigits = merged.minimumFractionDigits;
	}

	return merged;
}

/**
 * Format as USD currency
 * @example formatUSD(1234.56) -> "$1,234.56"
 * @example formatUSD(1234.56, 0) -> "$1,235"
 * @example formatUSD(150000) -> "$150K"
 * @example formatUSD(150000, { compact: false }) -> "$150,000.00"
 */
export function formatUSD(value: number, opts?: number | FormatOptions) {
	const { digits, compact, ...rest } = resolveOptions(opts);
	const shouldCompact = compact !== false && Math.abs(value) >= 100000;

	const defaults: Intl.NumberFormatOptions = {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: digits ?? 2,
		maximumFractionDigits: digits ?? 2,
		...(shouldCompact && { notation: "compact", compactDisplay: "short" }),
	};
	return getFormatter("en-US", mergeOptions(defaults, rest)).format(value);
}

/**
 * Format token amount
 * @example formatToken(1.234567) -> "1.23457"
 * @example formatToken(1.234567, 2) -> "1.23"
 * @example formatToken(1.234567, "ETH") -> "1.23457 ETH"
 * @example formatToken(1.234567, { digits: 2, symbol: "ETH" }) -> "1.23 ETH"
 */
export function formatToken(value: number, opts?: number | string | FormatTokenOptions) {
	let options: FormatTokenOptions = {};

	if (typeof opts === "number") {
		options = { digits: opts };
	} else if (typeof opts === "string") {
		options = { symbol: opts };
	} else {
		options = opts || {};
	}

	const { digits, symbol, ...rest } = options;

	const defaults: Intl.NumberFormatOptions = {
		style: "decimal",
		minimumFractionDigits: digits ?? 5,
		maximumFractionDigits: digits ?? 5,
	};

	const number = getFormatter("en-US", mergeOptions(defaults, rest)).format(value);
	return symbol ? `${number} ${symbol}` : number;
}

/**
 * Format percentage
 * Expects decimal input (0.15 = 15%)
 * @example formatPercent(0.153) -> "15.30%"
 * @example formatPercent(0.153, 1) -> "15.3%"
 */
export function formatPercent(value: number, opts?: number | FormatOptions) {
	const { digits, ...rest } = resolveOptions(opts);
	const defaults: Intl.NumberFormatOptions = {
		style: "percent",
		minimumFractionDigits: digits ?? 2,
		maximumFractionDigits: digits ?? 2,
	};
	return getFormatter("en-US", mergeOptions(defaults, rest)).format(value);
}

export function formatNumber(value: number, opts?: number | FormatOptions) {
	const { digits, ...rest } = resolveOptions(opts);
	const defaults: Intl.NumberFormatOptions = {
		style: "decimal",
		minimumFractionDigits: digits ?? 0,
		maximumFractionDigits: digits ?? 3,
	};
	return getFormatter("en-US", mergeOptions(defaults, rest)).format(value);
}

/**
 * Shorten an Ethereum address for display
 * @example shortenAddress("0x1234567890123456789012345678901234567890") -> "0x1234...7890"
 * @example shortenAddress("0x1234567890123456789012345678901234567890", 4, 4) -> "0x12...7890"
 * @example shortenAddress("0x1234567890123456789012345678901234567890", 6, 4) -> "0x1234...7890"
 */
export function shortenAddress(address: string, startLength = 4, endLength = 4): string {
	if (!address || address.length < startLength + endLength) {
		return address;
	}
	if (address.startsWith("0x")) {
		return `${address.slice(0, startLength + 2)}...${address.slice(-endLength)}`;
	}
	return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
