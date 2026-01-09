import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import type { ChangeEvent } from "react";
import { useEffect, useId, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MARKET_ORDER_SLIPPAGE_MAX_BPS, MARKET_ORDER_SLIPPAGE_MIN_BPS } from "@/config/interface";
import {
	dynamicActivate,
	type LocaleCode,
	localeList,
	type NumberFormatLocale,
	numberFormatLocaleList,
} from "@/lib/i18n";
import { useGlobalSettings, useGlobalSettingsActions } from "@/stores/use-global-settings-store";
import { useMarketOrderSlippageBps, useTradeSettingsActions } from "@/stores/use-trade-settings-store";

interface GlobalSettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GlobalSettingsDialog({ open, onOpenChange }: GlobalSettingsDialogProps) {
	const { i18n } = useLingui();
	const slippageBps = useMarketOrderSlippageBps();
	const { setMarketOrderSlippageBps } = useTradeSettingsActions();
	const {
		showOrdersOnChart,
		showPositionsOnChart,
		showExecutionsOnChart,
		showOrderbookInUsd,
		showChartScanlines,
		numberFormatLocale,
	} = useGlobalSettings();
	const {
		setShowOrdersOnChart,
		setShowPositionsOnChart,
		setShowExecutionsOnChart,
		setShowOrderbookInUsd,
		setShowChartScanlines,
		setNumberFormatLocale,
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

	const handleLanguageChange = (locale: LocaleCode) => {
		dynamicActivate(locale);
	};

	const handleNumberFormatChange = (locale: NumberFormatLocale) => {
		setNumberFormatLocale(locale);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t`Settings`}</DialogTitle>
					<DialogDescription>{t`Customize your trading experience.`}</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 text-xs">
					{/* Language */}
					<div className="flex items-center justify-between gap-4">
						<div className="text-xs text-muted-foreground">
							<Trans>Display Language</Trans>
						</div>
						<Select value={i18n.locale} onValueChange={(value) => handleLanguageChange(value as LocaleCode)}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{localeList.map(({ code, name }) => (
									<SelectItem key={code} value={code}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Number Format */}
					<div className="flex items-center justify-between gap-4">
						<div className="space-y-0.5">
							<div className="text-xs text-muted-foreground">
								<Trans>Number Format</Trans>
							</div>
							<div className="text-4xs text-muted-foreground/70">
								<Trans>Format for numbers and dates</Trans>
							</div>
						</div>
						<Select
							value={numberFormatLocale}
							onValueChange={(value) => handleNumberFormatChange(value as NumberFormatLocale)}
						>
							<SelectTrigger className="w-48">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{numberFormatLocaleList.map(({ code, name }) => (
									<SelectItem key={code} value={code}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="h-px bg-border/40" />

					{/* Slippage */}
					<div className="space-y-3">
						<div className="flex items-center justify-between gap-4">
							<div className="space-y-0.5">
								<div className="text-xs">{t`Market Order Slippage`}</div>
								<div className="text-4xs text-muted-foreground">{t`Max slippage allowed for market orders.`}</div>
							</div>
							<div className="flex items-center gap-1.5">
								<Input
									type="number"
									value={slippageInput}
									onChange={handleSlippageInputChange}
									onBlur={handleSlippageInputBlur}
									min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
									max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
									inputSize="sm"
									className="w-16 text-right tabular-nums"
								/>
								<span className="text-4xs text-muted-foreground w-6">{t`bps`}</span>
							</div>
						</div>
						<div className="space-y-1">
							<Slider
								value={[slippageBps]}
								onValueChange={handleSlippageSliderChange}
								min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
								max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
								step={5}
							/>
							<div className="flex items-center justify-between text-4xs text-muted-foreground">
								<span>{MARKET_ORDER_SLIPPAGE_MIN_BPS}</span>
								<span className="font-medium text-foreground">{slippagePercent}%</span>
								<span>{MARKET_ORDER_SLIPPAGE_MAX_BPS}</span>
							</div>
						</div>
					</div>

					<div className="h-px bg-border/40" />

					{/* Toggles */}
					<div className="space-y-3">
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Chart`}</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between gap-4">
								<label htmlFor={showOrdersId} className="text-xs text-muted-foreground">
									{t`Show Orders on Chart`}
								</label>
								<Switch id={showOrdersId} checked={showOrdersOnChart} onCheckedChange={setShowOrdersOnChart} />
							</div>
							<div className="flex items-center justify-between gap-4">
								<label htmlFor={showPositionsId} className="text-xs text-muted-foreground">
									{t`Show Positions on Chart`}
								</label>
								<Switch id={showPositionsId} checked={showPositionsOnChart} onCheckedChange={setShowPositionsOnChart} />
							</div>
							<div className="flex items-center justify-between gap-4">
								<label htmlFor={showExecutionsId} className="text-xs text-muted-foreground">
									{t`Show Executions on Chart`}
								</label>
								<Switch
									id={showExecutionsId}
									checked={showExecutionsOnChart}
									onCheckedChange={setShowExecutionsOnChart}
								/>
							</div>
							<div className="flex items-center justify-between gap-4">
								<label htmlFor={showScanlinesId} className="text-xs text-muted-foreground">
									{t`Show Scanlines`}
								</label>
								<Switch id={showScanlinesId} checked={showChartScanlines} onCheckedChange={setShowChartScanlines} />
							</div>
						</div>
					</div>

					<div className="h-px bg-border/40" />

					<div className="space-y-3">
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Order Book`}</div>
						<div className="flex items-center justify-between gap-4">
							<label htmlFor={showOrderbookUsdId} className="text-xs text-muted-foreground">
								{t`Show Values in USD`}
							</label>
							<Switch id={showOrderbookUsdId} checked={showOrderbookInUsd} onCheckedChange={setShowOrderbookInUsd} />
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
