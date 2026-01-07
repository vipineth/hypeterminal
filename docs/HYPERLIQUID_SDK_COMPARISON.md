# Hyperliquid SDK Implementation Comparison

## Overview

This document compares two approaches for integrating `@nktkas/hyperliquid` in the Hyperminal codebase:

| Aspect | Old Implementation (`src/lib/hyperliquid/`) | New React SDK (`src/lib/hl-react/`) |
|--------|---------------------------------------------|-------------------------------------|
| Pattern | Singleton + Direct Function Calls | Provider + Hooks + Store |
| React Integration | Manual | Native |
| State Management | Component-level | Centralized (Zustand) |
| Caching | Manual | React Query |
| WebSocket Management | Manual lifecycle | Reference-counted |
| Type Safety | Good | Excellent |
| Bundle Size | Smaller | Larger |
| Learning Curve | Lower | Higher |

---

## Architecture Comparison

### Old Implementation (`src/lib/hyperliquid/`)

```
Component
    ↓ (direct import)
Singleton Clients (getInfoClient, getSubscriptionClient)
    ↓
@nktkas/hyperliquid
```

**Files:**
- `clients.ts` - Singleton pattern for client instances
- `exchange.ts` - Direct exchange function wrappers
- `wallet.ts` - viem wallet integration

**Example Usage:**
```typescript
// Direct singleton access
import { getInfoClient, getHttpTransport } from "@/lib/hyperliquid/clients";
import { placeSingleOrder } from "@/lib/hyperliquid/exchange";

// In component
const info = getInfoClient();
const data = await info.meta();

// For transactions
const result = await placeSingleOrder(
  makeExchangeConfig(getHttpTransport(), signer),
  { order: params }
);
```

### New React SDK (`src/lib/hl-react/`)

```
<HyperliquidProvider config={config}>
    ↓
Components using hooks
    ↓ (useInfo*, useSub*, useExchange*)
Zustand Store + React Query
    ↓
Client Instances (memoized)
    ↓
@nktkas/hyperliquid
```

**Files:**
```
hl-react/
├── index.ts              # Exports
├── types.ts              # Type definitions
├── errors.ts             # Custom errors
├── context.tsx           # React Provider
├── store.ts              # Zustand store
├── createConfig.ts       # Config factory
├── query/keys.ts         # Query key generation
└── hooks/
    ├── useConfig.ts      # Config accessor
    ├── useClients.ts     # Client initialization
    ├── useWallet.ts      # Wallet context
    ├── useTransport.ts   # Transport hooks
    ├── useHttpStatus.ts  # HTTP health
    ├── useWsStatus.ts    # WS health
    ├── utils/            # Utilities
    ├── info/             # 67 query hooks
    ├── exchange/         # 45 mutation hooks
    └── subscription/     # 30 subscription hooks
```

**Example Usage:**
```typescript
// Provider setup (once)
const config = createHyperliquidConfig({
  httpTransportOptions: { isTestnet: false },
  wsTransportOptions: { isTestnet: false },
  wallet: viemWallet,
});

<HyperliquidProvider config={config}>
  <App />
</HyperliquidProvider>

// In component
const { data, isLoading, error, refetch } = useInfoMeta();
const { data: orders } = useInfoOpenOrders({ user: address });
const { mutate: placeOrder, isPending } = useExchangeOrder();

// Real-time subscription
const { data: trades, status } = useSubTrades({ coin: "BTC" });
```

---

## Detailed Feature Comparison

### 1. Client Initialization

| Feature | Old | New |
|---------|-----|-----|
| Client creation | Singleton, lazy | Provider-scoped, memoized |
| Multiple configs | Difficult | Easy (nested providers) |
| SSR support | Manual | Built-in |
| Testnet toggle | Environment variable | Config option |

**Old:**
```typescript
// Singleton - same instance globally
const info = getInfoClient();
```

**New:**
```typescript
// Provider-scoped - each provider has own instances
const { info, exchange, subscription } = useHyperliquidClients();
```

### 2. Data Fetching (HTTP)

| Feature | Old | New |
|---------|-----|-----|
| Caching | None | React Query |
| Deduplication | None | Automatic |
| Background refetch | Manual | Configurable |
| Error handling | try/catch | Built-in states |
| Loading states | Manual | Built-in |
| Abort signals | Manual | Automatic |

**Old:**
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  getInfoClient().meta()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

