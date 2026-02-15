import { Suspense } from "react";
import { createLazyComponent } from "@/lib/lazy";

const DepositModal = createLazyComponent(() => import("../tradebox/deposit-modal"), "DepositModal");
const GlobalSettingsDialog = createLazyComponent(() => import("./global-settings-dialog"), "GlobalSettingsDialog");
const SpotSwapModal = createLazyComponent(() => import("./spot-swap-modal"), "SpotSwapModal");
const CommandMenu = createLazyComponent(() => import("./command-menu"), "CommandMenu");
const LinkDeviceModal = createLazyComponent(() => import("./link-device/link-device-modal"), "LinkDeviceModal");
const ScanQrModal = createLazyComponent(() => import("./link-device/scan-qr-modal"), "ScanQrModal");

export function GlobalModals() {
	return (
		<Suspense fallback={null}>
			<DepositModal />
			<GlobalSettingsDialog />
			<SpotSwapModal />
			<CommandMenu />
			<LinkDeviceModal />
			<ScanQrModal />
		</Suspense>
	);
}
