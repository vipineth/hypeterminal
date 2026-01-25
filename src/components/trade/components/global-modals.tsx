import { Suspense } from "react";
import { createLazyComponent } from "@/lib/lazy";

const DepositModal = createLazyComponent(() => import("../order-entry/deposit-modal"), "DepositModal");
const GlobalSettingsDialog = createLazyComponent(() => import("./global-settings-dialog"), "GlobalSettingsDialog");

export function GlobalModals() {
	return (
		<Suspense fallback={null}>
			<DepositModal />
			<GlobalSettingsDialog />
		</Suspense>
	);
}
