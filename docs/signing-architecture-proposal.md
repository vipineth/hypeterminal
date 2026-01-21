# Signing Architecture Proposal

> A cleaner approach to handling Hyperliquid's three signing contexts with wagmi/viem.

## Current Issues

### 1. Two ExchangeClients with Unclear Roles
```
Context (exchangeClient)         useSignedExchange (exchange)
├── Master wallet               ├── Agent wallet
├── Used for: approveAgent      ├── Used for: ALL exchange hooks
└── approveBuilderFee           └── Including withdraw3, usdSend (WRONG!)
```

**Problem**: User-signed actions (`withdraw3`, `usdSend`, `spotSend`) require the master wallet signature, but currently use the agent wallet client.

### 2. Too Many Overlapping Hooks
| Hook | Responsibility | Problem |
|------|---------------|---------|
| `useAgentRegistration` | Agent status + registration | Does too much |
| `useTradingAgent` | Re-exports with renamed methods | Unnecessary wrapper |
| `useSignedExchange` | Creates ExchangeClient from agent | Confusing name |
| `useTradingStatus` | Derives status | Another wrapper |
| `useTradingGuard` | Guards actions | Complex state machine |
| `useHyperliquidClients` | Combines clients | Hides the client source |

### 3. Naming Confusion
- `useSignedExchange` → sounds like signing, returns ExchangeClient
- `useTradingAgent` → same as `useAgentRegistration`
- Master wallet client vs Agent wallet client not clear

### 4. Deposit/Withdraw Mismatch
- Deposit: Separate hook using wagmi directly ✓
- Withdraw: Uses agent client (should use master client!)

---

## Proposed Architecture

### Core Principle: Explicit Signing Contexts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THREE SIGNING CONTEXTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  TRADING         │  │  ADMIN           │  │  BRIDGE          │       │
│  │  (L1 Actions)    │  │  (User-Signed)   │  │  (Arbitrum EVM)  │       │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤       │
│  │ Wallet: Agent    │  │ Wallet: Master   │  │ Wallet: Master   │       │
│  │ Chain: 1337      │  │ Chain: 0x66eee   │  │ Chain: 42161     │       │
│  │ Network: None    │  │ Network: None    │  │ Network: Arbitrum│       │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤       │
│  │ • order          │  │ • withdraw3      │  │ • deposit        │       │
│  │ • cancel         │  │ • usdSend        │  │   (Permit +      │       │
│  │ • modify         │  │ • spotSend       │  │    Bridge2)      │       │
│  │ • updateLeverage │  │ • usdClassTransf │  │                  │       │
│  │ • vaultTransfer  │  │ • sendAsset      │  │                  │       │
│  │ • subAccountTran │  │ • approveAgent   │  │                  │       │
│  │ • etc...         │  │ • approveBuilder │  │                  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│           │                     │                     │                  │
│           ▼                     ▼                     ▼                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ useTradingClient │  │ useAdminClient   │  │ useDeposit       │       │
│  │ (ExchangeClient  │  │ (ExchangeClient  │  │ (wagmi hooks)    │       │
│  │  with agent)     │  │  with master)    │  │                  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## New File Structure

```
src/lib/hyperliquid/
├── clients.ts                      # SDK client factories (unchanged)
├── context.tsx                     # Simplified provider
├── index.ts                        # Exports
│
├── signing/
│   ├── index.ts                    # Exports
│   ├── types.ts                    # SigningStatus, AgentStatus types
│   ├── agent-storage.ts            # Agent wallet localStorage
│   ├── use-agent-status.ts         # Agent approval status
│   ├── use-agent-registration.ts   # Registration logic only
│   └── use-master-wallet.ts        # Master wallet adapter
│
├── trading/
│   ├── index.ts
│   ├── use-trading-client.ts       # ExchangeClient with agent
│   ├── use-trading-status.ts       # Simple ready/not-ready
│   └── use-trading-guard.ts        # Optional action guard
│
├── admin/
│   ├── index.ts
│   ├── use-admin-client.ts         # ExchangeClient with master
│   ├── use-withdraw.ts             # withdraw3
│   ├── use-transfer.ts             # usdSend, spotSend
│   ├── use-usd-class-transfer.ts   # usdClassTransfer (perp↔spot)
│   ├── use-send-asset.ts           # sendAsset (DEX/sub-account transfers)
│   └── use-staking.ts              # tokenDelegate
│
├── bridge/
│   ├── index.ts
│   ├── types.ts                    # DepositStatus, etc.
│   ├── use-deposit.ts              # Arbitrum deposit
│   └── contracts.ts                # ABI, addresses
│
└── hooks/
    ├── exchange/                   # L1 action mutations (use trading client)
    ├── info/                       # Info queries (unchanged)
    └── subscription/               # Subscriptions (unchanged)
```

---

## Implementation Details

### 1. Simplified Context

