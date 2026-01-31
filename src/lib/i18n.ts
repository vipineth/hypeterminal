import { i18n, type Messages } from "@lingui/core";
import { messages as enMessages } from "@/locales/en/messages.po";

// Top 6 most spoken languages globally with native names
export const locales = {
	en: "English",
	zh: "中文",
	hi: "हिन्दी",
	es: "Español",
	fr: "Français",
	ar: "العربية",
} as const;

export type LocaleCode = keyof typeof locales;

export const localeList = Object.entries(locales).map(([code, name]) => ({
	code: code as LocaleCode,
	name,
}));

// Number/date format locales - maps to Intl locale codes
// "auto" means follow the display language
export const numberFormatLocales = {
	auto: "Auto (Follow Language)",
	"en-US": "English (US) - 1,234.56",
	"en-GB": "English (UK) - 1,234.56",
	"de-DE": "German - 1.234,56",
	"fr-FR": "French - 1 234,56",
	"es-ES": "Spanish - 1.234,56",
	"zh-CN": "Chinese - 1,234.56",
	"ja-JP": "Japanese - 1,234.56",
	"ar-SA": "Arabic - ١٬٢٣٤٫٥٦",
	"hi-IN": "Hindi - 1,234.56",
	"pt-BR": "Portuguese (Brazil) - 1.234,56",
	"ru-RU": "Russian - 1 234,56",
} as const;

export type NumberFormatLocale = keyof typeof numberFormatLocales;

export const numberFormatLocaleList = Object.entries(numberFormatLocales).map(([code, name]) => ({
	code: code as NumberFormatLocale,
	name,
}));

// Map display language codes to their Intl locale equivalents
const languageToIntlLocale: Record<LocaleCode, string> = {
	en: "en-US",
	zh: "zh-CN",
	hi: "hi-IN",
	es: "es-ES",
	fr: "fr-FR",
	ar: "ar-SA",
};

/**
 * Resolves the number format locale based on user preference.
 * If "auto", returns the Intl locale for the current display language.
 */
export function resolveNumberFormatLocale(formatLocale: NumberFormatLocale): string {
	if (formatLocale === "auto") {
		return languageToIntlLocale[i18n.locale as LocaleCode] ?? "en-US";
	}
	return formatLocale;
}

export const defaultLocale: LocaleCode = "en";

// Initialize with default locale synchronously (required for SSR)
i18n.loadAndActivate({ locale: defaultLocale, messages: enMessages });

const catalogImports = import.meta.glob<{ messages: Messages }>("../locales/*/messages.po");

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
	if (i18n.locale === locale) return;

	const path = `../locales/${locale}/messages.po`;
	const loader = catalogImports[path];
	if (!loader) {
		throw new Error(`No locale data found for "${locale}"`);
	}
	const { messages } = await loader();
	i18n.loadAndActivate({ locale, messages });
}
