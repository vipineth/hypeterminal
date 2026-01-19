import type { OrderParameters, TwapOrderParameters } from "@nktkas/hyperliquid";

type OrderEntry = OrderParameters["orders"][number];
type OrderTypeSpec = OrderEntry["t"];
type LimitTif = Extract<OrderTypeSpec, { limit: unknown }>["limit"]["tif"];
type TriggerTpsl = Extract<OrderTypeSpec, { trigger: unknown }>["trigger"]["tpsl"];
type OrderGrouping = NonNullable<OrderParameters["grouping"]>;
type TwapParams = TwapOrderParameters["twap"];

export type { OrderParameters, TwapOrderParameters, OrderEntry, LimitTif, TriggerTpsl, OrderGrouping, TwapParams };

export type OrderTypeId = "market" | "limit" | "stopMarket" | "stopLimit" | "takeProfitMarket" | "takeProfitLimit" | "twap" | "scale";
export type OrderCategory = "basic" | "trigger" | "algorithmic";
export type OrderSide = "buy" | "sell";

export const TIF_OPTIONS: Record<"Gtc" | "Ioc" | "Alo", { label: string; description: string }> = {
	Gtc: { label: "GTC", description: "Good til Cancelled" },
	Ioc: { label: "IOC", description: "Immediate or Cancel" },
	Alo: { label: "Post Only", description: "Add Liquidity Only" },
};

export interface OrderFormState {
	size: string;
	sizeMode: "asset" | "usd";
	limitPrice: string;
	triggerPrice: string;
	scaleStart: string;
	scaleEnd: string;
	scaleLevels: number;
	twapMinutes: number;
	twapRandomize: boolean;
	reduceOnly: boolean;
	tpSlEnabled: boolean;
	tpPrice: string;
	slPrice: string;
	tif: LimitTif;
}

export const DEFAULT_FORM_STATE: OrderFormState = {
	size: "",
	sizeMode: "asset",
	limitPrice: "",
	triggerPrice: "",
	scaleStart: "",
	scaleEnd: "",
	scaleLevels: 4,
	twapMinutes: 30,
	twapRandomize: true,
	reduceOnly: false,
	tpSlEnabled: false,
	tpPrice: "",
	slPrice: "",
	tif: "Gtc",
};

interface OrderTypeUI {
	showLimitPrice: boolean;
	showTriggerPrice: boolean;
	showTpSl: boolean;
	showScale: boolean;
	showTwap: boolean;
	showTif: boolean;
	triggerLabel?: string;
	limitLabel?: string;
}

interface OrderTypeDefaults {
	reduceOnly: boolean;
	tif: LimitTif | null;
}

interface OrderTypeValidation {
	triggerVsMark?: "above" | "below" | "above-for-buy" | "below-for-buy";
	limitVsTrigger?: "at-or-better";
	minNotional: boolean;
	scaleMinLevels?: number;
	scaleMaxLevels?: number;
	twapMinMinutes?: number;
	twapMaxMinutes?: number;
}

interface OrderTypeConfig {
	id: OrderTypeId;
	label: string;
	shortLabel?: string;
	description: string;
	category: OrderCategory;
	apiMethod: "order" | "twapOrder";
	tpsl: TriggerTpsl | null;
	ui: OrderTypeUI;
	defaults: OrderTypeDefaults;
	validation: OrderTypeValidation;
	availableTif: readonly LimitTif[] | null;
}