```typescript
// context.tsx
interface HyperliquidContextValue {
  info: InfoClient;
  subscription: SubscriptionClient;
  env: HyperliquidEnv;
  builderConfig: BuilderConfig;
  agentName: string;
}

// No more exchangeClient in context!
// Clients are created by hooks based on signing context
```

### 2. Signing Module

```typescript
// signing/types.ts
export type AgentStatus =
  | "loading"           // Checking on-chain status
  | "needs_builder_fee" // Builder fee not approved
  | "needs_agent"       // Agent not registered
  | "ready"             // Can trade
  | "invalid";          // Agent exists but not valid

export type RegistrationStatus =
  | "idle"
  | "approving_fee"
  | "approving_agent"
  | "error";
```

```typescript
// signing/use-agent-status.ts
export function useAgentStatus(): {
  status: AgentStatus;
  agentAddress: `0x${string}` | null;
  isReady: boolean;
}
```

```typescript
// signing/use-agent-registration.ts
export function useAgentRegistration(): {
  register: () => Promise<void>;
  status: RegistrationStatus;
  error: Error | null;
  reset: () => void;
}
```

### 3. Trading Module (L1 Actions)

```typescript
// trading/use-trading-client.ts
export function useTradingClient(): {
  client: ExchangeClient | null;
  isReady: boolean;
}

// Returns ExchangeClient configured with agent wallet
// null if agent not registered
```

```typescript
// trading/use-trading-status.ts
export function useTradingStatus(): {
  status: "disconnected" | "needs_setup" | "ready";
  isReady: boolean;
}
```

### 4. Admin Module (User-Signed Actions)

```typescript
// admin/use-admin-client.ts
export function useAdminClient(): {
  client: ExchangeClient | null;
  isReady: boolean;
}

// Returns ExchangeClient configured with master wallet
// For user-signed actions: withdraw3, usdSend, spotSend
```

```typescript
// admin/use-withdraw.ts
export function useWithdraw(): {
  withdraw: (params: { destination: string; amount: string }) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

// Uses admin client (master wallet) NOT trading client
```

### 5. Bridge Module (Arbitrum EVM)

```typescript
// bridge/use-deposit.ts
export function useDeposit(): {
  // Chain management
  isArbitrum: boolean;
  switchToArbitrum: () => void;
  isSwitching: boolean;

  // Balance
  balance: string;

  // Deposit
  deposit: (amount: string) => void;
  status: "idle" | "signing" | "confirming" | "success" | "error";
  error: Error | null;
  reset: () => void;
}

// Uses wagmi hooks directly (useSignTypedData, useWriteContract)
// Requires Arbitrum network connection
```

---

## Hook Usage Comparison

### Before (Current)
```typescript
// Confusing: which client? which signing?
const { exchange } = useHyperliquidClients();
const { mutate: order } = useExchangeOrder();
const { mutate: withdraw } = useExchangeWithdraw3(); // Uses wrong client!
```

### After (Proposed)
```typescript
// Trading (L1 actions) - uses agent wallet
const { client: tradingClient } = useTradingClient();
const { mutate: order } = useExchangeOrder(); // Uses trading client

// Admin (user-signed) - uses master wallet
const { withdraw, isPending } = useWithdraw(); // Uses admin client

// Bridge (Arbitrum EVM) - uses wagmi
const { deposit, isArbitrum, switchToArbitrum } = useDeposit();
```

---

## Migration Path

### Phase 1: Add New Modules
1. Create `signing/` module with new hooks
2. Create `admin/` module for user-signed actions
3. Create `bridge/` module for deposits (move from `hooks/arbitrum/`)

### Phase 2: Update Exchange Hooks
1. Update exchange hooks to explicitly use `useTradingClient`
2. Move `withdraw3`, `usdSend`, `spotSend` to `admin/` module
3. Update components to use new hooks

### Phase 3: Deprecate Old Hooks
1. Mark old hooks as deprecated
2. Update all consumers
3. Remove old hooks

---

## Key Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Client clarity** | Two clients, unclear which is used | Explicit: trading vs admin vs bridge |
| **Signing context** | Hidden in implementation | Explicit in module structure |
| **withdraw3 signing** | Wrong client (agent) | Correct client (master) |
| **Hook count** | 6+ overlapping hooks | 3 focused modules |
| **Naming** | `useSignedExchange` (confusing) | `useTradingClient` (clear) |
| **Deposit/withdraw** | Different patterns | Consistent bridge module |

---

## Questions to Resolve

1. **Should we keep `useTradingGuard`?**
   - It adds complexity but provides nice UX
   - Could be optional/separate utility

2. **How to handle the transition?**
   - Big bang vs gradual migration
   - Deprecation warnings

3. **Error handling strategy?**
   - Per-hook errors vs global error context
   - Toast notifications for signing failures

## Resolved Questions

1. ~~**Should `usdClassTransfer` use trading or admin client?**~~
   - **Answer**: Admin client (master wallet). The SDK API shows `usdClassTransfer` has `signatureChainId` field, confirming it's a User-Signed Action.
   - Same applies to `sendAsset` - it also requires master wallet.
