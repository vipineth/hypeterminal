import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import type { ChangeEvent } from "react";
import { useId, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MARKET_ORDER_SLIPPAGE_MAX_PERCENT, MARKET_ORDER_SLIPPAGE_MIN_PERCENT } from "@/config/constants";
import {
	dynamicActivate,
	type LocaleCode,
	localeList,
	type NumberFormatLocale,
	numberFormatLocaleList,
} from "@/lib/i18n";
import { useSettingsDialogActions, useSettingsDialogOpen } from "@/stores/use-global-modal-store";
import {
	useGlobalSettings,
	useGlobalSettingsActions,
	useMarketOrderSlippagePercent,
} from "@/stores/use-global-settings-store";

export function GlobalSettingsDialog() {
	const open = useSettingsDialogOpen();
	const { close } = useSettingsDialogActions();
	const { i18n } = useLingui();
	const slippagePercent = useMarketOrderSlippagePercent();
	const {
		showOrdersOnChart,
		showPositionsOnChart,
		showExecutionsOnChart,
		showOrderbookInQuote,
		showChartScanlines,
		numberFormatLocale,
	} = useGlobalSettings();
	const {
		setShowOrdersOnChart,
		setShowPositionsOnChart,
		setShowExecutionsOnChart,
		setShowOrderbookInQuote,
		setShowChartScanlines,
		setNumberFormatLocale,
		setMarketOrderSlippagePercent,
	} = useGlobalSettingsActions();

	const [localSlippageInput, setLocalSlippageInput] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const slippageInputValue = localSlippageInput ?? String(slippagePercent);

	function handleSlippageInputChange(event: ChangeEvent<HTMLInputElement>) {
		const nextValue = event.target.value;
		setLocalSlippageInput(nextValue);

		if (nextValue.trim() === "") return;
		const parsed = Number(nextValue);
		if (Number.isFinite(parsed)) {
			setMarketOrderSlippagePercent(parsed);
		}
	}

	function handleSlippageInputBlur() {
		setLocalSlippageInput(null);
	}

	function handleSlippageSliderChange(values: number[]) {
		const nextValue = values[0];
		if (typeof nextValue === "number" && nextValue !== slippagePercent) {
			setMarketOrderSlippagePercent(nextValue);
		}
	}

	const showOrdersId = useId();
	const showPositionsId = useId();
	const showExecutionsId = useId();
	const showScanlinesId = useId();
	const showOrderbookQuoteId = useId();

	function handleLanguageChange(locale: LocaleCode) {
		dynamicActivate(locale);
	}

	function handleNumberFormatChange(locale: NumberFormatLocale) {
		setNumberFormatLocale(locale);
	}

	return (
		<Dialog open={open} onOpenChange={close}>
			<DialogContent className="sm:max-w-[400px] gap-0 p-0">
				<DialogHeader className="px-5 pt-5 pb-4 border-b border-border/50">
					<DialogTitle>{t`Settings`}</DialogTitle>
				</DialogHeader>

				<div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
					<SettingsSection title={t`Display Language`}>
						<Select value={i18n.locale} onValueChange={(value) => handleLanguageChange(value as LocaleCode)}>
							<SelectTrigger className="w-full h-9">
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
					</SettingsSection>

					<SettingsSection title={t`Number Format`} description={t`Format for numbers and dates`}>
						<Select
							value={numberFormatLocale}
							onValueChange={(value) => handleNumberFormatChange(value as NumberFormatLocale)}
						>
							<SelectTrigger className="w-full h-9">
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
					</SettingsSection>

					<SettingsSection
						title={t`Market Order Slippage`}
						description={t`Maximum slippage tolerance for market orders`}
					>
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<NumberInput
									ref={inputRef}
									value={slippageInputValue}
									onChange={handleSlippageInputChange}
									onBlur={handleSlippageInputBlur}
									min={MARKET_ORDER_SLIPPAGE_MIN_PERCENT}
									max={MARKET_ORDER_SLIPPAGE_MAX_PERCENT}
									inputSize="sm"
									className="flex-1 text-right tabular-nums"
								/>
								<span className="text-xs text-fg-700 min-w-8">%</span>
							</div>
							<Slider
								value={[slippagePercent]}
								onValueChange={handleSlippageSliderChange}
								min={MARKET_ORDER_SLIPPAGE_MIN_PERCENT}
								max={MARKET_ORDER_SLIPPAGE_MAX_PERCENT}
								step={0.1}
							/>
							<div className="flex items-center justify-between text-3xs text-fg-700">
								<span>{MARKET_ORDER_SLIPPAGE_MIN_PERCENT}%</span>
								<span className="font-medium text-fg-900 tabular-nums">{slippagePercent}%</span>
								<span>{MARKET_ORDER_SLIPPAGE_MAX_PERCENT}%</span>
							</div>
						</div>
					</SettingsSection>

					<SettingsSection title={t`Chart`}>
						<div className="space-y-3">
							<SettingsToggle
								id={showOrdersId}
								label={t`Show Orders`}
								checked={showOrdersOnChart}
								onCheckedChange={setShowOrdersOnChart}
							/>
							<SettingsToggle
								id={showPositionsId}
								label={t`Show Positions`}
								checked={showPositionsOnChart}
								onCheckedChange={setShowPositionsOnChart}
							/>
							<SettingsToggle
								id={showExecutionsId}
								label={t`Show Executions`}
								checked={showExecutionsOnChart}
								onCheckedChange={setShowExecutionsOnChart}
							/>
							<SettingsToggle
								id={showScanlinesId}
								label={t`Show Scanlines`}
								checked={showChartScanlines}
								onCheckedChange={setShowChartScanlines}
							/>
						</div>
					</SettingsSection>

					<SettingsSection title={t`Order Book`}>
						<SettingsToggle
							id={showOrderbookQuoteId}
							label={t`Show Values in Quote Asset`}
							checked={showOrderbookInQuote}
							onCheckedChange={setShowOrderbookInQuote}
						/>
					</SettingsSection>
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface SettingsSectionProps {
	title: string;
	description?: string;
	children: React.ReactNode;
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
	return (
		<div className="space-y-2">
			<div>
				<h3 className="text-sm font-medium text-fg-900">{title}</h3>
				{description && <p className="text-xs text-fg-700 mt-0.5">{description}</p>}
			</div>
			{children}
		</div>
	);
}

interface SettingsToggleProps {
	id: string;
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}

function SettingsToggle({ id, label, checked, onCheckedChange }: SettingsToggleProps) {
	return (
		<div className="flex items-center justify-between">
			<label htmlFor={id} className="text-xs text-fg-700 cursor-pointer">
				{label}
			</label>
			<Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}
