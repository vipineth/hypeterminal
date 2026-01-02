import { Circle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { cn } from "@/lib/utils";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { usePerpAssetCtxsSnapshot } from "@/hooks/hyperliquid/use-perp-asset-ctxs-snapshot";
import { usePerpMarketRegistry } from "@/hooks/hyperliquid/use-market-registry";
import { useTradingAgent } from "@/hooks/hyperliquid/use-trading-agent";
import { makeExchangeConfig, placeSingleOrder } from "@/lib/hyperliquid/exchange";
import { parseNumber } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";
import { useMarketOrderSlippageBps } from "@/stores/use-trade-settings-store";
import { useConnection, useWalletClient } from "wagmi";
import { TokenAvatar } from "../components/token-avatar";

const POSITIONS_TEXT = UI_TEXT.POSITIONS_TAB;

export function PositionsTab() {
	const { address, isConnected } = useConnection();
	const { data: walletClient } = useWalletClient();
	const { data: state, status, error, refetch } = useClearinghouseState({ user: isConnected ? address : undefined });
	const { apiWalletSigner } = useTradingAgent({
		user: isConnected ? address : undefined,
		walletClient,
		enabled: isConnected,
	});
	const slippageBps = useMarketOrderSlippageBps();
	const [closingKey, setClosingKey] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const signer = useMemo(() => {
		if (apiWalletSigner) return apiWalletSigner;
		if (!walletClient) return null;
		return toHyperliquidWallet(walletClient);
	}, [apiWalletSigner, walletClient]);

	const positions = useMemo(() => {
		const raw = state?.assetPositions ?? [];
		return raw
			.map((p) => p.position)
			.filter((p) => {
				const size = parseNumber(p.szi);
				return Number.isFinite(size) && size !== 0;
			});
	}, [state]);

	const { registry } = usePerpMarketRegistry();
	const snapshotCtxs = usePerpAssetCtxsSnapshot({
		enabled: isConnected && positions.length > 0,
		intervalMs: 10_000,
	});

	const tableRows = useMemo(() => {
		return positions.map((p) => {
			const size = parseNumber(p.szi);
			const isLong = size > 0;
			const closeSize = Math.abs(size);

			const entryPx = parseNumber(p.entryPx);
			const positionValue = parseNumber(p.positionValue);
			const unrealizedPnl = parseNumber(p.unrealizedPnl);
			const roe = parseNumber(p.returnOnEquity);
			const liquidationPx = p.liquidationPx ? parseNumber(p.liquidationPx) : Number.NaN;

			const marketInfo = registry?.coinToInfo.get(p.coin);
			const szDecimals = marketInfo?.szDecimals ?? 4;
			const assetIndex = marketInfo?.assetIndex;
			const markPxRaw = typeof assetIndex === "number" ? snapshotCtxs?.[assetIndex]?.markPx : undefined;
			const markPx = markPxRaw ? parseNumber(markPxRaw) : Number.NaN;

			const canClose =
				Number.isFinite(closeSize) &&
				closeSize > 0 &&
				typeof assetIndex === "number" &&
				Number.isFinite(markPx) &&
				markPx > 0;

			return {
				key: `${p.coin}-${p.entryPx}-${p.szi}`,
				coin: p.coin,
				isLong,
				closeSize,
				assetIndex,
				markPx,
				szDecimals,
				canClose,
				sideLabel: isLong ? POSITIONS_TEXT.SIDE_LONG : POSITIONS_TEXT.SIDE_SHORT,
				sideClass: isLong ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				sizeText: Number.isFinite(size) ? formatToken(Math.abs(size), szDecimals) : FALLBACK_VALUE_PLACEHOLDER,
				valueText: Number.isFinite(positionValue)
					? formatUSD(Math.abs(positionValue), { compact: true })
					: FALLBACK_VALUE_PLACEHOLDER,
				entryText: Number.isFinite(entryPx) ? formatPrice(entryPx, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				markText: Number.isFinite(markPx) ? formatPrice(markPx, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				liqText: Number.isFinite(liquidationPx) ? formatPrice(liquidationPx, { szDecimals }) : FALLBACK_VALUE_PLACEHOLDER,
				pnlText: Number.isFinite(unrealizedPnl)
					? formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })
					: FALLBACK_VALUE_PLACEHOLDER,
				roeText: Number.isFinite(roe) ? formatPercent(roe, 1) : FALLBACK_VALUE_PLACEHOLDER,
				pnlClass: unrealizedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
			};
		});
	}, [positions, registry, snapshotCtxs]);

	const headerCount = isConnected ? positions.length : FALLBACK_VALUE_PLACEHOLDER;

	const handleClosePosition = useCallback(
		async (row: (typeof tableRows)[number]) => {
			if (!signer) {
				setActionError(POSITIONS_TEXT.ERROR_SIGNER);
				return;
			}
			if (closingKey) return;
			if (!row.canClose) return;

			setClosingKey(row.key);
			setActionError(null);

			try {
				const assetIndex = row.assetIndex;
				if (typeof assetIndex !== "number" || !Number.isFinite(row.markPx)) {
					throw new Error(POSITIONS_TEXT.ERROR_CLOSE_FALLBACK);
				}

				const transport = getHttpTransport();
				const config = makeExchangeConfig(transport, signer);
				const isBuy = !row.isLong;
				const slippage = slippageBps / 10000;
				const orderPrice = isBuy ? row.markPx * (1 + slippage) : row.markPx * (1 - slippage);

				const order = {
					a: assetIndex,
					b: isBuy,
					p: formatPriceForOrder(orderPrice),
					s: formatSizeForOrder(row.closeSize, row.szDecimals),
					r: true,
					t: { limit: { tif: "FrontendMarket" as const } },
				};

				const result = await placeSingleOrder(config, { order });
				const status = result.response?.data?.statuses?.[0];
				if (status && typeof status === "object" && "error" in status) {
					throw new Error(status.error);
				}

				await refetch();
			} catch (error) {
				const message = error instanceof Error ? error.message : POSITIONS_TEXT.ERROR_CLOSE_FALLBACK;
				setActionError(message);
			} finally {
				setClosingKey(null);
			}
		},
		[closingKey, signer, slippageBps, refetch],
	);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Circle className="size-1.5 fill-terminal-green text-terminal-green" />
				{POSITIONS_TEXT.TITLE}
				<span className="text-terminal-cyan ml-auto tabular-nums">{headerCount}</span>
			</div>
			{actionError ? <div className="mb-1 text-4xs text-terminal-red/80">{actionError}</div> : null}
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{POSITIONS_TEXT.CONNECT}
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{POSITIONS_TEXT.LOADING}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{POSITIONS_TEXT.FAILED}</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : positions.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{POSITIONS_TEXT.EMPTY}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{POSITIONS_TEXT.HEADER_ASSET}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_SIZE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_VALUE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_ENTRY}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_MARK}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_PNL}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_LIQ}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{POSITIONS_TEXT.HEADER_ACTIONS}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => (
									<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", row.sideClass)}>
													{row.sideLabel}
												</span>
												<TokenAvatar symbol={row.coin} />
												<span>{row.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.sizeText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.valueText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.entryText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
											{row.markText}
										</TableCell>
										<TableCell className="text-right py-1.5">
											<div className={cn("text-2xs tabular-nums", row.pnlClass)}>
												{row.pnlText}
												<span className="text-muted-foreground ml-1">({row.roeText})</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-red/70 py-1.5">
											{row.liqText}
										</TableCell>
										<TableCell className="text-right py-1.5">
											<div className="flex justify-end gap-1">
												<button
													type="button"
													className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
													tabIndex={0}
													aria-label={POSITIONS_TEXT.ARIA_CLOSE}
													onClick={() => handleClosePosition(row)}
													disabled={!row.canClose || closingKey !== null}
												>
													{closingKey === row.key ? POSITIONS_TEXT.ACTION_CLOSING : POSITIONS_TEXT.ACTION_CLOSE}
												</button>
												<button
													type="button"
													className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/60 hover:text-terminal-cyan transition-colors"
													tabIndex={0}
													aria-label={POSITIONS_TEXT.ARIA_TPSL}
												>
													{POSITIONS_TEXT.ACTION_TPSL}
												</button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
