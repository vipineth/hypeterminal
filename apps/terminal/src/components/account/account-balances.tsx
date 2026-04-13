import { Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { WalletIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useId, useMemo } from "react";
import { useConnection } from "wagmi";
import { DEFAULT_QUOTE_TOKEN, HL_ALL_DEXS } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { formatToken, formatUSD } from "@/lib/format";
import { useSubAllMids } from "@/lib/hyperliquid/hooks/subscription";
import { useSpotTokens } from "@/lib/hyperliquid/markets/use-spot-tokens";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { useGlobalSettingsActions, useHideSmallBalances } from "@/stores/use-global-settings-store";
import { AssetDisplay } from "../trade/components/asset-display";

const SMALL_BALANCE_THRESHOLD = 1;

interface SpotRow {
	coin: string;
	total: number;
	available: number;
	inOrders: number;
	usdValue: number;
	szDecimals: number;
}

export function AccountBalances() {
	const { isConnected } = useConnection();
	const { spotBalances, isLoading, hasError } = useAccountBalances();
	const { getToken } = useSpotTokens();
	const hideSmallBalances = useHideSmallBalances();
	const { setHideSmallBalances } = useGlobalSettingsActions();
	const isMobile = useIsMobile();

	const { data: allMidsEvent } = useSubAllMids({ dex: HL_ALL_DEXS }, { enabled: isConnected });
	const mids = allMidsEvent?.mids;

	const rows = useMemo(() => {
		const result: SpotRow[] = [];
		for (const b of spotBalances) {
			const total = toNumberOrZero(b.total);
			if (total === 0) continue;

			const hold = toNumberOrZero(b.hold);
			const available = Math.max(0, total - hold);
			const inOrders = hold;
			const token = getToken(b.coin);
			const szDecimals = token?.szDecimals ?? 2;

			let usdValue: number;
			if (b.coin === DEFAULT_QUOTE_TOKEN) {
				usdValue = total;
			} else {
				const midPx = toNumberOrZero(mids?.[b.coin]);
				usdValue = midPx > 0 ? total * midPx : toNumberOrZero(b.entryNtl);
			}

			result.push({ coin: b.coin, total, available, inOrders, usdValue, szDecimals });
		}
		result.sort((a, b) => b.usdValue - a.usdValue);
		return result;
	}, [spotBalances, mids, getToken]);

	const filteredRows = useMemo(() => {
		if (!hideSmallBalances) return rows;
		return rows.filter((r) => r.usdValue >= SMALL_BALANCE_THRESHOLD);
	}, [rows, hideSmallBalances]);

	const totalValue = useMemo(() => rows.reduce((sum, r) => sum + r.usdValue, 0), [rows]);

	if (!isConnected) return null;

	if (isLoading) {
		return (
			<Section>
				<SectionHeader totalValue={null} hideSmall={hideSmallBalances} onHideSmallChange={setHideSmallBalances} />
				<div className="space-y-2 p-4">
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-3/4" />
				</div>
			</Section>
		);
	}

	if (hasError) {
		return (
			<Section>
				<SectionHeader totalValue={null} hideSmall={hideSmallBalances} onHideSmallChange={setHideSmallBalances} />
				<div className="p-6 text-center text-xs text-market-down">
					<Trans>Failed to load balances.</Trans>
				</div>
			</Section>
		);
	}

	if (rows.length === 0) {
		return (
			<Section>
				<SectionHeader totalValue={0} hideSmall={hideSmallBalances} onHideSmallChange={setHideSmallBalances} />
				<div className="p-6 text-center text-xs text-text-weak">
					<Trans>No spot balances.</Trans>
				</div>
			</Section>
		);
	}

	return (
		<Section>
			<SectionHeader totalValue={totalValue} hideSmall={hideSmallBalances} onHideSmallChange={setHideSmallBalances} />
			{isMobile ? (
				<div className="space-y-2 p-3">
					{filteredRows.map((row) => (
						<BalanceCard key={row.coin} row={row} />
					))}
				</div>
			) : (
				<BalancesTable rows={filteredRows} />
			)}
		</Section>
	);
}

function Section({ children }: { children: React.ReactNode }) {
	return <div className="rounded-xs border border-stroke-weak bg-bg-raised overflow-hidden">{children}</div>;
}

interface SectionHeaderProps {
	totalValue: number | null;
	hideSmall: boolean;
	onHideSmallChange: (v: boolean) => void;
}

function SectionHeader({ totalValue, hideSmall, onHideSmallChange }: SectionHeaderProps) {
	const checkboxId = useId();
	return (
		<div className="flex items-center gap-2 px-4 py-2.5 border-b border-stroke-weak/40">
			<WalletIcon className="size-3.5 text-text-weak" />
			<span className="text-xs font-medium">
				<Trans>Spot Balances</Trans>
			</span>
			<label htmlFor={checkboxId} className="ml-auto flex items-center gap-1.5 cursor-pointer text-3xs text-text-weak">
				<Checkbox
					id={checkboxId}
					checked={hideSmall}
					onCheckedChange={(checked) => onHideSmallChange(Boolean(checked))}
					className="size-3"
				/>
				{t`Hide small`}
			</label>
			{totalValue !== null && (
				<span className="text-xs font-semibold tabular-nums">{formatUSD(totalValue, { compact: true })}</span>
			)}
		</div>
	);
}

function BalancesTable({ rows }: { rows: SpotRow[] }) {
	return (
		<Table>
			<TableHeader>
				<TableRow className="border-stroke-weak/40 bg-bg-alternate hover:bg-bg-alternate">
					<TableHead className="text-3xs font-medium uppercase text-text-weak h-7">{t`Token`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase text-text-weak text-right h-7">{t`Total`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase text-text-weak text-right h-7">{t`Available`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase text-text-weak text-right h-7">{t`In Orders`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase text-text-weak text-right h-7">{t`USD Value`}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row, i) => (
					<TableRow
						key={row.coin}
						className={cn("border-stroke-weak/40 hover:bg-bg-alternate/30", i % 2 === 1 && "bg-bg-alternate")}
					>
						<TableCell className="text-xs font-medium py-1.5">
							<AssetDisplay coin={row.coin} />
						</TableCell>
						<TableCell className="text-xs text-right tabular-nums py-1.5">
							{formatToken(row.total, row.coin === DEFAULT_QUOTE_TOKEN ? 2 : row.szDecimals)}
						</TableCell>
						<TableCell className="text-xs text-right tabular-nums py-1.5">
							{formatToken(row.available, row.coin === DEFAULT_QUOTE_TOKEN ? 2 : row.szDecimals)}
						</TableCell>
						<TableCell className="text-xs text-right tabular-nums text-text-warning py-1.5">
							{row.inOrders > 0
								? formatToken(row.inOrders, row.coin === DEFAULT_QUOTE_TOKEN ? 2 : row.szDecimals)
								: "—"}
						</TableCell>
						<TableCell className="text-xs text-right tabular-nums py-1.5">
							{formatUSD(row.usdValue, { compact: true })}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function BalanceCard({ row }: { row: SpotRow }) {
	const decimals = row.coin === DEFAULT_QUOTE_TOKEN ? 2 : row.szDecimals;

	return (
		<div className="rounded-xs border border-stroke-weak/40 bg-bg-raised">
			<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
				<AssetDisplay coin={row.coin} nameClassName="text-sm font-semibold" />
				<span className="text-sm font-semibold tabular-nums">{formatUSD(row.usdValue, { compact: true })}</span>
			</div>
			<div className="border-t border-stroke-weak/40">
				<div className="grid grid-cols-3 divide-x divide-stroke-weak/40">
					<MetricCell label={t`Total`} value={formatToken(row.total, decimals)} />
					<MetricCell label={t`Available`} value={formatToken(row.available, decimals)} />
					<MetricCell
						label={t`In Orders`}
						value={row.inOrders > 0 ? formatToken(row.inOrders, decimals) : "—"}
						valueClass={row.inOrders > 0 ? "text-text-warning" : undefined}
					/>
				</div>
			</div>
		</div>
	);
}

interface MetricCellProps {
	label: string;
	value: string;
	valueClass?: string;
}

function MetricCell({ label, value, valueClass }: MetricCellProps) {
	return (
		<div className="px-3 py-2">
			<div className="text-3xs text-text-weak mb-0.5">{label}</div>
			<div className={cn("text-xs tabular-nums font-medium", valueClass)}>{value}</div>
		</div>
	);
}
