import { create } from "zustand";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";

type DepositTab = "deposit" | "withdraw";

type GlobalModal =
	| { type: "deposit"; tab: DepositTab }
	| { type: "settings" }
	| { type: "swap"; fromToken: string; toToken?: string }
	| { type: "commandMenu" }
	| { type: "linkDevice" }
	| { type: "scanQr" }
	| null;

interface DepositActions {
	open: (tab?: DepositTab) => void;
	setTab: (tab: DepositTab) => void;
	close: () => void;
}

interface SettingsActions {
	open: () => void;
	close: () => void;
}

interface SwapActions {
	open: (fromToken?: string, toToken?: string) => void;
	close: () => void;
}

interface CommandMenuActions {
	open: () => void;
	close: () => void;
}

interface LinkDeviceActions {
	open: () => void;
	close: () => void;
}

interface ScanQrActions {
	open: () => void;
	close: () => void;
}

interface GlobalModalState {
	modal: GlobalModal;
	depositActions: DepositActions;
	settingsActions: SettingsActions;
	swapActions: SwapActions;
	commandMenuActions: CommandMenuActions;
	linkDeviceActions: LinkDeviceActions;
	scanQrActions: ScanQrActions;
}

const useGlobalModalStore = create<GlobalModalState>((set) => {
	const close = () => set({ modal: null });

	return {
		modal: null,
		depositActions: {
			open: (tab = "deposit") => set({ modal: { type: "deposit", tab } }),
			setTab: (tab) => set((state) => (state.modal?.type === "deposit" ? { modal: { type: "deposit", tab } } : state)),
			close,
		},
		settingsActions: {
			open: () => set({ modal: { type: "settings" } }),
			close,
		},
		swapActions: {
			open: (fromToken = DEFAULT_QUOTE_TOKEN, toToken) => set({ modal: { type: "swap", fromToken, toToken } }),
			close,
		},
		commandMenuActions: {
			open: () => set({ modal: { type: "commandMenu" } }),
			close,
		},
		linkDeviceActions: {
			open: () => set({ modal: { type: "linkDevice" } }),
			close,
		},
		scanQrActions: {
			open: () => set({ modal: { type: "scanQr" } }),
			close,
		},
	};
});

export const useDepositModalOpen = () => useGlobalModalStore((s) => s.modal?.type === "deposit");
export const useDepositModalTab = () =>
	useGlobalModalStore((s) => (s.modal?.type === "deposit" ? s.modal.tab : "deposit"));
export const useDepositModalActions = () => useGlobalModalStore((s) => s.depositActions);

export const useSettingsDialogOpen = () => useGlobalModalStore((s) => s.modal?.type === "settings");
export const useSettingsDialogActions = () => useGlobalModalStore((s) => s.settingsActions);

export const useSwapModalOpen = () => useGlobalModalStore((s) => s.modal?.type === "swap");
export const useSwapModalFromToken = () =>
	useGlobalModalStore((s) => (s.modal?.type === "swap" ? s.modal.fromToken : undefined));
export const useSwapModalToToken = () =>
	useGlobalModalStore((s) => (s.modal?.type === "swap" ? s.modal.toToken : undefined));
export const useSwapModalActions = () => useGlobalModalStore((s) => s.swapActions);

export const useCommandMenuOpen = () => useGlobalModalStore((s) => s.modal?.type === "commandMenu");
export const useCommandMenuActions = () => useGlobalModalStore((s) => s.commandMenuActions);

export const useLinkDeviceModalOpen = () => useGlobalModalStore((s) => s.modal?.type === "linkDevice");
export const useLinkDeviceModalActions = () => useGlobalModalStore((s) => s.linkDeviceActions);

export const useScanQrModalOpen = () => useGlobalModalStore((s) => s.modal?.type === "scanQr");
export const useScanQrModalActions = () => useGlobalModalStore((s) => s.scanQrActions);
