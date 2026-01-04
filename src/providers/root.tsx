import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { ThemeProvider } from "./theme";
// Import to initialize i18n with default locale (side effect)
import "@/lib/i18n";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>
					<ThemeProvider>{children}</ThemeProvider>
				</I18nProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
