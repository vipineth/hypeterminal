import { Suspense } from "react";
import { createLazyComponent } from "@/lib/lazy";

const DepositModal = createLazyComponent(() => import("../tradebox/deposit-modal"), "DepositModal");
const GlobalSettingsDialog = createLazyComponent(() => import("./global-settings-dialog"), "GlobalSettingsDialog");
const SpotSwapModal = createLazyComponent(() => import("./spot-swap-modal"), "SpotSwapModal");

export function GlobalModals() {
	return (
		<Suspense fallback={null}>
			<DepositModal />
			<GlobalSettingsDialog />
			<SpotSwapModal />
		</Suspense>
	);
}
