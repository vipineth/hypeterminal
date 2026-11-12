import { i18n, type Messages } from "@lingui/core";
import { defaultLocale } from "@/config/i18n";

import { messages as enMessages } from "@/locales/en/messages.po";

i18n.loadAndActivate({ locale: defaultLocale, messages: enMessages });

const catalogImports = import.meta.glob<{ messages: Messages }>([
	"../locales/*/messages.po",
	"!../locales/en/messages.po",
]);

/**
 * We do a dynamic import of just the catalog that we need
 * @param locale any locale string
 */
export async function dynamicActivate(locale: string) {
	if (i18n.locale === locale) return;

	if (locale === defaultLocale) {
		i18n.loadAndActivate({ locale, messages: enMessages });
		return;
	}

	const path = `../locales/${locale}/messages.po`;
	const loader = catalogImports[path];
	if (!loader) {
		throw new Error(`No locale data found for "${locale}"`);
	}
	const { messages } = await loader();
	i18n.loadAndActivate({ locale, messages });
}
