# Hyperliquid Provider Architecture

## Overview

A minimal, KISS-oriented provider that serves as a thin client factory. The provider's sole responsibility is to create and expose Hyperliquid clients based on the current wallet state.

## Core Principles

1. **Minimal state** - Provider only holds what directly affects client creation
2. **Single responsibility** - Just clients and config, nothing else
3. **Singleton clients** - Info and Subscription clients live in plain TS, usable outside React
4. **Exchange recreates on wallet change** - Only trigger for new exchange client instance
5. **Mode-agnostic** - Provider doesn't know about signing modes; it receives a signer and creates a client

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│   (Components use custom hooks that combine provider + mode) │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Custom Hooks Layer                        │
│  useAgentRegistration, useTradingMode, useSignedExchange    │
│  (Combine provider context + external state for actions)     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│   HyperliquidProvider     │  │   External Global State   │
│   (Thin client factory)   │  │   (Signing mode, agent    │
│                           │  │    wallet, persistence)   │
└───────────────────────────┘  └───────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Client Singletons (TS)                     │
│         InfoClient, SubscriptionClient (plain TS file)       │
│         ExchangeClient (created per wallet)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Provider Specification

### Props

```ts
interface HyperliquidProviderProps {
  children: React.ReactNode;
  env: "mainnet" | "testnet";
  builderConfig?: BuilderConfig;
  agentName?: string;
  // Optional client overrides (fallback to singletons)
  infoClient?: InfoClient;
  subscriptionClient?: SubscriptionClient;
}
```

### Context Value

```ts
interface HyperliquidContextValue {
  // Clients - direct exposure, null when no wallet
  exchange: ExchangeClient | null;
  info: InfoClient;
  subscription: SubscriptionClient;

  // Config - exposed because it affects hook behavior
  env: "mainnet" | "testnet";
  builderConfig: BuilderConfig;
  agentName: string;

  // Derived key for cache invalidation
  clientKey: string; // hash of wallet address
}
```

### Hook

```ts
function useHyperliquid(): HyperliquidContextValue;
```

Single entry point. Returns the context value directly. Throws if used outside provider.

---

## Client Singletons

### Location
```
src/lib/hyperliquid/clients.ts  (plain TS, no React)
```

### API

```ts
// Initialize once (called by provider on mount)
function initializeClients(config: ClientConfig): void;

// Get singleton instances (usable anywhere, including outside React)
function getInfoClient(): InfoClient;
function getSubscriptionClient(): SubscriptionClient;

// Exchange client factory (called by provider on wallet change)
function createExchangeClient(signer: AbstractWallet): ExchangeClient;
```

### Rationale

- Info and Subscription clients are stateless readers - one instance suffices
- Exchange client is bound to a signer - must be recreated per wallet
- Plain TS allows usage in utilities, tests, server contexts

---

## External State (Not Provider's Concern)

These live in global state (zustand/atoms), NOT in the provider:

### Signing Mode
```ts
type SigningMode = "direct" | "agent";

// Global state hook (separate from provider)
function useSigningMode(): {
  mode: SigningMode;
  setMode: (mode: SigningMode) => void;
};
```

### Agent Wallet
```ts
interface AgentWallet {
  privateKey: `0x${string}`;
  publicKey: `0x${string}`;
}

// Global state with persistence (separate from provider)
function useAgentWallet(env: string, userAddress: string): AgentWallet | null;
```

---

## Custom Hooks (Build on Provider)

These hooks combine provider context with external state:

### useSignedExchange
```ts
// Returns the appropriate exchange client based on signing mode
function useSignedExchange(): {
  exchange: ExchangeClient | null;
  signer: "direct" | "agent" | null;
};
```

### useAgentRegistration
```ts
// Handles agent registration flow
function useAgentRegistration(): {
  status: "idle" | "signing" | "verifying" | "error";
  register: () => Promise<`0x${string}`>;
  reset: () => void;
  error: Error | null;
};
```

### useTradingStatus
```ts
// Combines wallet + mode + agent status into single status
function useTradingStatus(): {
  status: "no_wallet" | "needs_approval" | "ready";
  isReady: boolean;
};
```

---

## Exchange Hooks (Existing)

Exchange hooks remain provider-aware (implicit). They:
1. Call `useHyperliquid()` internally
2. Access `exchange` client from context
3. Use `clientKey` for cache invalidation (key-based reset)