**New:**
```typescript
const { data, isLoading, error, refetch } = useInfoMeta({
  staleTime: 30_000,
  refetchInterval: 60_000,
});
```

### 3. WebSocket Subscriptions

| Feature | Old | New |
|---------|-----|-----|
| Lifecycle | Manual subscribe/unsubscribe | Automatic |
| Reference counting | None | Built-in |
| Error recovery | Manual | Automatic |
| Status tracking | Manual | Centralized |
| Multiple consumers | Duplicate connections | Shared subscription |

**Old:**
```typescript
const [trades, setTrades] = useState([]);
const subscriptionRef = useRef(null);

useEffect(() => {
  const client = getSubscriptionClient();
  const subscribe = async () => {
    subscriptionRef.current = await client.trades(
      { coin: "BTC" },
      (data) => setTrades(data)
    );
  };
  subscribe();
  return () => subscriptionRef.current?.unsubscribe();
}, []);
```

**New:**
```typescript
const { data: trades, status, error } = useSubTrades(
  { coin: "BTC" },
  { onData: (data) => console.log("New trade:", data) }
);
```

### 4. Exchange Operations (Mutations)

| Feature | Old | New |
|---------|-----|-----|
| Wallet validation | Manual | Built-in (MissingWalletError) |
| Loading states | Manual | Built-in (isPending) |
| Error handling | try/catch | Built-in + callbacks |
| Retry logic | Manual | Configurable |
| Optimistic updates | Manual | Supported |

**Old:**
```typescript
const [isPending, setIsPending] = useState(false);

const handleOrder = async () => {
  if (!signer) return alert("No wallet");
  setIsPending(true);
  try {
    const result = await placeSingleOrder(
      makeExchangeConfig(getHttpTransport(), signer),
      { order: params }
    );
    toast.success("Order placed!");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsPending(false);
  }
};
```

**New:**
```typescript
const { mutate: placeOrder, isPending, error } = useExchangeOrder({
  onSuccess: () => toast.success("Order placed!"),
  onError: (error) => toast.error(error.message),
});

const handleOrder = () => placeOrder({ orders: [params], grouping: "na" });
```

### 5. Type Safety

| Feature | Old | New |
|---------|-----|-----|
| Response types | Manual | Inferred |
| Parameter types | Manual | Inferred |
| Subscription events | Manual | Inferred |
| Query keys | N/A | Type-safe |
| Error types | Generic | Discriminated |

**New type inference:**
```typescript
type InferData<TMethod> = Awaited<ReturnType<TMethod>>;
type InferParams<TMethod> = Exclude<Parameters<TMethod>[0], AbortSignal>;
type InferSubEvent<TMethod> = /* listener data type */;
```

### 6. Error Handling

| Feature | Old | New |
|---------|-----|-----|
| Provider missing | N/A | ProviderNotFoundError |
| Transport missing | Runtime crash | MissingTransportError |
| Wallet missing | Manual check | MissingWalletError |
| Validation errors | Generic | ValiError integration |

---

## Recommendation: **Use `hl-react` (New Implementation)**

### Reasons:

1. **Production-Grade Architecture**
   - Reference-counted subscriptions prevent memory leaks
   - Centralized state prevents race conditions
   - React Query provides battle-tested caching

2. **Developer Experience**
   - 142 type-safe hooks ready to use
   - Built-in loading/error states
   - Consistent API across all operations

3. **Performance**
   - Automatic request deduplication
   - Shared WebSocket connections
   - Memoized client instances

4. **Maintainability**
   - Clear separation of concerns
   - Standardized patterns
   - Easier testing (mockable providers)

5. **Scalability**
   - Easy to add new features
   - Support for multiple configurations
   - SSR-ready

### When Old Pattern Might Be Better:

- Non-React code (workers, CLI tools)
- Simple scripts with one-off requests
- Bundle size is critical (<5KB difference)

---

## Migration Guide: Old → New

### Step 1: Setup Provider

```typescript
// src/providers/hyperliquid-provider.tsx
import { createHyperliquidConfig, HyperliquidProvider } from "@/lib/hl-react";

export function HyperliquidSetup({ children }) {
  const wallet = useWalletFromPripy(); // Your wallet integration

  const config = useMemo(() => createHyperliquidConfig({
    httpTransportOptions: {
      isTestnet: import.meta.env.VITE_HYPERLIQUID_TESTNET === "true"
    },
    wsTransportOptions: {
      isTestnet: import.meta.env.VITE_HYPERLIQUID_TESTNET === "true"
    },
    wallet: wallet ? toHyperliquidWallet(wallet) : undefined,
  }), [wallet]);

  return (
    <HyperliquidProvider config={config}>
      {children}
    </HyperliquidProvider>
  );
}
```

