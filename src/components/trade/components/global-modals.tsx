import { DepositModal } from "../order-entry/deposit-modal";
import { GlobalSettingsDialog } from "./global-settings-dialog";

export function GlobalModals() {
	return (
		<>
			<DepositModal />
			<GlobalSettingsDialog />
		</>
	);
}
