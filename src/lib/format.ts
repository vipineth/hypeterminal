import { FALLBACK_VALUE_PLACEHOLDER, FORMAT_COMPACT_DEFAULT, FORMAT_COMPACT_THRESHOLD } from "@/config/interface";
import { getResolvedFormatLocale } from "@/stores/use-global-settings-store";

type Formatter = Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat;
type DateInput = Date | number | string | null | undefined;

const formatterCache = new Map<string, Formatter>();

export interface FormatOptions extends Intl.NumberFormatOptions {
	digits?: number;
	compact?: boolean;
}

export interface FormatTokenOptions extends FormatOptions {
	symbol?: string;
}

function isValidNumber(value: number | null | undefined): value is number {
	return typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value);
}

function isValidDate(value: DateInput): value is Date | number | string {
	if (value === null || value === undefined) return false;
	if (value instanceof Date) return !Number.isNaN(value.getTime());
	if (typeof value === "number") return Number.isFinite(value);
	if (typeof value === "string") return !Number.isNaN(Date.parse(value));
	return false;
}

function toDate(value: Date | number | string): Date {
	if (value instanceof Date) return value;
	return new Date(value);
}

function getFormatter(type: "number", locale: string | undefined, opts: Intl.NumberFormatOptions): Intl.NumberFormat;
function getFormatter(type: "date", locale: string | undefined, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat;
function getFormatter(
	type: "relative",
	locale: string | undefined,
	opts: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat;
function getFormatter(
	type: "number" | "date" | "relative",
	locale: string | undefined,
	opts: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | Intl.RelativeTimeFormatOptions,
): Formatter {
	const key = `${type}-${locale || "default"}-${JSON.stringify(opts)}`;
	const resolvedLocale = locale || "en-US";

	if (!formatterCache.has(key)) {
		if (type === "number") {
			formatterCache.set(key, new Intl.NumberFormat(resolvedLocale, opts as Intl.NumberFormatOptions));
		} else if (type === "date") {
			formatterCache.set(key, new Intl.DateTimeFormat(resolvedLocale, opts as Intl.DateTimeFormatOptions));
		} else {
			formatterCache.set(key, new Intl.RelativeTimeFormat(resolvedLocale, opts as Intl.RelativeTimeFormatOptions));
		}
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
export function formatUSD(value: number | null | undefined, opts?: number | FormatOptions) {
	if (!isValidNumber(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { digits, compact, ...rest } = resolveOptions(opts);
	const shouldCompact = (compact ?? FORMAT_COMPACT_DEFAULT) && Math.abs(value) >= FORMAT_COMPACT_THRESHOLD;

	const defaults: Intl.NumberFormatOptions = {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: digits ?? 2,
		maximumFractionDigits: digits ?? 2,
		...(shouldCompact && { notation: "compact", compactDisplay: "short" }),
	};
	return getFormatter("number", getResolvedFormatLocale(), mergeOptions(defaults, rest)).format(value);
}

/**
 * Calculate price decimals from szDecimals using Hyperliquid's rule.
 * Price decimals = max(0, 6 - szDecimals)
 *
 * @example szDecimalsToPriceDecimals(4) -> 2 (BTC: szDecimals=4, shows $88,140.12)
 * @example szDecimalsToPriceDecimals(3) -> 3 (ETH: szDecimals=3, shows $3,456.789)
 * @example szDecimalsToPriceDecimals(0) -> 6 (low-priced assets)
 */
export function szDecimalsToPriceDecimals(szDecimals: number): number {
	return Math.max(0, 6 - szDecimals);
}

export interface FormatPriceOptions extends FormatOptions {
	/** Size decimals from market metadata - used to derive price decimals */
	szDecimals?: number;
}

/**
 * Format a price with decimal places derived from szDecimals.
 * Uses Hyperliquid's rule: priceDecimals = max(0, 6 - szDecimals)
 *
 * @example formatPrice(88140.123, { szDecimals: 4 }) -> "$88,140.12" (BTC)
 * @example formatPrice(3456.789, { szDecimals: 3 }) -> "$3,456.789" (ETH)
 * @example formatPrice(0.00001234, { szDecimals: 0 }) -> "$0.000012" (low-priced)
 */
export function formatPrice(value: number | null | undefined, opts?: FormatPriceOptions): string {
	if (!isValidNumber(value)) return FALLBACK_VALUE_PLACEHOLDER;

	// Derive decimals from szDecimals if provided, otherwise use explicit digits or default to 2
	const decimals = opts?.digits ?? (opts?.szDecimals !== undefined ? szDecimalsToPriceDecimals(opts.szDecimals) : 2);
	const { compact, szDecimals: _, ...rest } = opts ?? {};
	const shouldCompact = (compact ?? false) && Math.abs(value) >= FORMAT_COMPACT_THRESHOLD;

	const defaults: Intl.NumberFormatOptions = {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
		...(shouldCompact && { notation: "compact", compactDisplay: "short" }),
	};

	return getFormatter("number", getResolvedFormatLocale(), mergeOptions(defaults, rest)).format(value);
}

/**
 * Format a price without currency symbol.
 * Useful for input fields and raw price display.
 *
 * @example formatPriceRaw(88140.123, 4) -> "88,140.12" (szDecimals=4 -> 2 price decimals)
 * @example formatPriceRaw(3456.789, 3) -> "3,456.789" (szDecimals=3 -> 3 price decimals)
 */
export function formatPriceRaw(value: number | null | undefined, szDecimals?: number): string {
	if (!isValidNumber(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const decimals = szDecimals !== undefined ? szDecimalsToPriceDecimals(szDecimals) : 2;

	const defaults: Intl.NumberFormatOptions = {
		style: "decimal",
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	};

	return getFormatter("number", getResolvedFormatLocale(), defaults).format(value);
}

/**
 * Format token amount
 * @example formatToken(1.234567) -> "1.23457"
 * @example formatToken(1.234567, 2) -> "1.23"
 * @example formatToken(1.234567, "ETH") -> "1.23457 ETH"
 * @example formatToken(1.234567, { digits: 2, symbol: "ETH" }) -> "1.23 ETH"
 */
export function formatToken(value: number | null | undefined, opts?: number | string | FormatTokenOptions) {
	if (!isValidNumber(value)) return FALLBACK_VALUE_PLACEHOLDER;

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

	const number = getFormatter("number", getResolvedFormatLocale(), mergeOptions(defaults, rest)).format(value);
	return symbol ? `${number} ${symbol}` : number;
}

/**
 * Format percentage
 * Expects decimal input (0.15 = 15%)
 * @example formatPercent(0.153) -> "15.30%"
 * @example formatPercent(0.153, 1) -> "15.3%"
 */
export function formatPercent(value: number | null | undefined, opts?: number | FormatOptions) {
	if (!isValidNumber(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { digits, ...rest } = resolveOptions(opts);
	const defaults: Intl.NumberFormatOptions = {
		style: "percent",
		minimumFractionDigits: digits ?? 2,
		maximumFractionDigits: digits ?? 2,
		signDisplay: "exceptZero",
	};
	return getFormatter("number", getResolvedFormatLocale(), mergeOptions(defaults, rest)).format(value);
}

/**
 * Format a number with commas and decimal precision.
 *
 * - If value is a string, preserves its original decimal precision (for API values)
 * - If value is a number with digits specified, uses those
 * - If value is a number without digits, uses 0-3 decimals
 *
 * @example formatNumber("95001.5") -> "95,001.5" (string: preserves precision)
 * @example formatNumber("2.0001") -> "2.0001" (string: preserves precision)
 * @example formatNumber(1234.5678, 2) -> "1,234.57" (number with digits)
 * @example formatNumber(1234.5) -> "1,234.5" (number, default 0-3 decimals)
 */
export function formatNumber(value: string | number | null | undefined, opts?: number | FormatOptions): string {
	// Handle string input - preserve original decimal precision
	if (typeof value === "string") {
		if (!value) return FALLBACK_VALUE_PLACEHOLDER;
		const num = Number(value);
		if (!Number.isFinite(num)) return FALLBACK_VALUE_PLACEHOLDER;

		// Find how many decimal places the original string has
		const decimalIndex = value.indexOf(".");
		const decimals = decimalIndex === -1 ? 0 : value.length - decimalIndex - 1;

		return getFormatter("number", getResolvedFormatLocale(), {
			style: "decimal",
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(num);
	}

	// Handle number input
	if (!isValidNumber(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { digits, ...rest } = resolveOptions(opts);
	const defaults: Intl.NumberFormatOptions = {
		style: "decimal",
		minimumFractionDigits: digits ?? 0,
		maximumFractionDigits: digits ?? 3,
	};
	return getFormatter("number", getResolvedFormatLocale(), mergeOptions(defaults, rest)).format(value);
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

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
	locale?: string;
}

/**
 * Format a date
 * @example formatDate(new Date()) -> "Jan 5, 2026"
 * @example formatDate(1704067200000) -> "Jan 1, 2024"
 * @example formatDate("2024-01-01") -> "Jan 1, 2024"
 * @example formatDate(new Date(), { dateStyle: "full" }) -> "Monday, January 5, 2026"
 */
export function formatDate(value: DateInput, opts?: FormatDateOptions): string {
	if (!isValidDate(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { locale, ...rest } = opts ?? {};
	const defaults: Intl.DateTimeFormatOptions = {
		dateStyle: "medium",
		...rest,
	};

	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
}

/**
 * Format time only
 * @example formatTime(new Date()) -> "2:30 PM"
 * @example formatTime(new Date(), { timeStyle: "medium" }) -> "2:30:45 PM"
 * @example formatTime(new Date(), { hour12: false }) -> "14:30"
 */
export function formatTime(value: DateInput, opts?: FormatDateOptions): string {
	if (!isValidDate(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { locale, ...rest } = opts ?? {};
	const defaults: Intl.DateTimeFormatOptions = {
		timeStyle: "short",
		...rest,
	};

	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
}

/**
 * Format date and time together
 * @example formatDateTime(new Date()) -> "Jan 5, 2026, 2:30 PM"
 * @example formatDateTime(new Date(), { dateStyle: "short", timeStyle: "short" }) -> "1/5/26, 2:30 PM"
 */
export function formatDateTime(value: DateInput, opts?: FormatDateOptions): string {
	if (!isValidDate(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { locale, ...rest } = opts ?? {};
	const defaults: Intl.DateTimeFormatOptions = {
		dateStyle: "medium",
		timeStyle: "short",
		...rest,
	};

	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
}

const RELATIVE_TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
	{ unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
	{ unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
	{ unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
	{ unit: "day", ms: 24 * 60 * 60 * 1000 },
	{ unit: "hour", ms: 60 * 60 * 1000 },
	{ unit: "minute", ms: 60 * 1000 },
	{ unit: "second", ms: 1000 },
];

export interface FormatRelativeTimeOptions extends Intl.RelativeTimeFormatOptions {
	locale?: string;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @example formatRelativeTime(Date.now() - 3600000) -> "1 hour ago"
 * @example formatRelativeTime(Date.now() + 86400000) -> "in 1 day"
 * @example formatRelativeTime(Date.now() - 120000) -> "2 minutes ago"
 */
export function formatRelativeTime(value: DateInput, opts?: FormatRelativeTimeOptions): string {
	if (!isValidDate(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { locale, ...rest } = opts ?? {};
	const resolvedLocale = locale ?? getResolvedFormatLocale();
	const defaults: Intl.RelativeTimeFormatOptions = {
		numeric: "auto",
		style: "long",
		...rest,
	};

	const date = toDate(value);
	const diff = date.getTime() - Date.now();
	const absDiff = Math.abs(diff);

	for (const { unit, ms } of RELATIVE_TIME_UNITS) {
		if (absDiff >= ms || unit === "second") {
			const amount = Math.round(diff / ms);
			return getFormatter("relative", resolvedLocale, defaults).format(amount, unit);
		}
	}

	return getFormatter("relative", resolvedLocale, defaults).format(0, "second");
}
