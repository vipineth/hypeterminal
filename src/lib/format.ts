import { FALLBACK_VALUE_PLACEHOLDER, FORMAT_COMPACT_DEFAULT, FORMAT_COMPACT_THRESHOLD } from "@/config/constants";
import { toNumber } from "@/lib/trade/numbers";
import { getResolvedFormatLocale } from "@/stores/use-global-settings-store";

type Formatter = Intl.NumberFormat | Intl.DateTimeFormat;
type DateInput = Date | number | string | null | undefined;

const formatterCache = new Map<string, Formatter>();

export interface FormatOptions extends Intl.NumberFormatOptions {
	decimals?: number;
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
	type: "number" | "date",
	locale: string | undefined,
	opts: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions,
): Formatter {
	const key = `${type}-${locale || "default"}-${JSON.stringify(opts)}`;
	const resolvedLocale = locale || "en-US";

	if (!formatterCache.has(key)) {
		if (type === "number") {
			formatterCache.set(key, new Intl.NumberFormat(resolvedLocale, opts as Intl.NumberFormatOptions));
		} else {
			formatterCache.set(key, new Intl.DateTimeFormat(resolvedLocale, opts as Intl.DateTimeFormatOptions));
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
	if (typeof opts === "number") return { decimals: opts };
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

function parseNumberInput(value: string | number | null | undefined): {
	value: number | null | undefined;
	stringDecimals?: number;
} {
	if (typeof value === "string") {
		const trimmed = value.trim();
		const num = toNumber(trimmed);
		if (num === null) return { value: null };
		const decimalIndex = trimmed.indexOf(".");
		const decimals = decimalIndex === -1 ? 0 : trimmed.length - decimalIndex - 1;
		return { value: num, stringDecimals: decimals };
	}
	return { value };
}

function buildNumberFormatOptions(
	value: number,
	opts: FormatOptions,
	defaults: Intl.NumberFormatOptions,
	compactDefault: boolean,
): Intl.NumberFormatOptions {
	const { compact, ...rest } = opts;
	const shouldCompact = (compact ?? compactDefault) && Math.abs(value) >= FORMAT_COMPACT_THRESHOLD;
	const compactOptions = shouldCompact ? { notation: "compact", compactDisplay: "short" } : {};

	return mergeOptions({ ...defaults, ...compactOptions } as Intl.NumberFormatOptions, rest);
}

/**
 * Format as USD currency
 * @example formatUSD(1234.56) -> "$1,234.56"
 * @example formatUSD("1234.56") -> "$1,234.56"
 * @example formatUSD(1234.56, 0) -> "$1,235"
 * @example formatUSD(150000) -> "$150K"
 * @example formatUSD(150000, { compact: false }) -> "$150,000.00"
 */
export function formatUSD(value: string | number | null | undefined, opts?: number | FormatOptions) {
	const parsed = parseNumberInput(value);
	if (!isValidNumber(parsed.value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { decimals, compact, ...rest } = resolveOptions(opts);

	const defaults: Intl.NumberFormatOptions = {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: decimals ?? 2,
		maximumFractionDigits: decimals ?? 2,
	};
	const formatOptions = buildNumberFormatOptions(parsed.value, { compact, ...rest }, defaults, FORMAT_COMPACT_DEFAULT);
	return getFormatter("number", getResolvedFormatLocale(), formatOptions).format(parsed.value);
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
	/** Remove trailing zeros (e.g., 12.00 -> 12, 12.50 -> 12.5). Defaults to true. */
	trimZeros?: boolean;
}

/**
 * Format a price with decimal places derived from szDecimals.
 * Uses Hyperliquid's rule: priceDecimals = max(0, 6 - szDecimals)
 *
 * @example formatPrice(88140.123, { szDecimals: 4 }) -> "$88,140.12" (BTC)
 * @example formatPrice("3456.789", { szDecimals: 3 }) -> "$3,456.789" (ETH)
 * @example formatPrice(0.00001234, { szDecimals: 0 }) -> "$0.000012" (low-priced)
 */
export function formatPrice(value: string | number | null | undefined, opts?: FormatPriceOptions): string {
	const parsed = parseNumberInput(value);
	if (!isValidNumber(parsed.value)) return FALLBACK_VALUE_PLACEHOLDER;

	// Derive decimals from szDecimals if provided, otherwise use explicit decimals or default to 2
	const { decimals: decOpt, compact, szDecimals, trimZeros, ...rest } = opts ?? {};
	const resolvedDecimals = decOpt ?? (szDecimals !== undefined ? szDecimalsToPriceDecimals(szDecimals) : 2);

	const defaults: Intl.NumberFormatOptions = {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: trimZeros === false ? resolvedDecimals : 0,
		maximumFractionDigits: resolvedDecimals,
	};

	const formatOptions = buildNumberFormatOptions(parsed.value, { compact, ...rest }, defaults, false);
	return getFormatter("number", getResolvedFormatLocale(), formatOptions).format(parsed.value);
}

/**
 * Format token amount
 * @example formatToken(1.234567) -> "1.23457"
 * @example formatToken("1.234567", 2) -> "1.23"
 * @example formatToken(1.234567, "ETH") -> "1.23457 ETH"
 * @example formatToken(1.234567, { decimals: 2, symbol: "ETH" }) -> "1.23 ETH"
 */
export function formatToken(value: string | number | null | undefined, opts?: number | string | FormatTokenOptions) {
	const parsed = parseNumberInput(value);
	if (!isValidNumber(parsed.value)) return FALLBACK_VALUE_PLACEHOLDER;

	let options: FormatTokenOptions = {};

	if (typeof opts === "number") {
		options = { decimals: opts };
	} else if (typeof opts === "string") {
		options = { symbol: opts };
	} else {
		options = opts || {};
	}

	const { decimals, symbol, compact, ...rest } = options;

	const defaults: Intl.NumberFormatOptions = {
		style: "decimal",
		minimumFractionDigits: decimals ?? 5,
		maximumFractionDigits: decimals ?? 5,
	};

	const formatOptions = buildNumberFormatOptions(parsed.value, { compact, ...rest }, defaults, false);
	const number = getFormatter("number", getResolvedFormatLocale(), formatOptions).format(parsed.value);
	return symbol ? `${number} ${symbol}` : number;
}

/**
 * Format percentage
 * Expects decimal input (0.15 = 15%)
 * @example formatPercent(0.153) -> "15.30%"
 * @example formatPercent("0.153", 1) -> "15.3%"
 */
export function formatPercent(value: string | number | null | undefined, opts?: number | FormatOptions) {
	const parsed = parseNumberInput(value);
	if (!isValidNumber(parsed.value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { decimals, compact, ...rest } = resolveOptions(opts);
	const defaults: Intl.NumberFormatOptions = {
		style: "percent",
		minimumFractionDigits: decimals ?? 2,
		maximumFractionDigits: decimals ?? 2,
		signDisplay: "exceptZero",
	};
	const formatOptions = buildNumberFormatOptions(parsed.value, { compact, ...rest }, defaults, false);
	return getFormatter("number", getResolvedFormatLocale(), formatOptions).format(parsed.value);
}

/**
 * Format a number with commas and decimal precision.
 *
 * - If value is a string and decimals are not provided, preserves its original decimal precision (for API values)
 * - If value is a number with decimals specified, uses those
 * - If value is a number without decimals, uses 0-3 decimals
 *
 * @example formatNumber("95001.5") -> "95,001.5" (string: preserves precision)
 * @example formatNumber("2.0001") -> "2.0001" (string: preserves precision)
 * @example formatNumber(1234.5678, 2) -> "1,234.57" (number with digits)
 * @example formatNumber(1234.5) -> "1,234.5" (number, default 0-3 decimals)
 */
export function formatNumber(value: string | number | null | undefined, opts?: number | FormatOptions): string {
	const parsed = parseNumberInput(value);
	if (!isValidNumber(parsed.value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { decimals, compact, ...rest } = resolveOptions(opts);
	const stringDecimals = parsed.stringDecimals;
	const resolvedDecimals = decimals ?? (typeof stringDecimals === "number" ? stringDecimals : undefined);
	const defaults: Intl.NumberFormatOptions = {
		style: "decimal",
		minimumFractionDigits: resolvedDecimals ?? 0,
		maximumFractionDigits: resolvedDecimals ?? 3,
	};
	const formatOptions = buildNumberFormatOptions(parsed.value, { compact, ...rest }, defaults, false);
	return getFormatter("number", getResolvedFormatLocale(), formatOptions).format(parsed.value);
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

const DATE_COMPONENT_KEYS = [
	"weekday",
	"era",
	"year",
	"month",
	"day",
	"dayPeriod",
	"hour",
	"minute",
	"second",
	"fractionalSecondDigits",
	"timeZoneName",
] as const;

function hasDateComponentOptions(opts: Intl.DateTimeFormatOptions): boolean {
	return DATE_COMPONENT_KEYS.some((key) => key in opts);
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
	const formatOpts: Intl.DateTimeFormatOptions = hasDateComponentOptions(rest) ? rest : { timeStyle: "short", ...rest };

	return getFormatter("date", locale ?? getResolvedFormatLocale(), formatOpts).format(toDate(value));
}

/**
 * Format date and time together
 * @example formatDateTime(new Date()) -> "Jan 5, 2026, 2:30 PM"
 * @example formatDateTime(new Date(), { dateStyle: "short", timeStyle: "short" }) -> "1/5/26, 2:30 PM"
 */
export function formatDateTime(value: DateInput, opts?: FormatDateOptions): string {
	if (!isValidDate(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { locale, ...rest } = opts ?? {};
	const formatOpts: Intl.DateTimeFormatOptions = hasDateComponentOptions(rest)
		? rest
		: { dateStyle: "medium", timeStyle: "short", ...rest };

	return getFormatter("date", locale ?? getResolvedFormatLocale(), formatOpts).format(toDate(value));
}

export function formatDateTimeShort(value: DateInput, opts?: FormatDateOptions): string {
	if (!isValidDate(value)) return FALLBACK_VALUE_PLACEHOLDER;

	const { locale, ...rest } = opts ?? {};

	// MM/DD HH:mm │ 01/29 14:35
	const defaults: Intl.DateTimeFormatOptions = {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		...rest,
	};

	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
}

/**
 * Convert basis points to percentage string
 * 100000 bps = 100%, so divide by 1000 to get percentage
 * @example bpsToPercentage(10) -> "0.01"
 * @example bpsToPercentage(100) -> "0.10"
 * @example bpsToPercentage(1000) -> "1.00"
 */
export function bpsToPercentage(bps: string | number | null | undefined, decimals = 2): string {
	const parsed = parseNumberInput(bps);
	if (!isValidNumber(parsed.value)) return "0";
	return (parsed.value / 1000).toFixed(decimals);
}

/**
 * Format duration in minutes to human-readable string
 * @example formatDuration(5) -> "5m"
 * @example formatDuration(60) -> "1h"
 * @example formatDuration(90) -> "1h 30m"
 * @example formatDuration(1440) -> "24h"
 * @example formatDuration(1500) -> "1d 1h"
 * @example formatDuration(2880) -> "2d"
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes}m`;
	if (minutes < 1440) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	const days = Math.floor(minutes / 1440);
	const remainingHours = Math.floor((minutes % 1440) / 60);
	return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}
