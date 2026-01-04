import type { ChangeEvent } from "react";
import { useEffect, useId, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
	MARKET_ORDER_SLIPPAGE_MAX_BPS,
	MARKET_ORDER_SLIPPAGE_MIN_BPS,
	UI_TEXT,
} from "@/constants/app";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { useMarketOrderSlippageBps, useTradeSettingsActions } from "@/stores/use-trade-settings-store";

interface GlobalSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const SETTINGS_TEXT = UI_TEXT.GLOBAL_SETTINGS;

export function GlobalSettingsDialog({ open, onOpenChange }: GlobalSettingsDialogProps) {
	const slippageBps = useMarketOrderSlippageBps();
	const { setMarketOrderSlippageBps } = useTradeSettingsActions();
	const {
		showOrdersOnChart,
		showPositionsOnChart,
		showExecutionsOnChart,
		showOrderbookInUsd,
		showChartScanlines,
	} = useGlobalSettings();
	const {
		setShowOrdersOnChart,
		setShowPositionsOnChart,
		setShowExecutionsOnChart,
		setShowOrderbookInUsd,
		setShowChartScanlines,
	} = useGlobalSettingsActions();

	const [slippageInput, setSlippageInput] = useState(String(slippageBps));

	const slippagePercent = (slippageBps / 100).toFixed(2);

	useEffect(() => {
		setSlippageInput(String(slippageBps));
	}, [slippageBps]);

	const handleSlippageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const nextValue = event.target.value;
		setSlippageInput(nextValue);

		if (nextValue.trim() === "") return;
		const parsed = Number(nextValue);
		if (Number.isFinite(parsed)) {
			setMarketOrderSlippageBps(parsed);
		}
	};

	const handleSlippageInputBlur = () => {
		if (slippageInput.trim() === "") {
			setSlippageInput(String(slippageBps));
		}
	};

	const handleSlippageSliderChange = (values: number[]) => {
		const nextValue = values[0];
		if (typeof nextValue === "number" && nextValue !== slippageBps) {
			setMarketOrderSlippageBps(nextValue);
		}
	};

	const showOrdersId = useId();
	const showPositionsId = useId();
	const showExecutionsId = useId();
	const showScanlinesId = useId();
	const showOrderbookUsdId = useId();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{SETTINGS_TEXT.TITLE}</DialogTitle>
					<DialogDescription>{SETTINGS_TEXT.DESCRIPTION}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 text-xs">
					<section className="space-y-2">
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">
							{SETTINGS_TEXT.SECTION_TRADING}
						</div>
						<div className="rounded-md border border-border/40">
							<div className="px-3 py-2 space-y-2">
								<div className="flex items-start justify-between gap-4">
									<div className="space-y-1">
										<div className="text-xs font-medium">{SETTINGS_TEXT.SLIPPAGE_LABEL}</div>
										<div className="text-4xs text-muted-foreground">{SETTINGS_TEXT.SLIPPAGE_HELP}</div>
									</div>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											value={slippageInput}
											onChange={handleSlippageInputChange}
											onBlur={handleSlippageInputBlur}
											min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
											max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
											inputSize="sm"
											className="w-20 text-right tabular-nums"
										/>
										<span className="text-4xs text-muted-foreground">{SETTINGS_TEXT.SLIPPAGE_UNIT}</span>
									</div>
								</div>
								<Slider
									value={[slippageBps]}
									onValueChange={handleSlippageSliderChange}
									min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
									max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
									step={5}
									className="py-1"
								/>
								<div className="flex items-center justify-between text-4xs text-muted-foreground">
									<span>
										{MARKET_ORDER_SLIPPAGE_MIN_BPS} {SETTINGS_TEXT.SLIPPAGE_UNIT}
									</span>
									<span>{slippagePercent}%</span>
									<span>
										{MARKET_ORDER_SLIPPAGE_MAX_BPS} {SETTINGS_TEXT.SLIPPAGE_UNIT}
									</span>
								</div>
							</div>
						</div>
					</section>

					<section className="space-y-2">
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">
							{SETTINGS_TEXT.SECTION_CHART}
						</div>
						<div className="rounded-md border border-border/40 divide-y divide-border/40">
							<div className="flex items-center justify-between gap-4 px-3 py-2">
								<label htmlFor={showOrdersId} className="text-xs">
									{SETTINGS_TEXT.SHOW_ORDERS}
								</label>
								<Switch id={showOrdersId} checked={showOrdersOnChart} onCheckedChange={setShowOrdersOnChart} />
							</div>
							<div className="flex items-center justify-between gap-4 px-3 py-2">
								<label htmlFor={showPositionsId} className="text-xs">
									{SETTINGS_TEXT.SHOW_POSITIONS}
								</label>
								<Switch
									id={showPositionsId}
									checked={showPositionsOnChart}
									onCheckedChange={setShowPositionsOnChart}
								/>
							</div>
							<div className="flex items-center justify-between gap-4 px-3 py-2">
								<label htmlFor={showExecutionsId} className="text-xs">
									{SETTINGS_TEXT.SHOW_EXECUTIONS}
								</label>
								<Switch
									id={showExecutionsId}
									checked={showExecutionsOnChart}
									onCheckedChange={setShowExecutionsOnChart}
								/>
							</div>
							<div className="flex items-center justify-between gap-4 px-3 py-2">
								<label htmlFor={showScanlinesId} className="text-xs">
									{SETTINGS_TEXT.SHOW_SCANLINES}
								</label>
								<Switch
									id={showScanlinesId}
									checked={showChartScanlines}
									onCheckedChange={setShowChartScanlines}
								/>
							</div>
						</div>
					</section>

					<section className="space-y-2">
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">
							{SETTINGS_TEXT.SECTION_ORDERBOOK}
						</div>
						<div className="rounded-md border border-border/40">
							<div className="flex items-center justify-between gap-4 px-3 py-2">
								<label htmlFor={showOrderbookUsdId} className="text-xs">
									{SETTINGS_TEXT.SHOW_ORDERBOOK_USD}
								</label>
								<Switch
									id={showOrderbookUsdId}
									checked={showOrderbookInUsd}
									onCheckedChange={setShowOrderbookInUsd}
								/>
							</div>
						</div>
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
