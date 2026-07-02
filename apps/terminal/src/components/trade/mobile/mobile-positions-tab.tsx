import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ChartLineIcon, ListChecksIcon, TrendUpIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { FALLBACK_VALUE_PLACEHOLDER, HL_ALL_DEXS } from "@/config/app";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { useMarkets, useSubscription, useUserPositions } from "@/lib/hyperliquid";
import { buildClosePositionDescription } from "@/lib/trade/close-toast";
import { buildTpSlOrdersByCoin } from "@/lib/trade/open-orders";
import type { Side } from "@/lib/trade/types";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useGlobalSettingsActions, useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import type { ClosePositionData, LimitClosePositionData, TpSlPositionData } from "../positions/position-dialog-types";
import { PositionLimitCloseModal } from "../positions/position-limit-close-modal";
import { PositionTpSlModal } from "../positions/position-tpsl-modal";
import { MobilePositionCard } from "./mobile-position-card";

export function MobilePositionsTab() {
	const { address, isConnected } = useConnection();
	const slippageBps = useMarketOrderSlippageBps();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const { setMobileActiveTab } = useGlobalSettingsActions();
	const { setSide } = useOrderEntryActions();

	function handleSelectMarket(name: string, side: Side) {
		setSelectedMarket(scope, name);
		setSide(side);
		setMobileActiveTab("trade");
	}
	const [tpSlModalOpen, setTpSlModalOpen] = useState(false);
	const [selectedTpSlPosition, setSelectedTpSlPosition] = useState<TpSlPositionData | null>(null);
	const [limitCloseModalOpen, setLimitCloseModalOpen] = useState(false);
	const [selectedLimitClosePosition, setSelectedLimitClosePosition] = useState<LimitClosePositionData | null>(null);
	const [closingAssetIds, setClosingAssetIds] = useState<Set<number>>(() => new Set());
	const [closeErrors, setCloseErrors] = useState<Map<number, string>>(() => new Map());

	const { submitPlan } = useSubmitPlan();
	const { positions, isLoading: positionsLoading, hasError: positionsError } = useUserPositions();
	const markets = useMarkets();

	const allMidsEnabled = isConnected && positions.length > 0;
	const { data: allMidsEvent } = useSubscription("allMids", { dex: HL_ALL_DEXS }, { enabled: allMidsEnabled });
	const mids = allMidsEvent?.mids;

	const { data: openOrdersEvent } = useSubscription(
		"openOrders",
		{ user: address ?? "0x0", dex: HL_ALL_DEXS },
		{ enabled: isConnected && !!address },
	);
	const openOrders = openOrdersEvent?.orders ?? [];

	const tpSlOrdersByCoin = useMemo(() => buildTpSlOrdersByCoin(openOrders), [openOrders]);

	async function handleClosePosition(data: ClosePositionData) {
		const { assetId, size, markPx, szDecimals, isLong, coin, unrealizedPnl, roe } = data;
		if (closingAssetIds.has(assetId)) return;
		setCloseErrors((prev) => {
			if (!prev.has(assetId)) return prev;
			const next = new Map(prev);
			next.delete(assetId);
			return next;
		});
		setClosingAssetIds((prev) => {
			const next = new Set(prev);
			next.add(assetId);
			return next;
		});

		const plan = buildOrderPlan({
			kind: "marketClose",
			assetId,
			size,
			szDecimals,
			isLong,
			markPx,
			slippageBps,
		});

		const result = await submitPlan(plan);
		if (result.ok) {
			toast.success(t`Position closed — ${coin}`, {
				description: buildClosePositionDescription({ size, szDecimals, coin, unrealizedPnl, roe }),
			});
		} else {
			const message = result.error || t`Failed to close position`;
			toast.error(message);
			setCloseErrors((prev) => {
				const next = new Map(prev);
				next.set(assetId, message);
				return next;
			});
		}

		setClosingAssetIds((prev) => {
			const next = new Set(prev);
			next.delete(assetId);
			return next;
		});
	}

	function handleOpenLimitCloseModal(data: LimitClosePositionData) {
		setSelectedLimitClosePosition(data);
		setLimitCloseModalOpen(true);
	}

	function handleOpenTpSlModal(data: TpSlPositionData) {
		setSelectedTpSlPosition(data);
		setTpSlModalOpen(true);
	}

	const headerCount = isConnected ? positions.length : FALLBACK_VALUE_PLACEHOLDER;

	if (!isConnected) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-fg-muted">
				{t`Connect your wallet to view positions.`}
			</div>
		);
	}

	if (positionsError) {
		return (
			<div className="flex-1 flex items-center justify-center p-6 text-sm text-error">
				{t`Failed to load positions.`}
			</div>
		);
	}

	if (!positionsLoading && positions.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
				<div className="size-12 rounded-full flex items-center justify-center bg-surface">
					<ChartLineIcon className="size-6 text-fg-muted" />
				</div>
				<p className="text-sm text-fg-muted text-pretty">{t`No active positions.`}</p>
				<Button
					variant="outline"
					intent="neutral"
					size="sm"
					iconLeft={<TrendUpIcon className="size-4" />}
					onClick={() => setMobileActiveTab("trade")}
				>
					{t`Go to Trade`}
				</Button>
			</div>
		);
	}

	return (
		<Skeleton name="positions-tab" loading={positionsLoading}>
			<div className="flex-1 min-h-0 flex flex-col">
				<div className="px-3 py-2 flex items-center gap-2 text-xs uppercase text-fg-muted">
					<ListChecksIcon className="size-3" />
					{t`Active Positions`}
					<span className="font-semibold text-success ml-auto tabular-nums">{headerCount}</span>
				</div>
				<div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2">
					{positions.map((p) => {
						const assetId = markets.getAssetId(p.coin);
						const isRowClosing = typeof assetId === "number" && closingAssetIds.has(assetId);
						const closeErrorMessage = typeof assetId === "number" ? (closeErrors.get(assetId) ?? null) : null;
						return (
							<MobilePositionCard
								key={`${p.coin}-${p.entryPx}-${p.szi}`}
								position={p}
								markets={markets}
								markPx={mids?.[p.coin]}
								tpSlInfo={tpSlOrdersByCoin.get(p.coin)}
								isRowClosing={isRowClosing}
								closeErrorMessage={closeErrorMessage}
								onClose={handleClosePosition}
								onLimitClose={handleOpenLimitCloseModal}
								onOpenTpSl={handleOpenTpSlModal}
								onSelectMarket={handleSelectMarket}
							/>
						);
					})}
				</div>

				<PositionTpSlModal open={tpSlModalOpen} onOpenChange={setTpSlModalOpen} position={selectedTpSlPosition} />
				<PositionLimitCloseModal
					open={limitCloseModalOpen}
					onOpenChange={setLimitCloseModalOpen}
					position={selectedLimitClosePosition}
				/>
			</div>
		</Skeleton>
	);
}