### Step 2: Wrap App

```typescript
// src/app.tsx
import { HyperliquidSetup } from "./providers/hyperliquid-provider";

function App() {
  return (
    <HyperliquidSetup>
      <YourApp />
    </HyperliquidSetup>
  );
}
```

### Step 3: Replace Data Fetching

**Before:**
```typescript
const [meta, setMeta] = useState(null);
useEffect(() => {
  getInfoClient().meta().then(setMeta);
}, []);
```

**After:**
```typescript
const { data: meta } = useInfoMeta();
```

### Step 4: Replace Subscriptions

**Before:**
```typescript
const [trades, setTrades] = useState([]);
useEffect(() => {
  let sub;
  getSubscriptionClient().trades({ coin }, (data) => setTrades(data))
    .then(s => sub = s);
  return () => sub?.unsubscribe();
}, [coin]);
```

**After:**
```typescript
const { data: trades } = useSubTrades({ coin });
```

### Step 5: Replace Mutations

**Before:**
```typescript
const handleOrder = async () => {
  await placeSingleOrder(config, params);
};
```

**After:**
```typescript
const { mutate: placeOrder } = useExchangeOrder();
const handleOrder = () => placeOrder(params);
```

---

## Hook Reference Quick Guide

### Info Hooks (Query - HTTP)

| Hook | Purpose | Parameters |
|------|---------|------------|
| `useInfoMeta()` | Market metadata | none |
| `useInfoAllMids()` | All mid prices | none |
| `useInfoL2Book({ coin })` | Order book | coin |
| `useInfoOpenOrders({ user })` | User's open orders | user address |
| `useInfoClearinghouseState({ user })` | Account state | user address |
| `useInfoUserFills({ user })` | Trade history | user address |
| `useInfoPortfolio({ user })` | Portfolio summary | user address |

### Subscription Hooks (WebSocket)

| Hook | Purpose | Parameters |
|------|---------|------------|
| `useSubAllMids()` | Real-time prices | none |
| `useSubL2Book({ coin })` | Real-time order book | coin |
| `useSubTrades({ coin })` | Real-time trades | coin |
| `useSubOpenOrders({ user })` | Order updates | user address |
| `useSubUserFills({ user })` | Fill notifications | user address |
| `useSubAssetCtxs()` | Asset context updates | none |

### Exchange Hooks (Mutation)

| Hook | Purpose | Parameters |
|------|---------|------------|
| `useExchangeOrder()` | Place order | orders[], grouping |
| `useExchangeCancel()` | Cancel orders | cancels[] |
| `useExchangeModify()` | Modify order | oid, order |
| `useExchangeUpdateLeverage()` | Set leverage | asset, leverage |
| `useExchangeWithdraw3()` | Withdraw funds | amount, destination |
| `useExchangeApproveAgent()` | Approve trading agent | agentAddress |

---

## Files to Deprecate After Migration

Once migration is complete, these files can be removed:

```
src/lib/hyperliquid/
├── clients.ts          # ← Remove (replaced by useHyperliquidClients)
├── exchange.ts         # ← Remove (replaced by useExchange* hooks)
└── wallet.ts           # ← Keep (wallet conversion still needed)

src/hooks/hyperliquid/
├── socket/             # ← Remove (replaced by useSub* hooks)
└── *.ts                # ← Evaluate each, likely replaceable
```

---

## Agentic Pattern (Fast Trading)

The agentic pattern is a **critical feature** for production trading applications. It allows instant order signing without wallet popups by using a locally-stored private key that's pre-approved on Hyperliquid.

### Why Use Agents?

| Aspect | Direct Signing | Agent Signing |
|--------|---------------|---------------|
| Speed | Slow (wallet popup) | Instant |
| UX | Requires click each time | Fire and forget |
| Security | Main wallet signs | Separate key, limited scope |
| Automation | Difficult | Easy |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. First Time Setup (one wallet signature)                      │
│     ┌──────────┐     ┌───────────┐     ┌──────────────────┐     │
│     │ Generate │ ──► │ Store in  │ ──► │ Approve on       │     │
│     │ Keypair  │     │ localStorage│    │ Hyperliquid     │     │
│     └──────────┘     └───────────┘     └──────────────────┘     │
│                                                                  │
│  2. Trading (no wallet interaction)                              │
│     ┌──────────┐     ┌───────────┐     ┌──────────────────┐     │
│     │ Order    │ ──► │ Sign with │ ──► │ Submit to        │     │
│     │ Request  │     │ Agent Key │     │ Hyperliquid     │     │
│     └──────────┘     └───────────┘     └──────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Hooks (New in hl-react)

