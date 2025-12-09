import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HyperliquidProvider } from "./hyperliquid-provider";
import { ThemeProvider } from "./theme";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	return (
		<QueryClientProvider client={queryClient}>
			<HyperliquidProvider>
				<ThemeProvider>{children}</ThemeProvider>
			</HyperliquidProvider>
		</QueryClientProvider>
	);
}