```ts
// Example pattern (existing hooks follow this)
function useExchangeOrder(params: OrderParams) {
  const { exchange, clientKey } = useHyperliquid();

  return useQuery({
    queryKey: ["exchange", "order", clientKey, params],
    queryFn: () => exchange?.order(params),
    enabled: !!exchange,
  });
}
```

---

## Provider Implementation Skeleton

```tsx
function HyperliquidProvider({
  children,
  env,
  builderConfig = DEFAULT_BUILDER_CONFIG,
  agentName = PROJECT_NAME,
  infoClient,
  subscriptionClient,
}: HyperliquidProviderProps) {
  // 1. Get wallet from wagmi (internal hook usage)
  const { data: walletClient } = useWalletClient();

  // 2. Initialize singletons on mount
  useEffect(() => {
    initializeClients({ env });
  }, [env]);

  // 3. Create exchange client when wallet changes
  const exchange = useMemo(() => {
    if (!walletClient) return null;
    return createExchangeClient(walletClient);
  }, [walletClient]);

  // 4. Compute client key for cache invalidation
  const clientKey = walletClient?.account?.address ?? "disconnected";

  // 5. Assemble context value
  const value = useMemo(() => ({
    exchange,
    info: infoClient ?? getInfoClient(),
    subscription: subscriptionClient ?? getSubscriptionClient(),
    env,
    builderConfig,
    agentName,
    clientKey,
  }), [exchange, infoClient, subscriptionClient, env, builderConfig, agentName, clientKey]);

  return (
    <HyperliquidContext.Provider value={value}>
      {children}
    </HyperliquidContext.Provider>
  );
}
```

---

## File Structure

```
src/lib/hyperliquid/
├── clients.ts              # Singleton clients (plain TS)
├── context.tsx             # HyperliquidProvider + useHyperliquid
├── types.ts                # Shared types
│
├── hooks/
│   ├── useSignedExchange.ts      # Combines provider + signing mode
│   ├── useAgentRegistration.ts   # Agent registration flow
│   ├── useTradingStatus.ts       # Combined status
│   │
│   └── exchange/                 # Exchange action hooks (existing)
│       ├── useExchangeOrder.ts
│       ├── useExchangeCancel.ts
│       └── ...
│
├── state/
│   ├── signingMode.ts      # Global signing mode state
│   └── agentWallet.ts      # Agent wallet persistence
│
└── index.ts                # Public exports (minimal)
```

---

## Public Exports (Minimal)

```ts
// src/lib/hyperliquid/index.ts

// Provider
export { HyperliquidProvider, useHyperliquid } from "./context";

// Types
export type { HyperliquidProviderProps, HyperliquidContextValue } from "./types";

// Custom hooks (built on provider)
export { useSignedExchange } from "./hooks/useSignedExchange";
export { useAgentRegistration } from "./hooks/useAgentRegistration";
export { useTradingStatus } from "./hooks/useTradingStatus";

// Exchange hooks (existing)
export * from "./hooks/exchange";

// Singleton access (for non-React usage)
export { getInfoClient, getSubscriptionClient } from "./clients";
```

---

## Testing

### MockHyperliquidProvider

```tsx
interface MockHyperliquidProviderProps {
  children: React.ReactNode;
  value?: Partial<HyperliquidContextValue>;
}

function MockHyperliquidProvider({ children, value }: MockHyperliquidProviderProps) {
  const mockValue: HyperliquidContextValue = {
    exchange: null,
    info: createMockInfoClient(),
    subscription: createMockSubscriptionClient(),
    env: "testnet",
    builderConfig: DEFAULT_BUILDER_CONFIG,
    agentName: "test",
    clientKey: "mock",
    ...value,
  };

  return (
    <HyperliquidContext.Provider value={mockValue}>
      {children}
    </HyperliquidContext.Provider>
  );
}
```

---

## Migration Path

1. Extract info/subscription clients to singleton in `clients.ts`
2. Simplify provider to only manage exchange client creation
3. Move signing mode state to external global state
4. Move agent wallet persistence to external global state
5. Create custom hooks that combine provider + external state
6. Update existing exchange hooks to use `clientKey` for invalidation
7. Update consumers to use new hook patterns

---

## Summary

| Concern | Location |
|---------|----------|
| Info/Subscription clients | Singleton (plain TS) |
| Exchange client | Provider (recreates on wallet change) |
| Env, builderConfig, agentName | Provider props → context |
| Signing mode | External global state |
| Agent wallet | External global state + persistence |
| Agent registration flow | Custom hook |
| Trading status | Custom hook |
| Cache invalidation | clientKey from provider |