The `hl-react` SDK now includes dedicated agent hooks:

```
hl-react/hooks/agent/
├── useAgentStore.ts        # localStorage management
├── useTradingAgent.ts      # Agent lifecycle management
├── useSigningMode.ts       # Local hook for mode switching
├── SigningModeContext.tsx  # Provider-based global state (recommended)
└── index.ts                # Exports
```

### Two Approaches: Local vs Provider

| Approach | Use Case | Pros | Cons |
|----------|----------|------|------|
| `useSigningMode` (local) | Single component | Simple, self-contained | State not shared |
| `SigningModeProvider` (global) | Full app | Single source of truth, shared state | Requires provider setup |

**Recommendation**: Use `SigningModeProvider` for production apps where multiple components need trading capabilities.

### Hook Reference

#### `useTradingAgent`

Manages the full agent lifecycle: creation, approval, and validation.

```typescript
import { useTradingAgent } from "@/lib/hl-react";

const {
  status,           // "loading" | "no_agent" | "valid" | "invalid"
  registerStatus,   // "idle" | "signing" | "verifying" | "error"
  signer,           // viem Account for signing (when valid)
  isReady,          // boolean - ready to trade?
  registerAgent,    // () => Promise<address> - create & approve agent
  resetAgent,       // () => void - clear stored agent
  error,            // Error | null
} = useTradingAgent({
  user: address,
  env: "mainnet",   // or "testnet"
  agentName: "HypeTerminal",
});
```

#### `useSigningMode`

Abstracts switching between direct wallet and agent signing.

```typescript
import { useSigningMode } from "@/lib/hl-react";

const {
  signingMode,        // "direct" | "agent"
  setSigningMode,     // (mode) => void
  activeSigner,       // Current signer (agent or wallet)
  isReadyToTrade,     // boolean
  needsAgentApproval, // boolean - show approval UI?
  agent,              // Agent-specific state
} = useSigningMode({
  user: address,
  walletClient,
  env: "mainnet",
  toHyperliquidWallet: myConverter,
});
```

#### `SigningModeProvider` (Recommended)

Provider-based global state for the entire app. All components share the same signing mode and agent status.

```typescript
import {
  SigningModeProvider,
  useSigningModeContext,
} from "@/lib/hl-react";

// 1. Wrap your app
function App() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  return (
    <SigningModeProvider
      userAddress={address}
      walletClient={walletClient}
      env="mainnet"
      toHyperliquidWallet={toHyperliquidWallet}
      defaultMode="agent"
      agentName="HypeTerminal"
    >
      <TradingApp />
      <AgentApprovalModal />  {/* Can show globally when needed */}
    </SigningModeProvider>
  );
}

// 2. Use in any component
function OrderButton() {
  const {
    isReadyToTrade,
    needsAgentApproval,
    signingMode,
    agent,
  } = useSigningModeContext();

  if (needsAgentApproval) {
    return (
      <button onClick={agent.register}>
        {agent.registerStatus === "signing" ? "Approve in wallet..." : "Enable Fast Trading"}
      </button>
    );
  }

  return (
    <button disabled={!isReadyToTrade}>
      Place Order ({signingMode})
    </button>
  );
}

// 3. Global agent approval modal
function AgentApprovalModal() {
  const { needsAgentApproval, agent, signingMode } = useSigningModeContext();

  // Only show if agent mode selected but not approved
  if (!needsAgentApproval || signingMode !== "agent") return null;

  return (
    <Modal open>
      <h2>Enable Fast Trading</h2>
      <p>Approve a trading agent for instant order execution.</p>
      <button onClick={agent.register} disabled={agent.registerStatus !== "idle"}>
        {agent.registerStatus === "idle" && "Enable"}
        {agent.registerStatus === "signing" && "Confirm in wallet..."}
        {agent.registerStatus === "verifying" && "Verifying..."}
        {agent.registerStatus === "error" && "Retry"}
      </button>
    </Modal>
  );
}
```

