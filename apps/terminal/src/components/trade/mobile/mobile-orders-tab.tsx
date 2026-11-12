import { Badge, Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ListIcon, ListNumbersIcon, XIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { Spinner } from "@/components/ui/spinner";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/app";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice, formatToken } from "@/lib/format";
import { useExchange, useMarkets, useSubscription } from "@/lib/hyperliquid";
import type { MarketKind } from "@/lib/hyperliquid/markets";
import {
	getOrderTypeConfig,
	getSideLabel,
	isClosePositionOrder,
	isMarketTriggerOrder,
	type OpenOrder,
} from "@/lib/trade/open-orders";
import type { Side } from "@/lib/trade/types";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { AssetBadge } from "../components/asset-badge";
import { MetricCell } from "./metric-cell";

interface Props {
	className?: string;
}

type CancelScope = "row" | "all";

export function MobileOrdersTab({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const { setMobileMarketOpen } = useGlobalSettingsActions();
	const { setSide } = useOrderEntryActions();
	const markets = useMarkets();

	function handleSelectMarket(name: string, side: Side) {
		setSelectedMarket(scope, name);
		setSide(side);
		setMobileMarketOpen(true);
	}

	const {
		data: openOrdersEvent,
		status,
		error,
	} = useSubscription(
		"openOrders",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);

	const { mutate: cancelOrders, error: cancelError, reset: resetCancelError } = useExchange("cancel");

	const [cancellingOids, setCancellingOids] = useState<Set<number>>(() => new Set());
	const [pendingScopes, setPendingScopes] = useState<Set<CancelScope>>(() => new Set());

	const openOrders = openOrdersEvent?.orders ?? [];

	function handleCancel(ordersToCancel: OpenOrder[], nextScope: CancelScope) {
		if (ordersToCancel.length === 0) return;

		const fresh = ordersToCancel.filter((order) => !cancellingOids.has(order.oid));
		if (fresh.length === 0) return;

		const cancels = fresh.reduce<{ a: number; o: number }[]>((acc, order) => {
			const assetId = markets.getAssetId(order.coin);
			if (typeof assetId !== "number") return acc;
			acc.push({ a: assetId, o: order.oid });
			return acc;
		}, []);

		if (cancels.length === 0) return;

		const oids = fresh.map((order) => order.oid);
		setCancellingOids((prev) => {
			const next = new Set(prev);
			for (const oid of oids) next.add(oid);
			return next;
		});
		setPendingScopes((prev) => {
			const next = new Set(prev);
			next.add(nextScope);
			return next;
		});
		resetCancelError();
		cancelOrders(
			{ cancels },
			{
				onSettled: () => {
					setCancellingOids((prev) => {
						const next = new Set(prev);
						for (const oid of oids) next.delete(oid);
						return next;
					});
					setPendingScopes((prev) => {
						const next = new Set(prev);
						next.delete(nextScope);
						return next;
					});
				},
			},
		);
	}

	function handleCancelRow(ordersToCancel: OpenOrder[]) {
		handleCancel(ordersToCancel, "row");
	}

	function handleCancelAll() {
		handleCancel(openOrders, "all");
	}

	const headerCount = isConnected ? openOrders.length : FALLBACK_VALUE_PLACEHOLDER;
	const actionError = cancelError?.message;

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`Connect your wallet to view open orders.`}
			</div>
		);
	}

	if (status === "error") {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-error">
				<span>{t`Failed to load open orders.`}</span>
				{error instanceof Error && <span className="mt-1 text-xs text-fg-muted">{error.message}</span>}
			</div>
		);
	}

	if (status === "active" && openOrders.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
				<div className="size-12 rounded-full flex items-center justify-center bg-surface">
					<ListIcon className="size-6 text-fg-muted" />
				</div>
				<p className="text-sm text-fg-muted">{t`No open orders.`}</p>
			</div>
		);
	}

	return (
		<Skeleton name="orders-tab" loading={status === "subscribing" || status === "idle"}>
			<div className={cn("flex-1 min-h-0 flex flex-col", className)}>
				<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase text-fg-muted">
					<ListNumbersIcon className="size-3" />
					{t`Open Orders`}
					<span className="font-semibold text-brand tabular-nums">{headerCount}</span>
					<Button
						variant="ghost"
						intent="error"
						size="sm"
						className="ml-auto touch-target"
						onClick={handleCancelAll}
						disabled={pendingScopes.has("all") || openOrders.length === 0}
					>
						{pendingScopes.has("all") ? t`Canceling...` : t`Cancel All`}
					</Button>
				</div>
				{actionError && <div className="px-3 pb-1 text-xs text-error">{actionError}</div>}
				<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
					{openOrders.map((order) => (
						<MobileOrderCard
							key={order.oid}
							order={order}
							szDecimals={markets.getSzDecimals(order.coin)}
							kind={markets.getMarket(order.coin)?.kind}
							isCancelling={cancellingOids.has(order.oid)}
							onCancel={handleCancelRow}
							onSelectMarket={handleSelectMarket}
						/>
					))}
				</div>
			</div>
		</Skeleton>
	);
}

