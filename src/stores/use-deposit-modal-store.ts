import { create } from "zustand";

type DepositTab = "deposit" | "withdraw";

interface DepositModalState {
	isOpen: boolean;
	activeTab: DepositTab;
	actions: {
		open: (tab?: DepositTab) => void;
		close: () => void;
		setTab: (tab: DepositTab) => void;
	};
}

const useDepositModalStore = create<DepositModalState>((set) => ({
	isOpen: false,
	activeTab: "deposit",
	actions: {
		open: (tab = "deposit") => set({ isOpen: true, activeTab: tab }),
		close: () => set({ isOpen: false }),
		setTab: (tab) => set({ activeTab: tab }),
	},
}));

export const useDepositModalOpen = () => useDepositModalStore((s) => s.isOpen);
export const useDepositModalTab = () => useDepositModalStore((s) => s.activeTab);
export const useDepositModalActions = () => useDepositModalStore((s) => s.actions);