#### `useAgentWallet` / `useAgentWalletActions`

Low-level localStorage management (used internally by above hooks).

```typescript
import { useAgentWallet, useAgentWalletActions } from "@/lib/hl-react";

// Read agent wallet
const agentWallet = useAgentWallet("mainnet", userAddress);
// { privateKey: "0x...", publicKey: "0x..." } | null

// Actions
const { setAgent, clearAgent } = useAgentWalletActions();
```

### Complete Implementation Example (Provider-Based)

#### 1. Full Provider Stack Setup

```typescript
// src/providers/hyperliquid-provider.tsx
import { useMemo, type ReactNode } from "react";
import {
  createHyperliquidConfig,
  HyperliquidProvider,
  SigningModeProvider,
} from "@/lib/hl-react";
import { useAccount, useWalletClient } from "wagmi";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";

const IS_TESTNET = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true";
const ENV = IS_TESTNET ? "testnet" : "mainnet";

export function HyperliquidSetup({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Hyperliquid config (HTTP + WebSocket)
  const config = useMemo(() => createHyperliquidConfig({
    httpTransportOptions: { isTestnet: IS_TESTNET },
    wsTransportOptions: { isTestnet: IS_TESTNET },
  }), []);

  return (
    <HyperliquidProvider config={config}>
      <SigningModeProvider
        userAddress={address}
        walletClient={walletClient}
        env={ENV}
        toHyperliquidWallet={toHyperliquidWallet}
        defaultMode="agent"
        agentName="HypeTerminal"
      >
        {children}
      </SigningModeProvider>
    </HyperliquidProvider>
  );
}
```

#### 2. Trading Component (Using Context)

```typescript
// src/components/trade/order-panel.tsx
import {
  useSigningModeContext,
  useExchangeOrder,
  useInfoClearinghouseState,
} from "@/lib/hl-react";

export function OrderPanel() {
  // Get signing state from context (shared across app)
  const {
    signingMode,
    setSigningMode,
    isReadyToTrade,
    needsAgentApproval,
    agent,
    userAddress,
  } = useSigningModeContext();

  // Account state
  const { data: account } = useInfoClearinghouseState(
    { user: userAddress! },
    { enabled: !!userAddress }
  );

  // Order mutation
  const { mutate: placeOrder, isPending } = useExchangeOrder({
    onSuccess: () => toast.success("Order placed!"),
    onError: (err) => toast.error(err.message),
  });

  // Submit order
  const handleSubmit = () => {
    if (!isReadyToTrade) return;

    placeOrder({
      orders: [{
        a: 0, // asset index
        isBuy: true,
        limitPx: "50000",
        sz: "0.01",
        orderType: { limit: { tif: "Gtc" } },
        reduceOnly: false,
      }],
      grouping: "na",
    });
  };

  return (
    <div>
      {/* Mode Selector */}
      <select
        value={signingMode}
        onChange={(e) => setSigningMode(e.target.value as "direct" | "agent")}
      >
        <option value="agent">Fast Mode (Agent)</option>
        <option value="direct">Direct Wallet</option>
      </select>

      {/* Agent Approval (inline or can be handled by global modal) */}
      {needsAgentApproval && (
        <button
          onClick={agent.register}
          disabled={agent.registerStatus !== "idle"}
        >
          {agent.registerStatus === "signing" && "Approve in wallet..."}
          {agent.registerStatus === "verifying" && "Verifying..."}
          {agent.registerStatus === "idle" && "Enable Fast Trading"}
          {agent.registerStatus === "error" && "Retry"}
        </button>
      )}

      {/* Order Button */}
      <button
        onClick={handleSubmit}
        disabled={!isReadyToTrade || isPending}
      >
        {isPending ? "Placing..." : "Place Order"}
      </button>

      {/* Status */}
      <div>
        Mode: {signingMode}
        {signingMode === "agent" && ` (${agent.status})`}
      </div>
    </div>
  );
}
```

#### 3. Positions Tab (Using Same Context)