interface MobileOrderCardProps {
	order: OpenOrder;
	szDecimals: number;
	kind: MarketKind | undefined;
	isCancelling: boolean;
	onCancel: (orders: OpenOrder[]) => void;
	onSelectMarket: (marketName: string, side: Side) => void;
}

function MobileOrderCard({ order, szDecimals, kind, isCancelling, onCancel, onSelectMarket }: MobileOrderCardProps) {
	const typeConfig = getOrderTypeConfig(order);
	const sideLabel = getSideLabel(order.side, kind);
	const isLong = order.side === "B";
	const side: Side = isLong ? "buy" : "sell";

	return (
		<div className="rounded-xs border border-stroke-weak bg-surface overflow-hidden">
			<div className="flex items-center justify-between px-3 py-1.5 border-b border-stroke-weak">
				<div className="flex items-center gap-2">
					<AssetBadge
						coin={order.coin}
						side={side}
						onClick={() => onSelectMarket(order.coin, side)}
						nameClassName="text-sm"
					/>
					<Badge tone={isLong ? "success" : "error"} size="xs">
						{sideLabel}
					</Badge>
				</div>
				<div className="flex items-center gap-2">
					<span className="inline-flex items-baseline gap-1 text-xs whitespace-nowrap" title={typeConfig.fullLabel}>
						{typeConfig.triggerLabel ? (
							<span className={cn("font-medium", typeConfig.triggerClass)}>{typeConfig.triggerLabel}</span>
						) : null}
						<span className="text-fg">{typeConfig.executionLabel}</span>
					</span>
					{order.reduceOnly && <span className="text-2xs uppercase text-fg-muted">{t`RO`}</span>}
				</div>
			</div>

			<div className="grid grid-cols-3 divide-x divide-stroke-weak">
				<MetricCell
					label={t`Price`}
					value={isMarketTriggerOrder(order) ? t`Market` : formatPrice(order.limitPx, { szDecimals })}
				/>
				<MetricCell
					label={t`Size`}
					value={
						isClosePositionOrder(order)
							? t`Close Position`
							: formatToken(order.origSz, { decimals: szDecimals, symbol: order.coin })
					}
				/>
				<MetricCell label={t`Trigger`} value={order.triggerCondition || FALLBACK_VALUE_PLACEHOLDER} />
			</div>

			<div className="flex items-center justify-between px-3 py-1.5">
				<span className="text-xs text-fg-muted tabular-nums">
					{formatDateTime(order.timestamp, { dateStyle: "short", timeStyle: "short" })}
				</span>
				<Button
					variant="ghost"
					intent="error"
					size="sm"
					className="touch-target"
					onClick={() => onCancel([order])}
					disabled={isCancelling}
					iconLeft={isCancelling ? <Spinner className="size-3" /> : <XIcon className="size-3.5" />}
				>
					{t`Cancel`}
				</Button>
			</div>
		</div>
	);
}
