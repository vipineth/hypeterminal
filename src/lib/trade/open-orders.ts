import { calc, parseNumber } from "@/lib/trade/numbers";

/**
 * Open order from Hyperliquid WebSocket subscription.
 * Field names match the API response directly.
 */
export interface OpenOrder {
	/** Asset symbol (e.g., "BTC", "ETH") */
	coin: string;
	/** Order side: "B" = Buy/Long, "A" = Ask/Short */
	side: "B" | "A";
	/** Limit price as string */
	limitPx: string;
	/** Remaining size as string */
	sz: string;
	/** Order ID (unique identifier) */
	oid: number;
	/** Order creation timestamp in milliseconds */
	timestamp: number;
	/** Original size when order was placed */
	origSz: string;
	/** Whether this is a reduce-only order */
	reduceOnly: boolean;
	/** Time-in-force: "Gtc" | "Ioc" | "Alo" | null */
	tif: string | null;
	/** Client order ID (optional) */
	cloid: string | null;
	/**
	 * Order type from API:
	 * - "Limit"
	 * - "Stop Market"
	 * - "Stop Limit"
	 * - "Take Profit Market"
	 * - "Take Profit Limit"
	 */
	orderType: string;
	/** Whether this is a trigger order (stop/take-profit) */
	isTrigger: boolean;
	/** Trigger price as string (for trigger orders) */
	triggerPx: string;
	/** Human-readable trigger condition (e.g., "Price above 93000") */
	triggerCondition: string;
	/** Whether this order is a position TP/SL */
	isPositionTpsl: boolean;
	/** Child orders (for bracket orders) */
	children: unknown[];
}

/**
 * Configuration for order side display
 */
export const ORDER_SIDE_CONFIG = {
	B: {
		label: "long",
		class: "bg-terminal-green/20 text-terminal-green",
	},
	A: {
		label: "short",
		class: "bg-terminal-red/20 text-terminal-red",
	},
} as const;

/**
 * Configuration for order type display
 * Keys are prefixes matched against orderType
 */
export const ORDER_TYPE_CONFIG = {
	takeProfit: {
		prefix: "Take Profit",
		class: "bg-terminal-green/20 text-terminal-green",
	},
	stop: {
		prefix: "Stop",
		class: "bg-terminal-amber/20 text-terminal-amber",
	},
	default: {
		class: "bg-accent/50",
	},
} as const;

/** Returns true if order is a long/buy */
export function isLongOrder(order: OpenOrder): boolean {
	return order.side === "B";
}

/** Returns true if order is a take-profit order */
export function isTakeProfitOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(ORDER_TYPE_CONFIG.takeProfit.prefix);
}

/** Returns true if order is a stop order */
export function isStopOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(ORDER_TYPE_CONFIG.stop.prefix);
}

/** Calculate filled size (origSz - sz) */
export function getFilledSize(order: OpenOrder): number {
	const origSz = parseNumber(order.origSz);
	const remaining = parseNumber(order.sz);
	if (!Number.isFinite(origSz) || !Number.isFinite(remaining)) return Number.NaN;
	return Math.max(0, origSz - remaining);
}

/** Calculate fill percentage (0-100) */
export function getFillPercent(order: OpenOrder): number {
	const origSz = parseNumber(order.origSz);
	const filled = getFilledSize(order);
	if (!Number.isFinite(origSz) || origSz === 0 || !Number.isFinite(filled)) return 0;
	return (filled / origSz) * 100;
}

/** Calculate order value (limitPx * origSz) */
export function getOrderValue(order: OpenOrder): number | null {
	const limitPx = parseNumber(order.limitPx);
	const origSz = parseNumber(order.origSz);
	return calc.multiply(limitPx, origSz);
}

/** Get display label for order type, appending "RO" for reduce-only non-trigger orders */
export function getOrderTypeLabel(order: OpenOrder): string {
	if (order.reduceOnly && !order.isTrigger) {
		return `${order.orderType} RO`;
	}
	return order.orderType;
}

/** Get CSS class for order type badge */
export function getOrderTypeClass(order: OpenOrder): string {
	if (isTakeProfitOrder(order)) return ORDER_TYPE_CONFIG.takeProfit.class;
	if (isStopOrder(order)) return ORDER_TYPE_CONFIG.stop.class;
	return ORDER_TYPE_CONFIG.default.class;
}

/** Get side config (label + class) */
export function getSideConfig(order: OpenOrder) {
	return ORDER_SIDE_CONFIG[order.side];
}

/** Get CSS class for side badge */
export function getSideClass(order: OpenOrder): string {
	return ORDER_SIDE_CONFIG[order.side].class;
}

/** Get side label */
export function getSideLabel(order: OpenOrder): string {
	return ORDER_SIDE_CONFIG[order.side].label;
}
