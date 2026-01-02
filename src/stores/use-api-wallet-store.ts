import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants/app";
import { createValidatedStorage } from "@/stores/validated-storage";

export type HyperliquidEnv = "mainnet" | "testnet";

const privateKeySchema = z
	.string()
	.regex(/^0x[0-9a-fA-F]{64}$/)
	.transform((v) => v.toLowerCase());

const apiWalletSchema = z.object({
	state: z.object({
		privateKeyByEnv: z.record(z.string(), privateKeySchema).optional(),
		nameByEnv: z.record(z.string(), z.string().min(1)).optional(),
	}),
});

const validatedStorage = createValidatedStorage(apiWalletSchema, "api wallet");

interface ApiWalletStore {
	privateKeyByEnv: Partial<Record<HyperliquidEnv, `0x${string}`>>;
	nameByEnv: Partial<Record<HyperliquidEnv, string>>;
	actions: {
		setPrivateKey: (env: HyperliquidEnv, privateKey: string) => void;
		clearPrivateKey: (env: HyperliquidEnv) => void;
		setName: (env: HyperliquidEnv, name: string) => void;
	};
}

const useApiWalletStore = create<ApiWalletStore>()(
	persist(
		(set, get) => ({
			privateKeyByEnv: {},
			nameByEnv: {},
			actions: {
				setPrivateKey: (env, privateKey) => {
					const parsed = privateKeySchema.parse(privateKey) as `0x${string}`;
					set((state) => ({ privateKeyByEnv: { ...state.privateKeyByEnv, [env]: parsed } }));
				},
				clearPrivateKey: (env) => {
					set((state) => {
						const next = { ...state.privateKeyByEnv };
						delete next[env];
						return { privateKeyByEnv: next };
					});
				},
				setName: (env, name) => {
					const trimmed = name.trim();
					if (!trimmed) return;
					set((state) => ({ nameByEnv: { ...state.nameByEnv, [env]: trimmed } }));
				},
			},
		}),
		{
			name: STORAGE_KEYS.API_WALLET,
			storage: createJSONStorage(() => validatedStorage),
			partialize: (state) => ({ privateKeyByEnv: state.privateKeyByEnv, nameByEnv: state.nameByEnv }),
			merge: (persisted, current) => ({
				...current,
				...(persisted as Partial<ApiWalletStore>),
			}),
		},
	),
);

export function useApiWalletPrivateKeyByEnv() {
	return useApiWalletStore((state) => state.privateKeyByEnv);
}

export function useApiWalletNameByEnv() {
	return useApiWalletStore((state) => state.nameByEnv);
}

export function useApiWalletActions() {
	return useApiWalletStore((state) => state.actions);
}
