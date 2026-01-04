import { i18n, type Messages } from "@lingui/core";
import { messages as enMessages } from "@/locales/en/messages.po";

export const locales = {
	en: "English",
	fr: "French",
};

export const isLocaleValid = (locale: string) => Object.keys(locales).includes(locale);

export const defaultLocale = "en";

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