export const ORDER_TYPES: Record<OrderTypeId, OrderTypeConfig> = {
	market: {
		id: "market",
		label: "Market",
		description: "Execute immediately at best available price",
		category: "basic",
		apiMethod: "order",
		tpsl: null,
		ui: {
			showLimitPrice: false,
			showTriggerPrice: false,
			showTpSl: true,
			showScale: false,
			showTwap: false,
			showTif: false,
		},
		defaults: { reduceOnly: false, tif: null },
		validation: { minNotional: true },
		availableTif: null,
	},

	limit: {
		id: "limit",
		label: "Limit",
		description: "Execute at specified price or better",
		category: "basic",
		apiMethod: "order",
		tpsl: null,
		ui: {
			showLimitPrice: true,
			showTriggerPrice: false,
			showTpSl: true,
			showScale: false,
			showTwap: false,
			showTif: true,
			limitLabel: "Limit Price",
		},
		defaults: { reduceOnly: false, tif: "Gtc" },
		validation: { minNotional: true },
		availableTif: ["Gtc", "Ioc", "Alo"],
	},

	stopMarket: {
		id: "stopMarket",
		label: "Stop Market",
		shortLabel: "Stop",
		description: "Triggers market order when price reaches stop level",
		category: "trigger",
		apiMethod: "order",
		tpsl: "sl",
		ui: {
			showLimitPrice: false,
			showTriggerPrice: true,
			showTpSl: false,
			showScale: false,
			showTwap: false,
			showTif: false,
			triggerLabel: "Stop Trigger",
		},
		defaults: { reduceOnly: true, tif: null },
		validation: { triggerVsMark: "below-for-buy", minNotional: true },
		availableTif: null,
	},

	stopLimit: {
		id: "stopLimit",
		label: "Stop Limit",
		description: "Triggers limit order when price reaches stop level",
		category: "trigger",
		apiMethod: "order",
		tpsl: "sl",
		ui: {
			showLimitPrice: true,
			showTriggerPrice: true,
			showTpSl: false,
			showScale: false,
			showTwap: false,
			showTif: false,
			triggerLabel: "Stop Trigger",
			limitLabel: "Execution Price",
		},
		defaults: { reduceOnly: true, tif: null },
		validation: { triggerVsMark: "below-for-buy", limitVsTrigger: "at-or-better", minNotional: true },
		availableTif: null,
	},

	takeProfitMarket: {
		id: "takeProfitMarket",
		label: "Take Profit Market",
		shortLabel: "Take Profit",
		description: "Triggers market order when price reaches profit target",
		category: "trigger",
		apiMethod: "order",
		tpsl: "tp",
		ui: {
			showLimitPrice: false,
			showTriggerPrice: true,
			showTpSl: false,
			showScale: false,
			showTwap: false,
			showTif: false,
			triggerLabel: "Take Profit Trigger",
		},
		defaults: { reduceOnly: true, tif: null },
		validation: { triggerVsMark: "above-for-buy", minNotional: true },
		availableTif: null,
	},

	takeProfitLimit: {
		id: "takeProfitLimit",
		label: "Take Profit Limit",
		description: "Triggers limit order when price reaches profit target",
		category: "trigger",
		apiMethod: "order",
		tpsl: "tp",
		ui: {
			showLimitPrice: true,
			showTriggerPrice: true,
			showTpSl: false,
			showScale: false,
			showTwap: false,
			showTif: false,
			triggerLabel: "Take Profit Trigger",
			limitLabel: "Execution Price",
		},
		defaults: { reduceOnly: true, tif: null },
		validation: { triggerVsMark: "above-for-buy", limitVsTrigger: "at-or-better", minNotional: true },
		availableTif: null,
	},

	twap: {
		id: "twap",
		label: "TWAP",
		description: "Time-weighted execution to minimize market impact",
		category: "algorithmic",
		apiMethod: "twapOrder",
		tpsl: null,
		ui: {
			showLimitPrice: false,
			showTriggerPrice: false,
			showTpSl: false,
			showScale: false,
			showTwap: true,
			showTif: false,
		},
		defaults: { reduceOnly: false, tif: null },
		validation: { minNotional: true, twapMinMinutes: 5, twapMaxMinutes: 1440 },
		availableTif: null,
	},

	scale: {
		id: "scale",
		label: "Scale",
		description: "Multiple limit orders across a price range",
		category: "algorithmic",
		apiMethod: "order",
		tpsl: null,
		ui: {
			showLimitPrice: false,
			showTriggerPrice: false,
			showTpSl: false,
			showScale: true,
			showTwap: false,
			showTif: true,
		},
		defaults: { reduceOnly: false, tif: "Gtc" },
		validation: { minNotional: true, scaleMinLevels: 2, scaleMaxLevels: 20 },
		availableTif: ["Gtc", "Alo"],
	},
};

export const ORDER_CATEGORIES = {
	basic: { label: "Basic", types: ["market", "limit"] as const },
	trigger: { label: "Conditional", types: ["stopMarket", "stopLimit", "takeProfitMarket", "takeProfitLimit"] as const },
	algorithmic: { label: "Algorithmic", types: ["twap", "scale"] as const },
} as const;

export function getOrderConfig(orderType: OrderTypeId): OrderTypeConfig {
	return ORDER_TYPES[orderType];
}

export function getDefaultsForOrderType(orderType: OrderTypeId): Partial<OrderFormState> {
	const config = ORDER_TYPES[orderType];
	return {
		reduceOnly: config.defaults.reduceOnly,
		tif: config.defaults.tif ?? "Gtc",
		...(orderType === "twap" && { twapMinutes: 30, twapRandomize: true }),
		...(orderType === "scale" && { scaleLevels: 4 }),
	};
}

export function isBasicOrder(orderType: OrderTypeId): boolean {
	return ORDER_TYPES[orderType].category === "basic";
}

