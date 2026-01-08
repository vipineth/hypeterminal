import type { ExchangeClient, ExtraAgentsResponse, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/interface";
import { getClients, initializeClients, setExchangeClient } from "./client-registry";
import { createHyperliquidConfig } from "./createConfig";
import type {
	AgentRegisterStatus,
	AgentStatus,
	BuilderConfig,
	HyperliquidEnv,
	SigningMode,
	TradingStatus,
} from "./hooks/agent/types";
import type { AgentWallet } from "./hooks/agent/useAgentStore";
import { useAgentWallet, useAgentWalletActions } from "./hooks/agent/useAgentStore";
import { useExchangeApproveAgent } from "./hooks/exchange/useExchangeApproveAgent";
import { useInfoExtraAgents } from "./hooks/info/useInfoExtraAgents";
import { createHyperliquidStore, type HyperliquidStore } from "./store";
import type { HyperliquidConfig, HyperliquidProviderProps } from "./types";

export type HyperliquidClients = {
	info: InfoClient;
	subscription: SubscriptionClient;
	exchange: ExchangeClient | null;
};

export interface HyperliquidContextValue {
	status: TradingStatus;
	isReady: boolean;
	signingMode: SigningMode;
	setSigningMode: (mode: SigningMode) => void;
	activeSigner: unknown | null;
	directSigner: AbstractWallet | null;
	approveAgent: () => Promise<`0x${string}`>;
	resetAgent: () => void;
	agentRegisterStatus: AgentRegisterStatus;
	agentStatus: AgentStatus;
	agentSigner: ReturnType<typeof privateKeyToAccount> | null;
	agentWallet: AgentWallet | null;
	agentError: Error | null;
	agentRefetch: () => Promise<unknown>;
	builderConfig?: BuilderConfig;
	userAddress: `0x${string}` | undefined;
	env: HyperliquidEnv;
}

type AgentLifecycleResult = {
	status: AgentStatus;
	registerStatus: AgentRegisterStatus;
	agentWallet: AgentWallet | null;
	signer: ReturnType<typeof privateKeyToAccount> | null;
	registerAgent: () => Promise<`0x${string}`>;
	resetAgent: () => void;
	refetch: () => Promise<unknown>;
	error: Error | null;
};

export const HyperliquidStoreContext = createContext<HyperliquidStore | null>(null);
export const HyperliquidClientsContext = createContext<HyperliquidClients | null>(null);
const HyperliquidContext = createContext<HyperliquidContextValue | null>(null);

export function isAgentApproved(extraAgents: ExtraAgentsResponse | undefined, publicKey: string | undefined): boolean {
	if (!extraAgents || !publicKey) return false;
	const normalizedKey = publicKey.toLowerCase();
	const now = Date.now();
	return extraAgents.some((agent) => agent.address.toLowerCase() === normalizedKey && agent.validUntil > now);
}

function useAgentLifecycle(
	env: HyperliquidEnv,
	user: `0x${string}` | undefined,
	agentName: string,
): AgentLifecycleResult {
	const agentWallet = useAgentWallet(env, user);
	const { setAgent, clearAgent } = useAgentWalletActions();
	const {
		data: extraAgents,
		isLoading: isLoadingAgents,
		refetch,
	} = useInfoExtraAgents(
		{ user: user ?? "0x0000000000000000000000000000000000000000" },
		{
			enabled: !!user,
			staleTime: 5_000,
			refetchInterval: 30_000,
		},
	);
	const { mutateAsync: approveAgent } = useExchangeApproveAgent();
	const [registerStatus, setRegisterStatus] = useState<AgentRegisterStatus>("idle");
	const [error, setError] = useState<Error | null>(null);

	const status: AgentStatus = useMemo(() => {
		if (!user) return "no_agent";
		if (isLoadingAgents) return "loading";
		if (!agentWallet) return "no_agent";
		return isAgentApproved(extraAgents, agentWallet.publicKey) ? "valid" : "invalid";
	}, [user, isLoadingAgents, agentWallet, extraAgents]);

	const signer = useMemo(() => {
		if (status !== "valid" || !agentWallet?.privateKey) return null;
		try {
			return privateKeyToAccount(agentWallet.privateKey);
		} catch {
			return null;
		}
	}, [status, agentWallet?.privateKey]);

	const registerAgent = useCallback(async (): Promise<`0x${string}`> => {
		if (!user) {
			throw new Error("No user address");
		}
		setError(null);
		try {
			setRegisterStatus("signing");
			clearAgent(env, user);
			const privateKey = generatePrivateKey();
			const account = privateKeyToAccount(privateKey);
			const publicKey = account.address;
			setAgent(env, user, privateKey, publicKey);
			await approveAgent({
				agentAddress: publicKey,
				agentName,
			});
			setRegisterStatus("verifying");
			const { data } = await refetch();
			if (!isAgentApproved(data, publicKey)) {
				throw new Error("Agent verification failed - not found in extraAgents");
			}
			setRegisterStatus("idle");
			return publicKey;
		} catch (err) {
			setRegisterStatus("error");
			const nextError = err instanceof Error ? err : new Error(String(err));
			setError(nextError);
			throw nextError;
		}
	}, [user, env, agentName, clearAgent, setAgent, approveAgent, refetch]);

	const resetAgent = useCallback(() => {
		if (user) {
			clearAgent(env, user);
		}
		setRegisterStatus("idle");
		setError(null);
	}, [user, env, clearAgent]);

	return {
		status,
		registerStatus,
		agentWallet,
		signer,
		registerAgent,
		resetAgent,
		refetch,
		error,
	};
}

export function HyperliquidTradingProvider({
	children,
	env,
	userAddress,
	wallet,
	signingMode: signingModeProp = "agent",
	agentName = PROJECT_NAME,
	builderConfig,
}: HyperliquidProviderProps) {
	const agentLifecycle = useAgentLifecycle(env, userAddress, agentName);
	const [signingMode, setSigningMode] = useState<SigningMode>(signingModeProp);

	const directSigner = useMemo(() => {
		if (!wallet || !userAddress) return null;
		return wallet;
	}, [wallet, userAddress]);

	const activeSigner = useMemo(() => {
		if (signingMode === "direct") return directSigner;
		return agentLifecycle.signer;
	}, [signingMode, directSigner, agentLifecycle.signer]);

	useEffect(() => {
		if (signingMode === "agent" && agentLifecycle.signer) {
			setExchangeClient(agentLifecycle.signer as AbstractWallet);
		} else if (signingMode === "direct" && directSigner) {
			setExchangeClient(directSigner);
		} else {
			setExchangeClient(null);
		}
	}, [signingMode, directSigner, agentLifecycle.signer]);

	const status: TradingStatus = useMemo(() => {
		if (!userAddress) return "no_wallet";
		if (signingMode === "agent" && agentLifecycle.status !== "valid") return "needs_approval";
		if (!activeSigner) return "no_signer";
		return "ready";
	}, [userAddress, signingMode, agentLifecycle.status, activeSigner]);

	const value: HyperliquidContextValue = useMemo(
		() => ({
			status,
			isReady: status === "ready",
			signingMode,
			setSigningMode,
			activeSigner,
			directSigner,
			approveAgent: agentLifecycle.registerAgent,
			resetAgent: agentLifecycle.resetAgent,
			agentRegisterStatus: agentLifecycle.registerStatus,
			agentStatus: agentLifecycle.status,
			agentSigner: agentLifecycle.signer,
			agentWallet: agentLifecycle.agentWallet,
			agentError: agentLifecycle.error,
			agentRefetch: agentLifecycle.refetch,
			builderConfig: builderConfig ?? DEFAULT_BUILDER_CONFIG,
			userAddress,
			env,
		}),
		[
			status,
			signingMode,
			activeSigner,
			directSigner,
			agentLifecycle.registerAgent,
			agentLifecycle.resetAgent,
			agentLifecycle.registerStatus,
			agentLifecycle.status,
			agentLifecycle.signer,
			agentLifecycle.agentWallet,
			agentLifecycle.error,
			agentLifecycle.refetch,
			builderConfig,
			userAddress,
			env,
		],
	);

	return <HyperliquidContext.Provider value={value}>{children}</HyperliquidContext.Provider>;
}

export function HyperliquidProvider({
	children,
	env,
	userAddress,
	wallet,
	httpTransport,
	wsTransport,
	signingMode,
	agentName,
	builderConfig,
}: HyperliquidProviderProps) {
	const config: HyperliquidConfig = useMemo(
		() =>
			createHyperliquidConfig({
				httpTransport,
				wsTransport,
				ssr: false,
			}),
		[httpTransport, wsTransport],
	);

	const storeRef = useRef<HyperliquidStore | null>(null);

	if (!storeRef.current) {
		storeRef.current = createHyperliquidStore(config);
	}

	initializeClients({
		httpTransport: config.httpTransport,
		wsTransport: config.wsTransport,
	});

	const clients = useMemo<HyperliquidClients>(() => {
		const { info, subscription, exchange } = getClients();
		return { info, subscription, exchange };
	}, []);

	return (
		<HyperliquidStoreContext.Provider value={storeRef.current}>
			<HyperliquidClientsContext.Provider value={clients}>
				<HyperliquidTradingProvider
					env={env}
					userAddress={userAddress}
					wallet={wallet}
					signingMode={signingMode}
					agentName={agentName}
					builderConfig={builderConfig}
				>
					{children}
				</HyperliquidTradingProvider>
			</HyperliquidClientsContext.Provider>
		</HyperliquidStoreContext.Provider>
	);
}

export function useHyperliquidContext(): HyperliquidContextValue {
	const context = useContext(HyperliquidContext);
	if (!context) {
		throw new Error("useHyperliquidContext must be used within a HyperliquidProvider");
	}
	return context;
}

export function useHyperliquidContextOptional(): HyperliquidContextValue | null {
	return useContext(HyperliquidContext);
}

export type { HyperliquidProviderProps } from "./types";

export type UseTradingAgentParams = {
	user?: `0x${string}` | undefined;
	env?: HyperliquidEnv;
	agentName?: string;
};

export type UseTradingAgentResult = {
	status: AgentStatus;
	registerStatus: AgentRegisterStatus;
	agentWallet: AgentWallet | null;
	signer: ReturnType<typeof privateKeyToAccount> | null;
	registerAgent: () => Promise<`0x${string}`>;
	resetAgent: () => void;
	refetch: () => Promise<unknown>;
	isReady: boolean;
	error: Error | null;
};

export function useTradingAgent(_: UseTradingAgentParams = {}): UseTradingAgentResult {
	const ctx = useHyperliquidContext();
	return {
		status: ctx.agentStatus,
		registerStatus: ctx.agentRegisterStatus,
		agentWallet: ctx.agentWallet,
		signer: ctx.agentSigner,
		registerAgent: ctx.approveAgent,
		resetAgent: ctx.resetAgent,
		refetch: ctx.agentRefetch,
		isReady: ctx.agentStatus === "valid" && !!ctx.agentSigner,
		error: ctx.agentError,
	};
}