```typescript
// src/components/trade/positions-tab.tsx
import {
  useSigningModeContext,
  useExchangeCancel,
  useInfoOpenOrders,
} from "@/lib/hl-react";

export function PositionsTab() {
  // Same context - shared with OrderPanel
  const { isReadyToTrade, userAddress } = useSigningModeContext();

  const { data: orders } = useInfoOpenOrders(
    { user: userAddress! },
    { enabled: !!userAddress }
  );

  const { mutate: cancelOrders, isPending } = useExchangeCancel({
    onSuccess: () => toast.success("Orders cancelled"),
  });

  const handleCancelAll = () => {
    if (!orders?.length || !isReadyToTrade) return;

    cancelOrders({
      cancels: orders.map(o => ({ a: o.coin, o: o.oid })),
    });
  };

  return (
    <div>
      {orders?.map(order => (
        <OrderRow key={order.oid} order={order} />
      ))}
      <button onClick={handleCancelAll} disabled={isPending || !isReadyToTrade}>
        Cancel All
      </button>
    </div>
  );
}
```

#### 4. Global Agent Approval Modal

```typescript
// src/components/agent-approval-modal.tsx
import { useSigningModeContext } from "@/lib/hl-react";
import { Dialog } from "@/components/ui/dialog";

export function AgentApprovalModal() {
  const {
    needsAgentApproval,
    signingMode,
    agent,
    setSigningMode,
  } = useSigningModeContext();

  // Only show when agent mode selected but not approved
  const isOpen = needsAgentApproval && signingMode === "agent";

  const handleRegister = async () => {
    try {
      await agent.register();
      toast.success("Fast trading enabled!");
    } catch (err) {
      toast.error("Failed to enable fast trading");
    }
  };

  const handleUseDirect = () => {
    setSigningMode("direct");
  };

  return (
    <Dialog open={isOpen}>
      <Dialog.Content>
        <Dialog.Title>Enable Fast Trading</Dialog.Title>
        <Dialog.Description>
          Approve a trading agent for instant order execution without wallet popups.
          This requires one wallet signature.
        </Dialog.Description>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleRegister}
            disabled={agent.registerStatus !== "idle"}
            className="btn-primary"
          >
            {agent.registerStatus === "idle" && "Enable Fast Trading"}
            {agent.registerStatus === "signing" && "Confirm in wallet..."}
            {agent.registerStatus === "verifying" && "Verifying..."}
            {agent.registerStatus === "error" && "Retry"}
          </button>

          <button onClick={handleUseDirect} className="btn-secondary">
            Use Direct Signing Instead
          </button>
        </div>

        {agent.error && (
          <p className="text-red-500 mt-2">{agent.error.message}</p>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
```

### Agent Storage Schema

Agents are stored in localStorage with this structure:

```
Key: hyperliquid_agent_{env}_{userAddress}
     e.g., hyperliquid_agent_mainnet_0x1234...

Value: {
  "privateKey": "0x[64-char-hex]",  // The signing key
  "publicKey": "0x[40-char-hex]"    // Approved agent address
}
```

### Security Considerations

1. **Private Key Storage**: Agent private keys are stored in localStorage. This is acceptable because:
   - Agents have limited permissions (trading only, no withdrawals)
   - Agents can be revoked anytime
   - Users can reset agents if compromised

2. **Expiration**: Agents have a `validUntil` timestamp. The SDK automatically checks expiration.

3. **Per-User Isolation**: Each user address has its own agent. Switching accounts automatically switches agents.

4. **Cross-Tab Sync**: Storage events ensure agents sync across browser tabs.

### Agent Status Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  no_agent   │ ──► │   signing   │ ──► │  verifying  │
│  (initial)  │     │  (wallet)   │     │  (refetch)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │    error    │     │    valid    │
                    │  (failed)   │     │  (ready!)   │
                    └─────────────┘     └─────────────┘
```

### Migration from Old Agent Implementation

If you're using the old `use-trading-agent.ts` from `src/hooks/hyperliquid/`:

**Before:**
```typescript
import { useTradingAgent } from "@/hooks/hyperliquid/use-trading-agent";
import { getHttpTransport, makeExchangeConfig } from "@/lib/hyperliquid";

const { status, signer, registerAgent } = useTradingAgent({ user, walletClient });

// Manual config creation
const config = makeExchangeConfig(getHttpTransport(), signer);
await placeSingleOrder(config, params);
```

**After:**
```typescript
import { useTradingAgent, useExchangeOrder } from "@/lib/hl-react";

const { status, signer, registerAgent, isReady } = useTradingAgent({
  user,
  env: "mainnet"
});

