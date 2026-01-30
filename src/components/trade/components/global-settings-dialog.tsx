import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Check, Moon, Sun } from "lucide-react";
import type { ChangeEvent } from "react";
import { useId, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MARKET_ORDER_SLIPPAGE_MAX_BPS, MARKET_ORDER_SLIPPAGE_MIN_BPS } from "@/config/constants";
import { cn } from "@/lib/cn";
import {
	dynamicActivate,
	type LocaleCode,
	localeList,
	type NumberFormatLocale,
	numberFormatLocaleList,
} from "@/lib/i18n";
import { type ColorTheme, colorThemes, useTheme } from "@/providers/theme";
import {
	useGlobalSettings,
	useGlobalSettingsActions,
	useMarketOrderSlippageBps,
} from "@/stores/use-global-settings-store";
import { useSettingsDialogActions, useSettingsDialogOpen } from "@/stores/use-global-modal-store";

export function GlobalSettingsDialog() {
	const open = useSettingsDialogOpen();
	const { close } = useSettingsDialogActions();
	const { i18n } = useLingui();
	const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
	const slippageBps = useMarketOrderSlippageBps();
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
		setMarketOrderSlippageBps,
	} = useGlobalSettingsActions();

	const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

	const [localSlippageInput, setLocalSlippageInput] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const slippagePercent = (slippageBps / 100).toFixed(2);
	const slippageInputValue = localSlippageInput ?? String(slippageBps);

	function handleSlippageInputChange(event: ChangeEvent<HTMLInputElement>) {
		const nextValue = event.target.value;
		setLocalSlippageInput(nextValue);

		if (nextValue.trim() === "") return;
		const parsed = Number(nextValue);
		if (Number.isFinite(parsed)) {
			setMarketOrderSlippageBps(parsed);
		}
	}

	function handleSlippageInputBlur() {
		setLocalSlippageInput(null);
	}

	function handleSlippageSliderChange(values: number[]) {
		const nextValue = values[0];
		if (typeof nextValue === "number" && nextValue !== slippageBps) {
			setMarketOrderSlippageBps(nextValue);
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
					{/* Language Section */}
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

					{/* Number Format Section */}
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

					{/* Appearance Section */}
					<SettingsSection title={t`Appearance`}>
						<div className="space-y-3">
							<div className="flex items-center gap-1 p-0.5 bg-muted rounded-md w-fit">
								<button
									type="button"
									onClick={() => setTheme("light")}
									className={cn(
										"flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-all",
										!isDark ? "bg-bg text-fg shadow-sm" : "text-muted-fg hover:text-fg",
									)}
								>
									<Sun className="size-3.5" />
									{t`Light`}
								</button>
								<button
									type="button"
									onClick={() => setTheme("dark")}
									className={cn(
										"flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-xs font-medium transition-all",
										isDark ? "bg-bg text-fg shadow-sm" : "text-muted-fg hover:text-fg",
									)}
								>
									<Moon className="size-3.5" />
									{t`Dark`}
								</button>
							</div>
							<div className="grid grid-cols-5 gap-2">
								{colorThemes.map((t) => (
									<ColorThemeButton
										key={t.id}
										theme={t}
										isSelected={colorTheme === t.id}
										isDark={isDark}
										onClick={() => setColorTheme(t.id)}
									/>
								))}
							</div>
						</div>
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
									allowDecimals={false}
									min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
									max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
									inputSize="sm"
									className="flex-1 text-right tabular-nums"
								/>
								<span className="text-xs text-muted-fg min-w-8">{t`bps`}</span>
							</div>
							<Slider
								value={[slippageBps]}
								onValueChange={handleSlippageSliderChange}
								min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
								max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
							/>
							<div className="flex items-center justify-between text-[10px] text-muted-fg">
								<span>{MARKET_ORDER_SLIPPAGE_MIN_BPS}</span>
								<span className="font-medium text-fg tabular-nums">{slippagePercent}%</span>
								<span>{MARKET_ORDER_SLIPPAGE_MAX_BPS}</span>
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
				<h3 className="text-sm font-medium text-fg">{title}</h3>
				{description && <p className="text-xs text-muted-fg mt-0.5">{description}</p>}
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
			<label htmlFor={id} className="text-xs text-muted-fg cursor-pointer">
				{label}
			</label>
			<Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	);
}

interface ColorThemeButtonProps {
	theme: { id: ColorTheme; name: string; description: string };
	isSelected: boolean;
	isDark: boolean;
	onClick: () => void;
}

const themePreviewColors: Record<
	ColorTheme,
	{ light: string; dark: string; accent: string; positive: string; negative: string }
> = {
	terminal: { light: "#f5f5f5", dark: "#1e1e1e", accent: "#6366f1", positive: "#10b981", negative: "#ef4444" },
	midnight: { light: "#eef2ff", dark: "#0f172a", accent: "#818cf8", positive: "#34d399", negative: "#f87171" },
	arctic: { light: "#f0f9ff", dark: "#0c1929", accent: "#0ea5e9", positive: "#14b8a6", negative: "#f87171" },
};

function ColorThemeButton({ theme, isSelected, isDark, onClick }: ColorThemeButtonProps) {
	const colors = themePreviewColors[theme.id];
	const bgColor = isDark ? colors.dark : colors.light;
	const textColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)";

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group relative flex flex-col items-center gap-1 rounded-md p-1.5 transition-all",
				"hover:bg-muted",
				isSelected && "bg-muted ring-1 ring-primary",
			)}
		>
			<div
				className="relative w-full aspect-4/3 rounded-sm overflow-hidden border border-border/50"
				style={{ backgroundColor: bgColor }}
			>
				<div className="absolute top-0.5 left-0.5 flex gap-px">
					<div className="size-1 rounded-full" style={{ backgroundColor: colors.negative }} />
					<div className="size-1 rounded-full" style={{ backgroundColor: colors.accent }} />
					<div className="size-1 rounded-full" style={{ backgroundColor: colors.positive }} />
				</div>
				<div className="absolute bottom-1 left-0.5 right-0.5 space-y-0.5">
					<div className="flex gap-0.5">
						<div className="h-px w-2 rounded-full" style={{ backgroundColor: colors.positive }} />
						<div className="h-px flex-1 rounded-full" style={{ backgroundColor: textColor }} />
					</div>
					<div className="flex gap-0.5">
						<div className="h-px w-1.5 rounded-full" style={{ backgroundColor: colors.negative }} />
						<div className="h-px flex-1 rounded-full opacity-60" style={{ backgroundColor: textColor }} />
					</div>
				</div>
				{isSelected && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/20">
						<div className="rounded-full bg-primary p-0.5">
							<Check className="size-2 text-primary-fg" strokeWidth={3} />
						</div>
					</div>
				)}
			</div>
			<span
				className={cn(
					"text-[10px] truncate w-full text-center transition-colors",
					isSelected ? "text-fg font-medium" : "text-muted-fg group-hover:text-fg",
				)}
			>
				{theme.name}
			</span>
		</button>
	);
}
