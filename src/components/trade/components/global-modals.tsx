import { Suspense } from "react";
import { createLazyComponent } from "@/lib/lazy";

const DepositModal = createLazyComponent(() => import("../tradebox/deposit-modal"), "DepositModal");
const GlobalSettingsDialog = createLazyComponent(() => import("./global-settings-dialog"), "GlobalSettingsDialog");
const SpotSwapModal = createLazyComponent(() => import("./spot-swap-modal"), "SpotSwapModal");
const CommandMenu = createLazyComponent(() => import("./command-menu"), "CommandMenu");

export function GlobalModals() {
	return (
		<Suspense fallback={null}>
			<DepositModal />
			<GlobalSettingsDialog />
			<SpotSwapModal />
			<CommandMenu />
		</Suspense>
	);
}
