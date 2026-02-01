# Type System + Result Migration TODO

Goal: reduce `??`-driven fallbacks by making absence/error explicit and pushing defaults to the edges.

## Context snapshot (Feb 1, 2026)
- 323 `??` matches in `src/**` (ts/tsx).
- Many `?? 0` / `?? ""` in domain and UI code blur "missing" vs "zero/empty".
- Data fetching frequently uses `data ?? []` and `error ?? null`.

## Guiding principles
- Normalize once at boundaries (API/subscription parsing) and keep core types strict.
- Treat "unknown" explicitly (nullable/Result), avoid auto-defaults in domain logic.
- Prefer discriminated unions for fetch state over `??` in components.
- Consolidate display fallbacks in formatting helpers, not scattered in UI.

## Proposed Result type (minimal)
```ts
export type Result<T, E = Error> =
	| { ok: true; value: T }
	| { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
	r.ok ? ok(fn(r.value)) : r;

export const mapErr = <T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> =>
	r.ok ? r : err(fn(r.error));

export const tryCatch = <T, E = Error>(fn: () => T, mapError?: (e: unknown) => E): Result<T, E> => {
	try {
		return ok(fn());
	} catch (e) {
		return err(mapError ? mapError(e) : (e as E));
	}
};

export const tryCatchAsync = async <T, E = Error>(
	fn: () => Promise<T>,
	mapError?: (e: unknown) => E
): Promise<Result<T, E>> => {
	try {
		return ok(await fn());
	} catch (e) {
		return err(mapError ? mapError(e) : (e as E));
	}
};
```

## React Query integration ideas
- Option A: `queryFn` returns `Result<T, E>` and component branches on `data?.ok`.
- Option B: wrap query hooks to map errors into `Result` while keeping Query's `error` empty.
- Option C: use `select` to map raw data into strict domain models, returning `Result`.

Suggested helper sketch:
```ts
export const useResultQuery = <T, E>(
	key: QueryKey,
	fn: () => Promise<T>,
	options?: UseQueryOptions<T>
) => useQuery({
	...options,
	queryKey: key,
	queryFn: () => tryCatchAsync(fn),
});
```

## Migration plan (incremental)
1) Add `Result` helpers in `src/lib/result.ts`.
2) Introduce `RemoteData<T, E>` for async state where it removes `??` noise.
3) Wrap a small set of high-traffic queries (balances/markets/orders).
4) Move data normalization into mappers (API -> domain).
5) Replace `??` defaults in domain calculations with explicit Result/Option decisions.

## Open decisions
- Error type: `Error` vs typed domain errors.
- Use `Result` only, or add `Option` for "missing but not an error".
- Where to keep defaults: formatter layer vs domain mapper layer.
- How to surface errors in UI (toast vs inline vs fallback).

## Inventory: `??` occurrences in src/**
Refresh with:
```bash
rg "\?\?" src -g '*.ts' -g '*.tsx' --line-number
```

