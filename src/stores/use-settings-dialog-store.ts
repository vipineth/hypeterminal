import { create } from "zustand";

interface SettingsDialogState {
	isOpen: boolean;
	actions: {
		open: () => void;
		close: () => void;
	};
}

const useSettingsDialogStore = create<SettingsDialogState>((set) => ({
	isOpen: false,
	actions: {
		open: () => set({ isOpen: true }),
		close: () => set({ isOpen: false }),
	},
}));

export const useSettingsDialogOpen = () => useSettingsDialogStore((s) => s.isOpen);
export const useSettingsDialogActions = () => useSettingsDialogStore((s) => s.actions);
