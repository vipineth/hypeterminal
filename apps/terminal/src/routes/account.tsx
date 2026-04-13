import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/components/account/account-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/account")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Account",
			description: "View your account overview, positions, balances, and manage deposits, withdrawals, and transfers.",
			path: "/account",
			keywords: ["account", "portfolio", "balances", "positions"],
		}),
	component: function AccountRoute() {
		return (
			<ClientOnly fallback={null}>
				<AccountPage />
			</ClientOnly>
		);
	},
});
