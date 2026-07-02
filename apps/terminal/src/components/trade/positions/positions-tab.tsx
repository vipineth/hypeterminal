import { Table, TableBody, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { HL_ALL_DEXS } from "@/config/app";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { useSubmitPlan } from "@/hooks/trade/use-submit-plan";
import { cn } from "@/lib/cn";
import { useMarkets, useSubscription, useUserPositions } from "@/lib/hyperliquid";
import { buildClosePositionDescription } from "@/lib/trade/close-toast";
import { buildTpSlOrdersByCoin } from "@/lib/trade/open-orders";
import type { Side } from "@/lib/trade/types";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { useOrderEntryActions } from "@/stores/use-order-entry-store";
import { Placeholder } from "./placeholder";
import type { ClosePositionData, LimitClosePositionData, TpSlPositionData } from "./position-dialog-types";
import { PositionLimitCloseModal } from "./position-limit-close-modal";
import { PositionRow } from "./position-row";
import { PositionTpSlModal } from "./position-tpsl-modal";
import {
	positionsPanelTableBodyClass,
	positionsPanelTableCaptionRowClass,
	positionsPanelTableHeadClass,
	positionsPanelTableHeaderClass,
	positionsPanelTableHeaderRowClass,
	positionsPanelTableShellClass,
	positionsPanelTabRootClass,
} from "./positions-panel-table-styles";

type CloseIntent = "close" | "reverse";

export function PositionsTab() {
	const { address, isConnected } = useConnection();
	const slippageBps = useMarketOrderSlippageBps();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();
	const { setSide } = useOrderEntryActions();

	function handleSelectMarket(name: string, side: Side) {
		setSelectedMarket(scope, name);
		setSide(side);
	}
	const [tpSlModalOpen, setTpSlModalOpen] = useState(false);
	const [selectedTpSlPosition, setSelectedTpSlPosition] = useState<TpSlPositionData | null>(null);
	const [limitCloseModalOpen, setLimitCloseModalOpen] = useState(false);
	const [selectedLimitClosePosition, setSelectedLimitClosePosition] = useState<LimitClosePositionData | null>(null);
	const [closingAssetIds, setClosingAssetIds] = useState<Set<number>>(() => new Set());

	const { submitPlan } = useSubmitPlan();
	const [actionError, setActionError] = useState<string | null>(null);

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

	async function submitCloseOrReverse(intent: CloseIntent, data: ClosePositionData) {
		const { assetId, size, markPx, szDecimals, isLong, coin, unrealizedPnl, roe } = data;
		if (closingAssetIds.has(assetId)) return;

		setActionError(null);
		setClosingAssetIds((prev) => {
			const next = new Set(prev);
			next.add(assetId);
			return next;
		});

		const plan = buildOrderPlan({
			kind: intent === "close" ? "marketClose" : "reverse",
			assetId,
			size,
			szDecimals,
			isLong,
			markPx,
			slippageBps,
		});

		const title = intent === "close" ? t`Position closed — ${coin}` : t`Position reversed — ${coin}`;
		const failureMessage = intent === "close" ? t`Failed to close position` : t`Failed to reverse position`;

		const result = await submitPlan(plan);
		if (result.ok) {
			toast.success(title, {
				description: buildClosePositionDescription({ size, szDecimals, coin, unrealizedPnl, roe }),
			});
		} else {
			const message = result.error || failureMessage;
			toast.error(message);
			setActionError(message);
		}

		setClosingAssetIds((prev) => {
			const next = new Set(prev);
			next.delete(assetId);
			return next;
		});
	}

	function handleClosePosition(data: ClosePositionData) {
		submitCloseOrReverse("close", data);
	}

	function handleReverse(data: ClosePositionData) {
		submitCloseOrReverse("reverse", data);
	}

	function handleOpenLimitCloseModal(data: LimitClosePositionData) {
		setSelectedLimitClosePosition(data);
		setLimitCloseModalOpen(true);
	}

	function handleOpenTpSlModal(data: TpSlPositionData) {
		setSelectedTpSlPosition(data);
		setTpSlModalOpen(true);
	}

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view positions.`}</Placeholder>;
		if (positionsLoading) return <Placeholder>{t`Loading positions...`}</Placeholder>;
		if (positionsError) {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load positions.`}</span>
				</Placeholder>
			);
		}
		if (positions.length === 0) return <Placeholder>{t`No active positions.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className={positionsPanelTabRootClass}>
			<div className={positionsPanelTableCaptionRowClass}>
				{isConnected ? (
					<span className="tabular-nums text-3xs text-fg-muted">
						{positions.length} {t`positions`}
					</span>
				) : null}
			</div>
			{actionError ? <div className="px-2.5 py-1 text-2xs text-error">{actionError}</div> : null}
			<div className={positionsPanelTableShellClass}>
				{placeholder ? (
					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{placeholder}</div>
				) : (
					<ScrollArea className="min-h-0 w-full flex-1">
						<Table className="table-fixed min-w-[64rem] w-full">
							<TableHeader className={positionsPanelTableHeaderClass}>
								<TableRow className={positionsPanelTableHeaderRowClass}>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[8%] min-w-0 text-left")}
									>
										{t`Asset`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[14%] text-right")}
									>
										{t`Size`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[12%] text-right")}
									>
										{t`Margin`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[8%] text-right")}>
										{t`Entry`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[9%] text-right")}>
										{t`Mark`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[9%] text-right")}>
										{t`Liq`}
									</TableHead>
									<TableHead scope="col" size="dense" className={cn(positionsPanelTableHeadClass, "w-[8%] text-right")}>
										{t`Funding`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[12%] text-right")}
									>
										{t`PNL`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[10%] text-right")}
									>
										{t`TP/SL`}
									</TableHead>
									<TableHead
										scope="col"
										size="dense"
										className={cn(positionsPanelTableHeadClass, "w-[10%] text-right")}
									>
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody className={positionsPanelTableBodyClass}>
								{positions.map((p, i) => {
									const assetId = markets.getAssetId(p.coin);
									return (
										<PositionRow
											key={p.coin}
											position={p}
											markets={markets}
											markPx={mids?.[p.coin]}
											tpSlInfo={tpSlOrdersByCoin.get(p.coin)}
											isRowClosing={typeof assetId === "number" && closingAssetIds.has(assetId)}
											isEven={i % 2 === 1}
											onClose={handleClosePosition}
											onLimitClose={handleOpenLimitCloseModal}
											onReverse={handleReverse}
											onOpenTpSl={handleOpenTpSlModal}
											onSelectMarket={handleSelectMarket}
										/>
									);
								})}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>

			<PositionTpSlModal open={tpSlModalOpen} onOpenChange={setTpSlModalOpen} position={selectedTpSlPosition} />
			<PositionLimitCloseModal
				open={limitCloseModalOpen}
				onOpenChange={setLimitCloseModalOpen}
				position={selectedLimitClosePosition}
			/>
		</div>
	);
}
