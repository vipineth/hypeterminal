import { Dropdown } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CHART_TYPES, type ChartTypeConfig } from "@/config/chart";
import { FAVORITE_SET, type IntervalConfig, MORE_INTERVALS, STARRED_INTERVALS } from "@/lib/chart/kline-config";
import { cn } from "@/lib/cn";
import { type ChartSource, ChartSourceToggle, type ChartSourceToggleIntentHandlers } from "./chart-source-toggle";

interface Props {
	activeInterval: IntervalConfig;
	onIntervalChange: (interval: IntervalConfig) => void;
	activeChartType: ChartTypeConfig;
	onChartTypeChange: (chartType: ChartTypeConfig) => void;
	onChartSourceChange?: (source: ChartSource) => void;
	tradingViewIntentHandlers?: ChartSourceToggleIntentHandlers;
}

export function KlineToolbar({
	activeInterval,
	onIntervalChange,
	activeChartType,
	onChartTypeChange,
	onChartSourceChange,
	tradingViewIntentHandlers,
}: Props) {
	const isNonFavoriteActive = !FAVORITE_SET.has(activeInterval.resolution);
	const showChartSourceToggle = Boolean(onChartSourceChange && tradingViewIntentHandlers);

	return (
		<div className="flex min-w-0 items-center justify-between gap-2 border-b border-stroke-weak/60 bg-surface">
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5 p-2 py-1.5">
				{STARRED_INTERVALS.map((interval) => (
					<button
						key={interval.resolution}
						type="button"
						onClick={() => onIntervalChange(interval)}
						className={cn(
							"px-1.5 py-0.5 text-xs rounded-8 transition-colors",
							activeInterval.resolution === interval.resolution
								? "text-fg font-semibold"
								: "text-fg-muted hover:text-fg",
						)}
					>
						{interval.label}
					</button>
				))}
				<Dropdown
					trigger={
						<span
							className={cn(
								"flex items-center gap-0.5",
								isNonFavoriteActive ? "text-fg font-semibold" : "text-fg-muted font-normal",
							)}
						>
							{isNonFavoriteActive ? activeInterval.label : null}
						</span>
					}
					items={MORE_INTERVALS.map((interval) => ({
						label: interval.label,
						active: activeInterval.resolution === interval.resolution,
						onSelect: () => onIntervalChange(interval),
					}))}
					align="start"
					size="sm"
					triggerVariant="minimal"
					triggerAriaLabel={t`More intervals`}
					className="inline-flex"
					popupClassName="min-w-0 w-max"
				/>
				<div className="h-3 w-px shrink-0 self-center bg-stroke-weak/50" aria-hidden />
				<Dropdown
					trigger={<span className="flex items-center gap-0.5 font-semibold text-fg">{activeChartType.label}</span>}
					items={CHART_TYPES.map((ct) => ({
						label: ct.label,
						active: activeChartType.type === ct.type,
						onSelect: () => onChartTypeChange(ct),
					}))}
					align="start"
					size="sm"
					triggerVariant="minimal"
					triggerAriaLabel={t`Chart type`}
					className="inline-flex"
					popupClassName="min-w-0 w-max"
				/>
			</div>
			{showChartSourceToggle && onChartSourceChange && tradingViewIntentHandlers ? (
				<div className="shrink-0 pr-2">
					<ChartSourceToggle
						value="default"
						onValueChange={onChartSourceChange}
						tradingViewIntentHandlers={tradingViewIntentHandlers}
					/>
				</div>
			) : null}
		</div>
	);
}