Snapshot list (Feb 1, 2026):
```
src/lib/performance/leak-detector.ts:28:	const existing = instances.get(key) ?? [];
src/lib/performance/leak-detector.ts:59:				const existing = leaks.get(instance.name) ?? { count: 0, oldestMountAge: 0 };
src/domain/market/calculations.ts:4:	const amountBig = toBig(amount) ?? BIG_ZERO;
src/domain/market/calculations.ts:5:	const availableBig = toBig(available) ?? BIG_ZERO;
src/domain/market/calculations.ts:10:	const amountBig = toBig(amount) ?? BIG_ZERO;
src/domain/market/calculations.ts:11:	const availableBig = toBig(available) ?? BIG_ZERO;
src/lib/explorer.ts:5:	return chain.blockExplorers?.default?.url ?? null;
src/providers/theme.tsx:41:	return (storedTheme as Theme) ?? defaultTheme;
src/domain/trade/balances.ts:12:		return market.tokensInfo?.[1]?.name ?? DEFAULT_QUOTE_TOKEN;
src/domain/trade/balances.ts:16:		return market.quoteToken?.name ?? DEFAULT_QUOTE_TOKEN;
src/domain/trade/balances.ts:41:	return balances.find((balance) => balance.coin === coin) ?? null;
src/domain/trade/balances.ts:48:	const av = toBig(accountValue) ?? BIG_ZERO;
src/domain/trade/balances.ts:49:	const mu = toBig(marginUsed) ?? BIG_ZERO;
src/domain/trade/balances.ts:57:	const t = toBig(total) ?? BIG_ZERO;
src/domain/trade/balances.ts:58:	const h = toBig(hold) ?? BIG_ZERO;
src/domain/trade/balances.ts:73:		const baseName = market.tokensInfo?.[0]?.name ?? "";
src/domain/trade/balances.ts:101:		return token?.displayName ?? token?.name ?? "";
src/domain/trade/balances.ts:104:		return market.quoteToken?.displayName ?? market.quoteToken?.name ?? DEFAULT_QUOTE_TOKEN;
src/domain/trade/balances.ts:126:			inOrder: perpSummary?.totalMarginUsed?.toString() ?? "0",
src/domain/trade/balances.ts:127:			total: perpSummary?.accountValue?.toString() ?? "0",
src/domain/trade/balances.ts:128:			usdValue: perpSummary?.accountValue?.toString() ?? "0",
src/domain/trade/balances.ts:129:			entryNtl: perpSummary?.accountValue?.toString() ?? "0",
src/domain/trade/balances.ts:133:	for (const balance of spotBalances ?? []) {
src/domain/trade/balances.ts:138:		const entryNtl = balance.entryNtl ?? "0";
src/domain/trade/balances.ts:145:			inOrder: balance.hold ?? "0",
src/domain/trade/balances.ts:146:			total: balance.total ?? "0",
src/domain/trade/balances.ts:152:	rows.sort((a, b) => Big(toBig(b.usdValue) ?? 0).cmp(toBig(a.usdValue) ?? BIG_ZERO));
src/domain/trade/balances.ts:157:	return rows.reduce((sum, row) => Big(sum).plus(toBig(row.usdValue) ?? 0).toNumber(), 0);
src/domain/trade/balances.ts:161:	return rows.filter((row) => (toBig(row.usdValue) ?? BIG_ZERO).gte(minUsd));
src/domain/market/tokens.tsx:30:	return getUnderlyingAsset(token) ?? token.name;
src/domain/market/tokens.tsx:101:	return categoryMapping[token]?.includes(category) ?? false;
src/lib/errors/definitions/twap.ts:18:		const minutes = Math.round(ctx.twapMinutesNum ?? 0);
src/lib/errors/stacks/withdraw.ts:28:	const firstError = errors[0]?.message ?? null;
src/domain/trade/orders.ts:131:	const levels = clampInt(Math.round(params.scaleLevelsNum ?? SCALE_LEVELS_MIN), SCALE_LEVELS_MIN, SCALE_LEVELS_MAX);
src/domain/trade/orders.ts:132:	const start = toBig(params.scaleStartPriceInput) ?? BIG_ZERO;
src/domain/trade/orders.ts:133:	const end = toBig(params.scaleEndPriceInput) ?? BIG_ZERO;
src/domain/trade/orders.ts:162:	const triggerPx = formatPriceForOrder(toBig(params.triggerPriceInput)?.toNumber() ?? 0);
src/domain/trade/orders.ts:163:	const limitPx = formatPriceForOrder(toBig(params.limitPriceInput)?.toNumber() ?? 0);
src/lib/errors/stacks/deposit.ts:28:	const firstError = errors[0]?.message ?? null;
src/stores/use-market-store.ts:59:					selectedMarket: p?.selectedMarket ?? DEFAULT_MARKET_STORE.selectedMarket,
src/components/trade/market-overview.tsx:33:	const coin = selectedMarketInfo?.name ?? "";
src/components/trade/market-overview.tsx:44:	const fundingNum = toBig(funding)?.toNumber() ?? 0;
src/hooks/trade/use-account-balances.ts:27:		{ user: address ?? "" },
src/hooks/trade/use-account-balances.ts:31:	const { data: spotEvent, status: spotStatus } = useSubSpotState({ user: address ?? "0x0" }, { enabled });
src/hooks/trade/use-account-balances.ts:34:	const perpSummary = mainDex?.crossMarginSummary ?? null;
src/hooks/trade/use-account-balances.ts:35:	const perpPositions = mainDex?.assetPositions ?? EMPTY_PERP_POSITIONS;
src/hooks/trade/use-account-balances.ts:36:	const spotBalances = spotEvent?.spotState?.balances ?? EMPTY_SPOT_BALANCES;
src/domain/trade/order/derive.ts:57:	const szDecimals = inputs.market?.szDecimals ?? 0;
src/domain/trade/order/derive.ts:65:	const [availableLong, availableShort] = inputs.availableToTrade ?? [0, 0];
src/hooks/trade/use-asset-leverage.ts:53:	const maxLeverage = market?.kind === "spot" ? 1 : (market?.maxLeverage ?? DEFAULT_MAX_LEVERAGE);
src/hooks/trade/use-asset-leverage.ts:58:		{ coin: baseToken ?? "", user: address ?? "" },
src/hooks/trade/use-asset-leverage.ts:70:	const onChainLeverage = activeAssetData?.leverage?.value ?? null;
src/hooks/trade/use-asset-leverage.ts:98:	const displayLeverage = pendingLeverage ?? currentLeverage;
src/domain/trade/order/size.ts:82:	const maxTradeSize = input.maxTradeSzs?.[isBuy ? 0 : 1] ?? 0;
src/domain/trade/order/size.ts:89:	const maxTradeSize = input.maxTradeSzs?.[input.side === "buy" ? 0 : 1] ?? 0;
src/domain/trade/order/size.ts:91:		const floored = floorToDecimals(maxTradeSize, input.szDecimals ?? 0);
src/domain/trade/order/size.ts:117:	const sizeInputValue = toBig(input.sizeInput)?.toNumber() ?? 0;
src/domain/trade/order/price.ts:30:		return toBig(usesLimitPrice(orderType) ? limitPriceInput : triggerPriceInput)?.toNumber() ?? 0;
src/domain/trade/order/price.ts:38:		return start?.gt(0) ? start.toNumber() : (end?.toNumber() ?? 0);
src/domain/trade/order/price.ts:40:	return toBig(limitPriceInput)?.toNumber() ?? 0;
src/stores/use-global-settings-store.ts:119:						p?.marketOrderSlippageBps ?? DEFAULT_MARKET_ORDER_SLIPPAGE_BPS,
src/lib/seo.ts:128:		meta: [...base.meta, ...(overrides.meta ?? [])],
src/lib/seo.ts:129:		links: [...base.links, ...(overrides.links ?? [])],
src/components/trade/header/user-menu.tsx:78:						{ensName ?? (address ? shortenAddress(address) : "")}
src/components/trade/header/favorites-strip.tsx:49:	const displayName = market?.displayName ?? name;
src/components/trade/header/favorites-strip.tsx:51:	const szDecimals = market?.szDecimals ?? 4;
src/components/trade/chart/use-token-selector.ts:44:	return market.displayName.split("-")[0] ?? market.displayName;
src/components/trade/chart/use-token-selector.ts:50:			return market.markPx?.toString() ?? "0";
src/components/trade/chart/use-token-selector.ts:52:			return (get24hChange(market.prevDayPx, market.markPx) ?? 0).toString();
src/components/trade/chart/use-token-selector.ts:54:			return (getOiUsd(market.openInterest, market.markPx) ?? 0).toString();
src/components/trade/chart/use-token-selector.ts:56:			return market.dayNtlVlm?.toString() ?? "0";
src/components/trade/chart/use-token-selector.ts:58:			return market.funding?.toString() ?? "0";
src/lib/hyperliquid/provider.tsx:57:	const clientKey = address ?? "disconnected";
src/components/trade/order-entry/leverage-popover.tsx:40:	const displayValue = pendingLeverage ?? currentLeverage;
src/lib/chart/store.ts:129:							const reason = subscription.failureSignal.reason ?? new Error("Subscription failed");
src/components/ui/form.tsx:122:	const body = error ? String(error?.message ?? "") : props.children;
src/lib/chart/candle.ts:9:	return parsed ?? Number.NaN;
src/lib/chart/candle.ts:66:	return { displayName: displayName ?? chartName, symbol: symbol ?? chartName };
src/components/trade/chart/constants.ts:67:	columnHelper.accessor((row: MarketRow) => get24hChange(row.prevDayPx, row.markPx) ?? 0, {
src/components/trade/chart/constants.ts:73:	columnHelper.accessor((row: MarketRow) => getOiUsd(row.openInterest, row.markPx) ?? 0, {
src/components/trade/order-entry/leverage-sheet.tsx:38:	const displayValue = pendingLeverage ?? currentLeverage;
src/lib/hyperliquid/store.ts:117:								const reason = subscription.failureSignal.reason ?? new Error("Subscription failed");
src/components/trade/order-entry/tp-sl-section.tsx:68:		const decimals = szDecimalsToPriceDecimals(szDecimals ?? 4);
src/components/trade/order-entry/tp-sl-section.tsx:76:		const decimals = szDecimalsToPriceDecimals(szDecimals ?? 4);
src/lib/errors/definitions/scale.ts:36:		const levels = clampInt(Math.round(ctx.scaleLevelsNum ?? 0), 0, 100);
src/lib/errors/definitions/scale.ts:62:		const levels = clampInt(Math.round(ctx.scaleLevelsNum ?? 0), 0, 100);
src/lib/chart/symbol.ts:72:	return match[1]?.replace(/0+$/, "").length ?? 0;
src/lib/format.ts:105:	const shouldCompact = (compact ?? compactDefault) && Math.abs(value) >= FORMAT_COMPACT_THRESHOLD;
src/lib/format.ts:128:		minimumFractionDigits: digits ?? 2,
src/lib/format.ts:129:		maximumFractionDigits: digits ?? 2,
src/lib/format.ts:167:	const { digits, compact, szDecimals, trimZeros, ...rest } = opts ?? {};
src/lib/format.ts:168:	const decimals = digits ?? (szDecimals !== undefined ? szDecimalsToPriceDecimals(szDecimals) : 2);
src/lib/format.ts:206:		minimumFractionDigits: digits ?? 5,
src/lib/format.ts:207:		maximumFractionDigits: digits ?? 5,
src/lib/format.ts:228:		minimumFractionDigits: digits ?? 2,
src/lib/format.ts:229:		maximumFractionDigits: digits ?? 2,
src/lib/format.ts:254:	const resolvedDigits = digits ?? (typeof stringDecimals === "number" ? stringDecimals : undefined);
src/lib/format.ts:257:		minimumFractionDigits: resolvedDigits ?? 0,
src/lib/format.ts:258:		maximumFractionDigits: resolvedDigits ?? 3,
src/lib/format.ts:293:	const { locale, ...rest } = opts ?? {};
src/lib/format.ts:299:	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
src/lib/format.ts:310:	const { locale, ...rest } = opts ?? {};
src/lib/format.ts:317:	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
src/lib/format.ts:323:	const { locale, ...rest } = opts ?? {};
src/lib/format.ts:335:	return getFormatter("date", locale ?? getResolvedFormatLocale(), defaults).format(toDate(value));
src/components/trade/positions/twap-tab.tsx:41:	} = useSubUserTwapHistory({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
src/components/trade/positions/twap-tab.tsx:44:	const orders = twapEvent?.history ?? [];
src/components/trade/positions/twap-tab.tsx:74:				{placeholder ?? (
src/components/trade/positions/twap-tab.tsx:102:									const totalSize = toBig(order.state.sz)?.toNumber() ?? Number.NaN;
src/components/trade/positions/twap-tab.tsx:103:									const executedSize = toBig(order.state.executedSz)?.toNumber() ?? Number.NaN;
src/components/trade/positions/twap-tab.tsx:132:														aria-label={t`Switch to ${markets.getMarket(order.state.coin)?.displayName ?? order.state.coin} market`}
src/components/trade/positions/twap-tab.tsx:134:														{markets.getMarket(order.state.coin)?.displayName ?? order.state.coin}
src/lib/i18n.ts:61:		return languageToIntlLocale[i18n.locale as LocaleCode] ?? "en-US";
src/components/trade/order-entry/deposit-modal.tsx:61:	const selectedNetwork = NETWORKS.find((n) => n.id === value) ?? NETWORKS[0];
src/components/trade/positions/position-tpsl-modal.tsx:62:	const referencePrice = position?.entryPx ?? 0;
src/components/trade/positions/position-tpsl-modal.tsx:63:	const size = position?.size ?? 0;
src/components/trade/positions/positions-tab.tsx:92:	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
src/components/trade/positions/positions-tab.tsx:97:	const szDecimals = market?.szDecimals ?? 4;
src/components/trade/positions/positions-tab.tsx:98:	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
src/components/trade/positions/positions-tab.tsx:99:	const displayName = market?.displayName ?? p.coin;
src/components/trade/positions/positions-tab.tsx:100:	const assetInfo = market ?? { displayName: p.coin, iconUrl: undefined };
src/components/trade/positions/positions-tab.tsx:102:	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
src/components/trade/positions/positions-tab.tsx:103:	const cumFunding = toBig(p.cumFunding.sinceOpen)?.toNumber() ?? Number.NaN;
src/components/trade/positions/positions-tab.tsx:125:			entryPx: toBig(p.entryPx)?.toNumber() ?? Number.NaN,
src/components/trade/positions/positions-tab.tsx:128:			roe: toBig(p.returnOnEquity)?.toNumber() ?? Number.NaN,
src/components/trade/positions/positions-tab.tsx:260:	const { data: openOrdersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
src/components/trade/positions/positions-tab.tsx:261:	const openOrders = openOrdersEvent?.orders ?? [];
src/components/trade/positions/positions-tab.tsx:271:			const triggerPx = toBig((order as { triggerPx?: string }).triggerPx)?.toNumber() ?? Number.NaN;
src/components/trade/positions/positions-tab.tsx:274:			const existing = map.get(order.coin) ?? {};
src/components/trade/positions/positions-tab.tsx:351:				{placeholder ?? (
src/components/trade/orderbook/trades-panel.tsx:51:	const subscriptionCoin = selectedMarket?.name ?? "";
src/components/trade/orderbook/trades-panel.tsx:93:	const szDecimals = selectedMarket?.szDecimals ?? 4;
src/components/trade/positions/transfer-dialog.tsx:49:	const usdcDecimals = useMemo(() => getToken(DEFAULT_QUOTE_TOKEN)?.weiDecimals ?? 2, [getToken]);
src/components/trade/order-entry/order-entry-panel.tsx:127:	const markPx = market?.markPx ?? 0;
src/components/trade/order-entry/order-entry-panel.tsx:354:		const szDecimals = market.szDecimals ?? 0;
src/components/trade/order-entry/order-entry-panel.tsx:366:				const minutes = clampInt(Math.round(twapMinutesNum ?? 0), TWAP_MINUTES_MIN, TWAP_MINUTES_MAX);
src/components/trade/order-entry/order-entry-panel.tsx:636:									onClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
src/components/trade/order-entry/order-entry-panel.tsx:667:									onClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
src/components/trade/positions/send-dialog.tsx:81:	const decimals = useMemo(() => getToken(selectedToken)?.weiDecimals ?? 2, [getToken, selectedToken]);
src/components/trade/positions/send-dialog.tsx:102:			setSelectedToken(availableSpotTokens[0]?.asset ?? DEFAULT_QUOTE_TOKEN);
src/components/trade/positions/send-dialog.tsx:196:									asset={getToken(selectedToken) ?? { displayName: selectedToken, iconUrl: undefined }}
src/components/trade/positions/send-dialog.tsx:204:											asset={getToken(tokenName) ?? { displayName: tokenName, iconUrl: undefined }}
src/components/trade/orderbook/orderbook-panel.tsx:41:			coin: selectedMarket?.name ?? "",
src/components/trade/orderbook/orderbook-panel.tsx:61:	const szDecimals = selectedMarket?.szDecimals ?? 4;
src/components/trade/orderbook/orderbook-panel.tsx:91:									{selectedOption?.label ?? priceGroupingOptions[0]?.label ?? "—"}
src/components/trade/positions/history-tab.tsx:42:	} = useSubUserFills({ user: address ?? "0x0", aggregateByTime: true }, { enabled: isConnected && !!address });
src/components/trade/positions/history-tab.tsx:44:	const fills = fillsEvent?.fills?.slice(0, 200).sort((a, b) => b.time - a.time) ?? [];
src/components/trade/positions/history-tab.tsx:73:				{placeholder ?? (
src/components/trade/positions/history-tab.tsx:117:														aria-label={t`Switch to ${markets.getMarket(fill.coin)?.displayName ?? fill.coin} market`}
src/components/trade/positions/history-tab.tsx:119:														{markets.getMarket(fill.coin)?.displayName ?? fill.coin}
src/components/trade/positions/history-tab.tsx:150:														href={getExplorerTxUrl(fill.hash) ?? ""}
src/lib/errors/types.ts:57:			severity: config.severity ?? "error",
src/lib/hyperliquid/query/keys.ts:35:	return ["hl", scope, method, stableValue(params ?? {})] as const;
src/lib/hyperliquid/query/keys.ts:48:		["hl", "subscription", method, stableSubscriptionValue(params ?? {})] as const,
src/components/ui/number-input.tsx:88:			const selectionStart = input.selectionStart ?? 0;
src/components/trade/chart/datafeed.ts:83:		return meta.universe.some((asset) => asset.name === coin && !(asset.isDelisted ?? false));
src/components/trade/chart/datafeed.ts:99:	return `${symbol.ticker ?? symbol.name}:${resolution as string}`;
src/components/trade/chart/datafeed.ts:172:				const coin = coinFromSymbolName(symbolInfo.ticker ?? symbolInfo.name);
src/components/trade/chart/datafeed.ts:220:			const coin = coinFromSymbolName(symbolInfo.ticker ?? symbolInfo.name);
src/components/trade/positions/funding-tab.tsx:37:	} = useSubUserFundings({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
src/components/trade/positions/funding-tab.tsx:40:	const updates = fundingEvent?.fundings?.slice(0, 200).sort((a, b) => b.time - a.time) ?? [];
src/components/trade/positions/funding-tab.tsx:75:				{placeholder ?? (
src/components/trade/positions/funding-tab.tsx:116:													<span>{markets.getMarket(update.coin)?.displayName ?? update.coin}</span>
src/components/trade/positions/balances-tab.tsx:120:		const decimals = token?.weiDecimals ?? 2;
src/components/trade/positions/balances-tab.tsx:128:					<AssetDisplay asset={token ?? { displayName: row.asset, iconUrl: undefined }} />
src/components/trade/positions/balances-tab.tsx:224:				{placeholder ?? (
src/lib/trade/numbers.ts:36:	return toNumber(value) ?? 0;
src/lib/trade/numbers.ts:45:	return toNumber(value) ?? Number.NaN;
src/lib/trade/numbers.ts:88:	return floor(value, maxDecimals) ?? Number.NaN;
src/components/trade/positions/positions-panel.tsx:28:	const { data: ordersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
src/components/trade/positions/positions-panel.tsx:37:	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;
src/lib/hyperliquid/create-config.ts:71:	const wsTransport = createWebSocketTransport(params.wsTransport, params.wsTransportOptions, params.ssr ?? false);
src/lib/hyperliquid/create-config.ts:77:		ssr: params.ssr ?? false,
src/components/trade/positions/orders-tab.tsx:51:	} = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
src/components/trade/positions/orders-tab.tsx:62:	const openOrders = openOrdersEvent?.orders ?? [];
src/components/trade/positions/orders-tab.tsx:207:				{placeholder ?? (
src/components/trade/positions/orders-tab.tsx:242:									const assetInfo = market ?? { displayName: order.coin, iconUrl: undefined };
src/components/trade/positions/orders-tab.tsx:248:										szDecimals={market?.szDecimals ?? 4}
src/lib/hyperliquid/account/use-user-positions.ts:74:	return mainDex?.[1]?.withdrawable ?? "0";
src/lib/hyperliquid/account/use-user-positions.ts:91:		{ user: address ?? "" },
src/lib/hyperliquid/account/use-user-positions.ts:112:					return positions.find((p) => p.coin === coin && p.dex === dex) ?? null;
src/lib/hyperliquid/account/use-user-positions.ts:114:				return positions.find((p) => p.coin === coin) ?? null;
src/lib/hyperliquid/signing/use-agent-wallet.ts:36:		address: agentWallet?.publicKey ?? null,
src/components/trade/chart/token-selector.tsx:30:	if (market.kind === "spot") return market.tokensInfo[0]?.szDecimals ?? 4;
src/components/trade/chart/token-selector.tsx:36:	return market.maxLeverage ?? null;
src/components/trade/chart/token-selector.tsx:65:	} = useTokenSelector({ value: selectedMarket?.name ?? "", onValueChange });
src/components/trade/chart/token-selector.tsx:172:										aria-label={t`Sort by ${String(header.column.columnDef.header ?? "")}`}
src/components/trade/chart/token-selector.tsx:213:									const changeIsPositive = (changeDecimal ?? 0) >= 0;
src/lib/hyperliquid/use-deposit.ts:101:	const error = writeError ?? confirmError ?? null;
src/lib/hyperliquid/client-registry.ts:46:		config.httpTransport ?? new HttpTransport(config.httpTransportOptions ?? getDefaultHttpTransportOptions());
src/lib/hyperliquid/client-registry.ts:48:		config.wsTransport ?? new WebSocketTransport(config.wsTransportOptions ?? getDefaultWsTransportOptions());
src/lib/hyperliquid/client-registry.ts:90:	return registry?.exchange ?? null;
src/components/trade/mobile/mobile-positions-view.tsx:35:		{ user: address ?? "0x0" },
src/components/trade/mobile/mobile-positions-view.tsx:50:	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;
src/components/trade/layout/analysis-section.tsx:13:				<ResizablePanel defaultSize={sizes[0] ?? layoutPreset.defaultSizes[0]} minSize={30}>
src/components/trade/layout/analysis-section.tsx:20:				<ResizablePanel defaultSize={sizes[1] ?? layoutPreset.defaultSizes[1]} minSize={20}>
src/lib/hyperliquid/hooks/useApiStatus.ts:52:		error = httpError ?? wsError;
src/lib/hyperliquid/hooks/useTradingGuard.ts:85:		error: localError ?? agentError,
src/lib/hyperliquid/signing/use-agent-status.ts:49:	const userAddress = address ?? zeroAddress;
src/lib/hyperliquid/signing/use-agent-status.ts:52:		{ user: userAddress, builder: builderConfig?.b ?? zeroAddress },
src/lib/hyperliquid/signing/use-agent-status.ts:76:		agentAddress: localAgent?.publicKey ?? null,
src/lib/trade/open-orders.ts:44:	return toBig(filled)?.div(origSz).times(100).toNumber() ?? 0;
src/lib/trade/orderbook.ts:54:		grouped.set(key, (grouped.get(key) ?? 0) + size);
src/lib/trade/orderbook.ts:66:	const bidMax = bids[bids.length - 1]?.total ?? 0;
src/lib/trade/orderbook.ts:67:	const askMax = asks[asks.length - 1]?.total ?? 0;
src/lib/hyperliquid/hooks/useMarketsInfo.ts:135:			return marketLookup.byName.get(name) ?? marketLookup.byDisplayName.get(name);
src/lib/hyperliquid/hooks/useMarketsInfo.ts:160:		data: market ?? undefined,
src/lib/hyperliquid/signing/use-agent-registration.ts:80:			return agentStatus.agentAddress ?? zeroAddress;
src/components/trade/layout/market-info.tsx:12:	const orderbookKey = market?.name ?? "default";
src/components/trade/layout/market-info.tsx:17:				<ResizablePanel defaultSize={sizes[0] ?? layoutPreset.defaultSizes[0]} minSize={40}>
src/components/trade/layout/market-info.tsx:21:				<ResizablePanel defaultSize={sizes[1] ?? layoutPreset.defaultSizes[1]} minSize={20}>
src/components/trade/mobile/mobile-trade-view.tsx:100:		!perpPositions.length || !baseToken ? null : (perpPositions.find((p) => p.position.coin === baseToken) ?? null);
src/components/trade/mobile/mobile-trade-view.tsx:103:	const markPx = market?.markPx ?? 0;
src/components/trade/mobile/mobile-trade-view.tsx:110:		const maxTradeSize = maxTradeSzs?.[isBuy ? 0 : 1] ?? 0;
src/components/trade/mobile/mobile-trade-view.tsx:112:			return floorToDecimals(maxTradeSize, market?.szDecimals ?? 0);
src/components/trade/mobile/mobile-trade-view.tsx:120:		return floorToDecimals(maxSizeRaw, market?.szDecimals ?? 0);
src/components/trade/mobile/mobile-trade-view.tsx:181:			const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
src/components/trade/mobile/mobile-trade-view.tsx:194:			setSizeInput(formatDecimalFloor(sizeValue, market?.szDecimals ?? 0) || "");
src/components/trade/mobile/mobile-trade-view.tsx:202:		if (markPx > 0) setLimitPriceInput(markPx.toFixed(szDecimalsToPriceDecimals(market?.szDecimals ?? 4)));
src/components/trade/mobile/mobile-trade-view.tsx:226:		const szDecimals = market.szDecimals ?? 0;
src/components/trade/mobile/mobile-trade-view.tsx:317:							<span className="text-lg font-semibold">{baseToken ?? "—"}</span>
src/components/ui/sidebar.tsx:56:	const open = openProp ?? _open;
src/lib/hyperliquid/wallet.ts:38:		const account = accountOverride ?? client.account?.address;
src/lib/hyperliquid/wallet.ts:58:	const accountAddress = accountOverride ?? client.account?.address;
src/lib/hyperliquid/wallet.ts:66:				account: client.account ?? accountAddress,
src/components/trade/mobile/mobile-terminal.tsx:25:	const { data: ordersEvent } = useSubOpenOrders({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
src/components/trade/mobile/mobile-terminal.tsx:37:	const ordersCount = isConnected ? (openOrders?.length ?? 0) : 0;
src/components/trade/layout/order-sidebar.tsx:7:	const formKey = market?.name ?? "default";
src/components/trade/mobile/mobile-book-view.tsx:78:	const name = selectedMarket?.name ?? "";
src/components/trade/mobile/mobile-book-view.tsx:79:	const szDecimals = selectedMarket?.szDecimals ?? 4;
src/components/trade/mobile/mobile-book-view.tsx:214:										{selectedOption?.label ?? "—"}
src/components/trade/mobile/mobile-book-view.tsx:224:												key={`${option.nSigFigs}-${option.mantissa ?? 0}`}
src/components/trade/mobile/mobile-chart-view.tsx:36:	const fundingNum = toBig(selectedMarket?.funding)?.toNumber() ?? 0;
src/components/trade/mobile/mobile-chart-view.tsx:52:								<div className="text-lg font-semibold tabular-nums text-warning">{formatUSD(markPx ?? null)}</div>
src/components/ui/virtual-table.tsx:82:								const headerLabel = header.column.columnDef.header?.toString() ?? "";
src/lib/hyperliquid/markets/use-markets.tsx:47:	const spotTokens: SpotToken[] = (spotMeta?.tokens ?? []).map((token) => {
src/lib/hyperliquid/markets/use-markets.tsx:52:			iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(token) ?? token.name, "spot"),
src/lib/hyperliquid/markets/use-markets.tsx:53:			transferDecimals: token.weiDecimals + (token.evmContract?.evm_extra_wei_decimals ?? 0),
src/lib/hyperliquid/markets/use-markets.tsx:75:				iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(baseToken) ?? baseToken.name, "spot"),
src/lib/hyperliquid/markets/use-markets.tsx:130:			return marketByName.get(coin)?.szDecimals ?? 4;
src/lib/hyperliquid/markets/use-markets.tsx:170:	const error = perpError ?? spotError ?? dexsError ?? allMetasError ?? null;
src/lib/hyperliquid/markets/helper.ts:18:	return `${name}${PERP_MARKET_NAME_SEPARATOR}${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
src/lib/hyperliquid/markets/helper.ts:27:	return `${baseName}-${quoteTokenName ?? DEFAULT_QUOTE_TOKEN}`;
src/components/trade/components/wallet-dialog.tsx:48:			const priorityA = getWalletInfo(a).priority ?? 50;
src/components/trade/components/wallet-dialog.tsx:49:			const priorityB = getWalletInfo(b).priority ?? 50;
src/components/trade/components/wallet-dialog.tsx:224:													{config?.name ?? connector.name}
src/components/trade/components/wallet-dialog.tsx:226:												<p className="text-xs text-muted-fg truncate font-mono">{config?.address ?? "Mock wallet"}</p>
src/components/trade/components/global-settings-dialog.tsx:58:	const slippageInputValue = localSlippageInput ?? String(slippageBps);
src/components/trade/components/spot-swap-modal.tsx:33:	const initialFromToken = useSwapModalFromToken() ?? DEFAULT_QUOTE_TOKEN;
src/components/trade/components/spot-swap-modal.tsx:56:		return pairs[0]?.name ?? "";
src/components/trade/components/spot-swap-modal.tsx:92:	const markPx = spotMarket?.markPx ?? 0;
src/components/trade/components/spot-swap-modal.tsx:93:	const szDecimals = spotMarket?.szDecimals ?? 2;
src/components/trade/components/spot-swap-modal.tsx:94:	const baseToken = spotMarket?.tokensInfo[0]?.name ?? "";
src/components/trade/components/spot-swap-modal.tsx:98:		availableFromTokens.find((t) => t.name === fromToken) ?? spotMarket?.tokensInfo.find((t) => t.name === fromToken);
src/components/trade/components/spot-swap-modal.tsx:100:		availableToTokens.find((t) => t.name === toToken) ?? spotMarket?.tokensInfo.find((t) => t.name === toToken);
src/components/trade/components/spot-swap-modal.tsx:101:	const fromAsset = fromTokenInfo ?? { displayName: fromToken, iconUrl: undefined };
src/components/trade/components/spot-swap-modal.tsx:102:	const toAsset = toTokenInfo ?? { displayName: toToken, iconUrl: undefined };
src/components/trade/components/spot-swap-modal.tsx:104:	const amountValue = toNumber(amount) ?? 0;
src/components/trade/components/spot-swap-modal.tsx:143:			setToToken(pairs[0]?.name ?? "");
src/components/trade/components/spot-swap-modal.tsx:153:			setFromToken(pairs[0]?.name ?? "");
src/lib/hyperliquid/hooks/utils/useStableParams.ts:18:	return useMemo(() => JSON.stringify(stableValue(params ?? {})), [params]);
src/lib/hyperliquid/hooks/utils/useSub.ts:55:		status: entry?.status ?? "idle",
src/lib/hyperliquid/hooks/utils/markets.ts:28:	return `${baseName}-${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
src/lib/hyperliquid/hooks/utils/markets.ts:36:	return `${name}${PERP_MARKET_NAME_SEPARATOR}${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
```
