import { Modal, ModalContent, ModalHeader, ModalPopup, ModalTitle, Select, Slider, Toggle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { NumberInput } from "@/components/ui/number-input";
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
	useNetwork,
} from "@/stores/use-global-settings-store";

export function GlobalSettingsDialog() {
	const open = useSettingsDialogOpen();
	const { close } = useSettingsDialogActions();
	const { i18n } = useLingui();
	const slippagePercent = useMarketOrderSlippagePercent();
	const { showOrderbookInQuote, showChartScanlines, numberFormatLocale } = useGlobalSettings();
	const {
		setShowOrderbookInQuote,
		setShowChartScanlines,
		setNumberFormatLocale,
		setMarketOrderSlippagePercent,
		setNetwork,
	} = useGlobalSettingsActions();
	const network = useNetwork();

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

	function handleSlippageSliderChange(value: number | readonly number[]) {
		const nextValue = Array.isArray(value) ? value[0] : value;
		if (typeof nextValue === "number" && nextValue !== slippagePercent) {
			setMarketOrderSlippagePercent(nextValue);
		}
	}

	function handleLanguageChange(value: string | null) {
		if (value) dynamicActivate(value as LocaleCode);
	}

	function handleNumberFormatChange(value: string | null) {
		if (value) setNumberFormatLocale(value as NumberFormatLocale);
	}

	const languageOptions = localeList.map(({ code, name }) => ({ value: code, label: name }));
	const numberFormatOptions = numberFormatLocaleList.map(({ code, name }) => ({ value: code, label: name }));
	const networkOptions = [
		{ value: "mainnet", label: "Mainnet" },
		{ value: "testnet", label: "Testnet" },
	];

	return (
		<Modal open={open} onOpenChange={close}>
			<ModalPopup size="sm">
				<ModalHeader className="border-b border-stroke-weak/50">
					<ModalTitle>{t`Settings`}</ModalTitle>
				</ModalHeader>

				<ModalContent className="space-y-5 max-h-[70vh] overflow-y-auto">
					<SettingsSection title={t`Display Language`}>
						<Select value={i18n.locale} onValueChange={handleLanguageChange} options={languageOptions} />
					</SettingsSection>

					<SettingsSection title={t`Number Format`} description={t`Format for numbers and dates`}>
						<Select value={numberFormatLocale} onValueChange={handleNumberFormatChange} options={numberFormatOptions} />
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
								<span className="text-xs text-text-weak min-w-8">%</span>
							</div>
							<Slider
								value={[slippagePercent]}
								onValueChange={handleSlippageSliderChange}
								min={MARKET_ORDER_SLIPPAGE_MIN_PERCENT}
								max={MARKET_ORDER_SLIPPAGE_MAX_PERCENT}
								step={0.1}
							/>
							<div className="flex items-center justify-between text-xs text-text-strong">
								<span>{MARKET_ORDER_SLIPPAGE_MIN_PERCENT}%</span>
								<span className="font-medium text-text-strong tabular-nums">{slippagePercent}%</span>
								<span>{MARKET_ORDER_SLIPPAGE_MAX_PERCENT}%</span>
							</div>
						</div>
					</SettingsSection>

					<SettingsSection title={t`Chart`}>
						<Toggle label={t`Show Scanlines`} checked={showChartScanlines} onCheckedChange={setShowChartScanlines} />
					</SettingsSection>

					<SettingsSection title={t`Order Book`}>
						<Toggle
							label={t`Show Values in Quote Asset`}
							checked={showOrderbookInQuote}
							onCheckedChange={setShowOrderbookInQuote}
						/>
					</SettingsSection>

					<SettingsSection title={t`Network`} description={t`Switch between mainnet and testnet. Page will reload.`}>
						<Select
							value={network}
							onValueChange={(value) => {
								if (value) setNetwork(value as "mainnet" | "testnet");
							}}
							options={networkOptions}
						/>
					</SettingsSection>
				</ModalContent>
			</ModalPopup>
		</Modal>
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
				<h3 className="text-sm font-medium text-text-strong">{title}</h3>
				{description && <p className="text-xs text-text-weak mt-0.5">{description}</p>}
			</div>
			{children}
		</div>
	);
}