export function isTriggerOrder(orderType: OrderTypeId): boolean {
	return ORDER_TYPES[orderType].category === "trigger";
}

export function isAlgorithmicOrder(orderType: OrderTypeId): boolean {
	return ORDER_TYPES[orderType].category === "algorithmic";
}

export function isStopOrder(orderType: OrderTypeId): boolean {
	return ORDER_TYPES[orderType].tpsl === "sl";
}

export function isTakeProfitOrder(orderType: OrderTypeId): boolean {
	return ORDER_TYPES[orderType].tpsl === "tp";
}

export function getTabsOrderType(orderType: OrderTypeId): "market" | "limit" {
	if (orderType === "market") return "market";
	if (orderType === "limit") return "limit";
	const config = ORDER_TYPES[orderType];
	return config.ui.showLimitPrice ? "limit" : "market";
}

export interface OrderBuildContext {
	assetIndex: number;
	side: OrderSide;
	szDecimals: number;
	markPx: number;
	slippageBps: number;
}

export interface BuiltOrder {
	orders: OrderEntry[];
	grouping: OrderGrouping;
}

export function buildOrderFromForm(
	orderType: OrderTypeId,
	form: OrderFormState,
	sizeValue: number,
	ctx: OrderBuildContext,
): BuiltOrder | { twap: TwapParams } {
	const { assetIndex, side, szDecimals, markPx, slippageBps } = ctx;
	const isBuy = side === "buy";
	const config = ORDER_TYPES[orderType];

	const formatSize = (s: number) => s.toFixed(szDecimals);
	const formatPrice = (p: number) => p.toString();

	if (config.apiMethod === "twapOrder") {
		return {
			twap: {
				a: assetIndex,
				b: isBuy,
				s: formatSize(sizeValue),
				r: form.reduceOnly,
				m: form.twapMinutes,
				t: form.twapRandomize,
			},
		};
	}

	const orders: OrderEntry[] = [];

	if (orderType === "scale") {
		const start = parseFloat(form.scaleStart) || 0;
		const end = parseFloat(form.scaleEnd) || 0;
		const levels = form.scaleLevels;
		const step = levels > 1 ? (end - start) / (levels - 1) : 0;
		const perLevelSize = sizeValue / levels;

		for (let i = 0; i < levels; i++) {
			orders.push({
				a: assetIndex,
				b: isBuy,
				p: formatPrice(start + step * i),
				s: formatSize(perLevelSize),
				r: form.reduceOnly,
				t: { limit: { tif: form.tif } },
			});
		}
		return { orders, grouping: "na" };
	}

	if (isTriggerOrder(orderType)) {
		const triggerPx = formatPrice(parseFloat(form.triggerPrice) || 0);
		const limitPx = config.ui.showLimitPrice ? formatPrice(parseFloat(form.limitPrice) || 0) : triggerPx;

		orders.push({
			a: assetIndex,
			b: isBuy,
			p: config.ui.showLimitPrice ? limitPx : "0",
			s: formatSize(sizeValue),
			r: form.reduceOnly,
			t: {
				trigger: {
					isMarket: !config.ui.showLimitPrice,
					triggerPx,
					tpsl: config.tpsl!,
				},
			},
		});
		return { orders, grouping: "na" };
	}

	const orderPrice =
		orderType === "market" ? applySlippage(markPx, isBuy, slippageBps) : parseFloat(form.limitPrice) || markPx;

	orders.push({
		a: assetIndex,
		b: isBuy,
		p: formatPrice(orderPrice),
		s: formatSize(sizeValue),
		r: form.reduceOnly,
		t: orderType === "market" ? { limit: { tif: "FrontendMarket" } } : { limit: { tif: form.tif } },
	});

	if (form.tpSlEnabled && config.ui.showTpSl) {
		const tpPx = parseFloat(form.tpPrice);
		const slPx = parseFloat(form.slPrice);

		if (tpPx > 0) {
			orders.push({
				a: assetIndex,
				b: !isBuy,
				p: formatPrice(tpPx),
				s: formatSize(sizeValue),
				r: true,
				t: { trigger: { isMarket: true, triggerPx: formatPrice(tpPx), tpsl: "tp" } },
			});
		}

		if (slPx > 0) {
			orders.push({
				a: assetIndex,
				b: !isBuy,
				p: formatPrice(slPx),
				s: formatSize(sizeValue),
				r: true,
				t: { trigger: { isMarket: true, triggerPx: formatPrice(slPx), tpsl: "sl" } },
			});
		}

		if (tpPx > 0 || slPx > 0) {
			return { orders, grouping: "positionTpsl" };
		}
	}

	return { orders, grouping: "na" };
}