// Direct mutation - no manual config
const { mutate: placeOrder } = useExchangeOrder();
placeOrder(params);
```

### Trading Hooks with Automatic Signer

Use these hooks instead of raw `useExchangeOrder`, etc. They automatically:
- Get the active signer from `SigningModeContext`
- Check `isReadyToTrade` before execution
- Throw `TradingNotReadyError` if not ready
- Call `onNotReady` callback for UI handling

```typescript
import {
  useSigningModeContext,  // Single source of truth for ready state
  useTradingOrder,        // Order with automatic signer
  useTradingCancel,       // Cancel with automatic signer
  useTradingModify,       // Modify with automatic signer
  useTradingTwapOrder,    // TWAP order
  useTradingTwapCancel,   // TWAP cancel
  useTradingUpdateLeverage,
} from "@/lib/hl-react";

function OrderPanel() {
  // Single source of truth for UI state
  const {
    isReadyToTrade,
    needsAgentApproval,
    agent,
    signingMode,
  } = useSigningModeContext();

  // Mutation hook - uses signer from context automatically
  const { mutate: placeOrder, isPending } = useTradingOrder({
    onSuccess: () => toast.success("Order placed!"),
    onError: (err) => {
      if (err instanceof TradingNotReadyError) {
        // Handle not ready state
        if (err.reason === "agent_not_approved") {
          showAgentApprovalModal();
        }
      } else {
        toast.error(err.message);
      }
    },
    onNotReady: (reason) => {
      // Called before error is thrown - use for UI feedback
      if (reason === "agent_not_approved") {
        showAgentApprovalModal();
      }
    },
  });

  return (
    <>
      {/* Use context for UI state */}
      {needsAgentApproval && (
        <button onClick={agent.register}>Enable Fast Trading</button>
      )}

      {/* Button disabled state from context */}
      <button
        onClick={() => placeOrder({ orders: [...], grouping: "na" })}
        disabled={!isReadyToTrade || isPending}
      >
        Place Order
      </button>
    </>
  );
}
```

### Key Pattern: Single Source of Truth

```typescript
// ✅ CORRECT: Use context for UI state
const { isReadyToTrade, needsAgentApproval } = useSigningModeContext();
const { mutate: placeOrder, isPending } = useTradingOrder();

<button disabled={!isReadyToTrade || isPending}>
  {needsAgentApproval ? "Enable Trading" : "Place Order"}
</button>

