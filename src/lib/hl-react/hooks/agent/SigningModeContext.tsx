import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import type { Account } from "viem";
import type { WalletClient } from "viem";
import { useTradingAgent } from "./useTradingAgent";
import type {
	TradingStatus,
	SigningMode,
	AgentStatus,
	AgentRegisterStatus,
	BuilderConfig,
	HyperliquidEnv,
} from "./types";

// ============================================================================
// Context Value Type
// ============================================================================

export interface SigningModeContextValue {
	// -------------------------------------------------------------------------
	// Trading Status (Single Source of Truth)
	// -------------------------------------------------------------------------

	/** Trading readiness status */
	status: TradingStatus;

	/** Whether trading is ready (status === "ready") */
	isReady: boolean;

	// -------------------------------------------------------------------------
	// Signing Mode
	// -------------------------------------------------------------------------

	/** Current signing mode */
	signingMode: SigningMode;

	/** Set signing mode */
	setSigningMode: (mode: SigningMode) => void;

	/** Toggle between modes */
	toggleMode: () => void;

	// -------------------------------------------------------------------------
	// Signer
	// -------------------------------------------------------------------------

	/** Active signer for exchange operations */
	activeSigner: unknown | null;

	/** Direct wallet signer (converted to Hyperliquid format) */
	directSigner: unknown | null;

	// -------------------------------------------------------------------------
	// Agent Controls
	// -------------------------------------------------------------------------

	/** Approve agent (one-time) - call when status === "needs_approval" */
	approve: () => Promise<`0x${string}`>;

	/** Reset/clear agent */
	resetAgent: () => void;

	/** Agent registration status */
	agentRegisterStatus: AgentRegisterStatus;

	/** Agent validation status */
	agentStatus: AgentStatus;

	/** Agent signer (when valid) */
	agentSigner: Account | null;

	/** Agent registration error (if any) */
	agentError: Error | null;

	// -------------------------------------------------------------------------
	// Builder Fee
	// -------------------------------------------------------------------------

	/** Builder fee config (if set) */
	builderConfig: BuilderConfig | undefined;

	// -------------------------------------------------------------------------
	// User Info
	// -------------------------------------------------------------------------

	/** User's wallet address */
	userAddress: `0x${string}` | undefined;

	/** Environment */
	env: HyperliquidEnv;
}

// ============================================================================
// Provider Props
// ============================================================================

export interface SigningModeProviderProps {
	children: ReactNode;
	/** User's wallet address */
	userAddress: `0x${string}` | undefined;
	/** viem WalletClient for direct signing */
	walletClient: WalletClient | undefined;
	/** Environment (mainnet/testnet) */
	env: HyperliquidEnv;
	/** Initial signing mode (default: "agent") */
	defaultMode?: SigningMode;
	/** Convert walletClient to Hyperliquid-compatible wallet */
	toHyperliquidWallet: (walletClient: WalletClient, address: string) => unknown;
	/** Agent name for registration (default: "HypeTerminal") */
	agentName?: string;
	/** Builder fee configuration (optional) */
	builderConfig?: BuilderConfig;
}

// ============================================================================
// Context
// ============================================================================

const SigningModeContext = createContext<SigningModeContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

/**
 * Provider that manages signing mode and trading readiness for the entire app.
 *
 * @example
 * ```tsx
 * <SigningModeProvider
 *   userAddress={address}
 *   walletClient={walletClient}
 *   env="mainnet"
 *   toHyperliquidWallet={toHyperliquidWallet}
 *   builderConfig={{ address: "0x...", feeRate: 10 }}
 * >
 *   <TradingApp />
 * </SigningModeProvider>
 * ```
 */
export function SigningModeProvider({
	children,
	userAddress,
	walletClient,
	env,
	defaultMode = "agent",
	toHyperliquidWallet,
	agentName = "HypeTerminal",
	builderConfig,
}: SigningModeProviderProps) {
	// Signing mode state
	const [signingMode, setSigningMode] = useState<SigningMode>(defaultMode);

	// Trading agent
	const tradingAgent = useTradingAgent({
		user: userAddress,
		env,
		agentName,
	});

	// Direct wallet signer (converted)
	const directSigner = useMemo(() => {
		if (!walletClient || !userAddress) return null;
		try {
			return toHyperliquidWallet(walletClient, userAddress);
		} catch {
			return null;
		}
	}, [walletClient, userAddress, toHyperliquidWallet]);

	// Active signer based on mode
	const activeSigner = useMemo(() => {
		if (signingMode === "direct") {
			return directSigner;
		}
		return tradingAgent.signer;
	}, [signingMode, directSigner, tradingAgent.signer]);

	// Compute single status
	const status: TradingStatus = useMemo(() => {
		if (!userAddress) {
			return "no_wallet";
		}

		if (signingMode === "agent" && tradingAgent.status !== "valid") {
			return "needs_approval";
		}

		if (!activeSigner) {
			return "no_signer";
		}

		return "ready";
	}, [userAddress, signingMode, tradingAgent.status, activeSigner]);

	// Toggle mode
	const toggleMode = useCallback(() => {
		setSigningMode((prev) => (prev === "direct" ? "agent" : "direct"));
	}, []);

	// Context value
	const value: SigningModeContextValue = useMemo(
		() => ({
			// Status
			status,
			isReady: status === "ready",

			// Signing mode
			signingMode,
			setSigningMode,
			toggleMode,

			// Signer
			activeSigner,
			directSigner,

			// Agent controls
			approve: tradingAgent.registerAgent,
			resetAgent: tradingAgent.resetAgent,
			agentRegisterStatus: tradingAgent.registerStatus,
			agentStatus: tradingAgent.status,
			agentSigner: tradingAgent.signer,
			agentError: tradingAgent.error,

			// Builder
			builderConfig,

			// User info
			userAddress,
			env,
		}),
		[
			status,
			signingMode,
			toggleMode,
			activeSigner,
			directSigner,
			tradingAgent,
			builderConfig,
			userAddress,
			env,
		],
	);

	return (
		<SigningModeContext.Provider value={value}>
			{children}
		</SigningModeContext.Provider>
	);
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Access the signing mode context.
 * Must be used within a SigningModeProvider.
 *
 * @example
 * ```tsx
 * const { status, approve, signingMode } = useSigningModeContext();
 *
 * if (status === "needs_approval") {
 *   return <button onClick={approve}>Enable Fast Trading</button>;
 * }
 * ```
 */
export function useSigningModeContext(): SigningModeContextValue {
	const context = useContext(SigningModeContext);
	if (!context) {
		throw new Error("useSigningModeContext must be used within a SigningModeProvider");
	}
	return context;
}

/**
 * Optional hook that returns null if not within provider.
 */
export function useSigningModeContextOptional(): SigningModeContextValue | null {
	return useContext(SigningModeContext);
}