function applySlippage(price: number, isBuy: boolean, slippageBps: number): number {
	const slippageFactor = 1 + (slippageBps / 10000) * (isBuy ? 1 : -1);
	return price * slippageFactor;
}

export interface ValidationContext {
	orderType: OrderTypeId;
	side: OrderSide;
	markPx: number;
	maxSize: number;
	minNotional: number;
	isConnected: boolean;
	hasBalance: boolean;
	isReady: boolean;
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	canSubmit: boolean;
}

export function validateOrderForm(form: OrderFormState, sizeValue: number, orderValue: number, ctx: ValidationContext): ValidationResult {
	const errors: string[] = [];
	const config = ORDER_TYPES[ctx.orderType];

	if (!ctx.isConnected) return { valid: false, errors: ["Not connected"], canSubmit: false };
	if (!ctx.hasBalance) return { valid: false, errors: ["No balance"], canSubmit: false };
	if (!ctx.isReady) return { valid: false, errors: ["Not ready"], canSubmit: false };

	if (!sizeValue || sizeValue <= 0) {
		errors.push("Enter size");
	}

	if (sizeValue > ctx.maxSize && ctx.maxSize > 0) {
		errors.push("Exceeds max size");
	}

	if (config.validation.minNotional && orderValue > 0 && orderValue < ctx.minNotional) {
		errors.push(`Min order $${ctx.minNotional}`);
	}

	if (config.ui.showLimitPrice) {
		const limitPx = parseFloat(form.limitPrice);
		if (!limitPx || limitPx <= 0) {
			errors.push("Enter limit price");
		}
	}

	if (config.ui.showTriggerPrice) {
		const triggerPx = parseFloat(form.triggerPrice);
		if (!triggerPx || triggerPx <= 0) {
			errors.push("Enter trigger price");
		} else if (ctx.markPx > 0) {
			const rule = config.validation.triggerVsMark;
			if (rule === "above-for-buy" && ctx.side === "buy" && triggerPx <= ctx.markPx) {
				errors.push("Trigger must be above mark");
			}
			if (rule === "above-for-buy" && ctx.side === "sell" && triggerPx >= ctx.markPx) {
				errors.push("Trigger must be below mark");
			}
			if (rule === "below-for-buy" && ctx.side === "buy" && triggerPx >= ctx.markPx) {
				errors.push("Trigger must be below mark");
			}
			if (rule === "below-for-buy" && ctx.side === "sell" && triggerPx <= ctx.markPx) {
				errors.push("Trigger must be above mark");
			}
		}
	}

	if (config.ui.showScale) {
		const start = parseFloat(form.scaleStart);
		const end = parseFloat(form.scaleEnd);
		const levels = form.scaleLevels;
		const minLevels = config.validation.scaleMinLevels ?? 2;
		const maxLevels = config.validation.scaleMaxLevels ?? 20;

		if (!start || !end) {
			errors.push("Enter price range");
		} else if (start === end) {
			errors.push("Start and end must differ");
		}

		if (levels < minLevels || levels > maxLevels) {
			errors.push(`Levels must be ${minLevels}-${maxLevels}`);
		}

		if (levels >= minLevels && sizeValue > 0 && ctx.markPx > 0) {
			const perLevelNotional = (sizeValue / levels) * ctx.markPx;
			if (perLevelNotional < ctx.minNotional) {
				errors.push("Scale level below min notional");
			}
		}
	}

	if (config.ui.showTwap) {
		const minutes = form.twapMinutes;
		const min = config.validation.twapMinMinutes ?? 5;
		const max = config.validation.twapMaxMinutes ?? 1440;
		if (minutes < min || minutes > max) {
			errors.push(`Duration must be ${min}-${max} minutes`);
		}
	}

	if (form.tpSlEnabled && config.ui.showTpSl) {
		const tpPx = parseFloat(form.tpPrice);
		const slPx = parseFloat(form.slPrice);
		const entryPx = parseFloat(form.limitPrice) || ctx.markPx;

		if (!tpPx && !slPx) {
			errors.push("Enter TP or SL price");
		}

		if (tpPx > 0) {
			const tpValid = ctx.side === "buy" ? tpPx > entryPx : tpPx < entryPx;
			if (!tpValid) {
				errors.push(ctx.side === "buy" ? "TP must be above entry" : "TP must be below entry");
			}
		}

		if (slPx > 0) {
			const slValid = ctx.side === "buy" ? slPx < entryPx : slPx > entryPx;
			if (!slValid) {
				errors.push(ctx.side === "buy" ? "SL must be below entry" : "SL must be above entry");
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		canSubmit: errors.length === 0,
	};
}