// ❌ WRONG: Using readyState from mutation hook for UI
const { mutate, readyState } = useTradingOrder();
// readyState duplicates context - use context directly instead
```

### Agent & Trading Hooks Summary

| Hook/Component | Purpose | When to Use |
|----------------|---------|-------------|
| **Context & Provider** | | |
| `SigningModeProvider` | Global signing state provider | Wrap your trading app |
| `useSigningModeContext` | **Single source of truth** for ready state | UI state (buttons, modals) |
| **Trading Mutations** | | |
| `useTradingOrder` | Place orders with auto-signer | Order placement |
| `useTradingCancel` | Cancel orders with auto-signer | Order cancellation |
| `useTradingModify` | Modify orders with auto-signer | Order modification |
| `useTradingBatchModify` | Batch modify with auto-signer | Bulk modifications |
| `useTradingTwapOrder` | TWAP order with auto-signer | TWAP orders |
| `useTradingTwapCancel` | Cancel TWAP with auto-signer | TWAP cancellation |
| `useTradingUpdateLeverage` | Update leverage with auto-signer | Leverage changes |
| `useTradingUpdateIsolatedMargin` | Update margin with auto-signer | Margin changes |
| **Low-Level** | | |
| `useTradingAgent` | Full agent lifecycle | Custom agent management |
| `useAgentWallet` | Read agent from storage | Low-level access |

### Recommended Setup

```
App
├── HyperliquidProvider (HTTP + WebSocket)
│   └── SigningModeProvider (Signing mode + Agent state)
│       │
│       ├── OrderPanel
│       │   ├── useSigningModeContext() → isReadyToTrade (for UI)
│       │   └── useTradingOrder() → mutate (for action)
│       │
│       ├── PositionsPanel
│       │   ├── useSigningModeContext() → isReadyToTrade (for UI)
│       │   └── useTradingCancel() → mutate (for action)
│       │
│       └── AgentApprovalModal
│           └── useSigningModeContext() → needsAgentApproval, agent.register
```

---

## Appendix: Full Hook List

### Info Hooks (67 total)
<details>
<summary>Click to expand</summary>

- useInfoMeta, useInfoMetaAndAssetCtxs, useInfoAllMids, useInfoL2Book
- useInfoCandleSnapshot, useInfoRecentTrades, useInfoClearinghouseState
- useInfoPortfolio, useInfoMarginTable, useInfoUserDetails, useInfoOpenOrders
- useInfoOrderStatus, useInfoUserFills, useInfoUserFillsByTime
- useInfoUserFunding, useInfoUserFundings, useInfoFundingHistory
- useInfoUserFees, useInfoUserNonFundingLedgerUpdates, useInfoTwapHistory
- useInfoUserTwapSliceFills, useInfoSubAccounts, useInfoSubAccounts2
- useInfoUserRole, useInfoUserRateLimit, useInfoUserVaultEquities
- useInfoIsVip, useInfoLegalCheck, useInfoVaultSummaries, useInfoVaultDetails
- useInfoDelegations, useInfoDelegatorSummary, useInfoDelegatorRewards
- useInfoDelegatorHistory, useInfoLeaderVaults, useInfoSpotMeta
- useInfoSpotMetaAndAssetCtxs, useInfoSpotClearinghouseState
- useInfoSpotDeployState, useInfoSpotPairDeployAuctionStatus
- useInfoPerpDexs, useInfoPerpDexStatus, useInfoPerpDexLimits
- useInfoPerpDeployAuctionStatus, useInfoPerpsAtOpenInterestCap
- useInfoExchangeStatus, useInfoGossipRootIps, useInfoBlockDetails
- useInfoTxDetails, useInfoTokenDetails, useInfoLiquidatable
- useInfoMaxMarketOrderNtls, useInfoMaxBuilderFee, useInfoPredictedFundings
- useInfoExtraAgents, useInfoReferral, useInfoPreTransferCheck
- useInfoAlignedQuoteTokenInfo, useInfoActiveAssetData
- useInfoFrontendOpenOrders, useInfoWebData2, useInfoValidatorSummaries
- useInfoValidatorL1Votes, useInfoUserToMultiSigSigners
- useInfoAllPerpMetas

</details>

### Subscription Hooks (30 total)
<details>
<summary>Click to expand</summary>

- useSubL2Book, useSubBbo, useSubTrades, useSubAllMids
- useSubAssetCtxs, useSubSpotAssetCtxs, useSubAllDexsAssetCtxs
- useSubActiveAssetCtx, useSubActiveSpotAssetCtx
- useSubAllDexsClearinghouseState, useSubUserFills, useSubUserFundings
- useSubUserEvents, useSubOrderUpdates, useSubOpenOrders
- useSubUserNonFundingLedgerUpdates, useSubUserHistoricalOrders
- useSubUserTwapHistory, useSubUserTwapSliceFills
- useSubClearinghouseState, useSubSpotState, useSubTwapStates
- useSubCandle, useSubWebData2, useSubWebData3
- useSubExplorerBlock, useSubExplorerTxs, useSubNotification

</details>

### Exchange Hooks (45 total)
<details>
<summary>Click to expand</summary>

- useExchangeOrder, useExchangeCancel, useExchangeModify
- useExchangeBatchModify, useExchangeCancelByCloid, useExchangeScheduleCancel
- useExchangeTwapOrder, useExchangeTwapCancel
- useExchangeUpdateLeverage, useExchangeUpdateIsolatedMargin
- useExchangeSendAsset, useExchangeUsdSend, useExchangeSpotSend
- useExchangeSpotUser, useExchangeWithdraw3, useExchangeCDeposit
- useExchangeCWithdraw, useExchangeCreateSubAccount
- useExchangeSubAccountTransfer, useExchangeSubAccountSpotTransfer
- useExchangeSubAccountModify, useExchangeCreateVault
- useExchangeVaultTransfer, useExchangeVaultDistribute
- useExchangeVaultModify, useExchangeSetDisplayName
- useExchangeSetReferrer, useExchangeRegisterReferrer
- useExchangeApproveAgent, useExchangeApproveBuilderFee
- useExchangeTokenDelegate, useExchangeEvmUserModify
- useExchangeLinkStakingUser, useExchangeConvertToMultiSigUser
- useExchangeUserDexAbstraction, useExchangeAgentEnableDexAbstraction
- useExchangePerpDeploy, useExchangeSpotDeploy
- useExchangeCSignerAction, useExchangeCValidatorAction
- useExchangeClaimRewards, useExchangeNoop
- useExchangeReserveRequestWeight, useExchangeValidatorL1Stream

</details>
