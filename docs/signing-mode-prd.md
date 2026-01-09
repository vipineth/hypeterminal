# Signing Mode Management PRD

## Overview

This document defines the product requirements and implementation plan for managing signing modes in the Hyperliquid trading interface. The system supports two signing modes: **Agent Mode** (delegated signing) and **Direct Mode** (per-action signing via master wallet).

## Problem Statement

The current implementation has a critical bug where the `approveAgent` call fails with "failed to sign via wallet" because the wallet popup never appears. The root cause is an architecture issue where the global `ExchangeClient` may not have the master wallet attached when `approveAgent` is called.

### Root Cause Analysis
- The `HyperliquidProvider` creates a global `ExchangeClient` stored in a client registry
- When `approveAgent` is called via `useExchangeApproveAgent`, it uses this global client
- The global client's wallet depends on `signingMode` and `agentLifecycle.signer`
- At the time of calling `approveAgent`, the client may have:
  - `null` (no signer yet)
  - The agent signer from a previous approval (wrong wallet for approve)
- `approveAgent` **requires the master wallet** to sign the agent approval

## Signing Modes

### Agent Mode (Default)
- User approves a delegated agent once via master wallet signature
- Agent keypair (private/public) is generated client-side
- Private key stored in `localStorage` keyed by `env:userAddress`
- All subsequent trading actions (order, cancel, modify) signed by agent
- **Benefit**: No wallet popup for each trade
- **Trade-off**: Requires initial approval, stored keys

### Direct Mode
- Every trading action requires master wallet signature
- No agent keypair generated or stored
- User sees wallet popup for each action
- **Benefit**: No stored keys, maximum control
- **Trade-off**: Popup fatigue, slower trading

## Product Requirements

### PR-1: Two Exchange Clients Architecture
- Maintain two separate `ExchangeClient` instances:
  1. **Master Exchange Client**: Always uses master wallet (from wagmi/viem)
     - Used exclusively for `approveAgent`
     - Created when wallet connects, destroyed on disconnect
  2. **Trading Exchange Client**: Wallet depends on signing mode
     - Agent mode: Uses agent signer
     - Direct mode: Uses master wallet
     - Recreated when signing mode changes

### PR-2: Signing Mode Toggle
- Location: Order entry panel dropdown
- Scope: Global setting (applies to all wallets)
- Persistence: Session only (not persisted across sessions)
- Default: Agent mode

### PR-3: Agent Mode Default with Warning
- When switching from Agent to Direct mode, show warning:
  > "In Direct Mode, your wallet will prompt for approval on every trade action (place order, cancel, modify). This may slow down your trading."
- No warning when switching Direct to Agent

### PR-4: Enable Trading Button
- **Visibility**: Only shown when:
  - Signing mode is "agent" AND
  - Agent is not approved OR agent is expired
- **Behavior**: Triggers agent approval flow
- **States**:
  - Idle: "Enable Trading"
  - Signing: "Awaiting Signature..." (button disabled)
  - Error: "Enable Trading" with error toast

### PR-5: Agent Key Storage
- Storage: `localStorage`
- Key format: `hyperliquid:agent:{env}:{userAddress}`
- Value: JSON `{ privateKey, publicKey }`
- Multi-wallet support: Each master address has its own agent keypair

### PR-6: Agent Expiration Handling
- Strategy: Reactive only (no proactive renewal)
- When agent expires and user attempts action in agent mode:
  - Show "Enable Trading" popup/overlay
  - Prompt user to re-approve agent
  - Generate new keypair on re-approval

### PR-7: Error Handling
- Map SDK/wallet errors to user-friendly messages
- Common mappings:
  - User rejected signature: "Signature request was cancelled"
  - Network error: "Network error. Please try again."
  - Agent verification failed: "Agent verification failed. Please try again."
  - Unknown error: "Something went wrong. Please try again."

### PR-8: Action Button State During Signing
- In Direct mode: Disable action buttons while signature is pending
- Prevents multiple wallet popups from rapid clicks
- Button states:
  - Normal: Clickable
  - Pending: Disabled with loading indicator
  - Error: Re-enabled with error feedback

## Technical Architecture

### Wallet Type Conversion

The `@nktkas/hyperliquid` SDK expects an `AbstractWallet` - any object with `address` and `signTypedData` method.

#### Signer Types

| Source | Type | SDK Compatible? | Conversion |
|--------|------|-----------------|------------|
| Agent (generated) | `privateKeyToAccount()` → viem LocalAccount | ✅ Yes | None needed |
| Direct (wagmi) | `WalletClient` (JSON-RPC) | ❌ No | `toHyperliquidWallet()` |

#### Agent Signer (No Conversion)
```typescript
import { privateKeyToAccount } from "viem/accounts";

// viem LocalAccount implements AbstractWallet directly
const agentSigner = privateKeyToAccount(privateKey);
// Has: address, signTypedData - ready to use
```

#### Direct Signer (Requires Conversion)
```typescript
import { useWalletClient } from "wagmi";
import { toHyperliquidWallet } from "./wallet";

const { data: walletClient } = useWalletClient();

// wagmi WalletClient is JSON-RPC based, needs adapter
const directSigner = toHyperliquidWallet(walletClient, address);
// Returns: { address, signTypedData } or AbstractViemJsonRpcAccount
```

#### toHyperliquidWallet Utility

The `wallet.ts` helper converts wagmi's `WalletClient` to `AbstractWallet`:

```typescript
// Handles two cases:
// 1. Full WalletClient (has getAddresses, getChainId)
//    → Returns AbstractViemJsonRpcAccount
// 2. Partial client (just signTypedData)
//    → Returns { address, signTypedData }

export function toHyperliquidWallet(
  walletClient: unknown,
  accountOverride?: `0x${string}` | null,
): AbstractWallet | null;
```

**Key Points:**
- Agent signer from `privateKeyToAccount` works directly - no conversion
- Direct signer from wagmi `useWalletClient` must be converted
- Conversion wraps `signTypedData` to match SDK's expected signature format
- Returns `null` if wallet/account is unavailable

### Client Structure

```
HyperliquidClientsContext
├── info: InfoClient (read-only)
├── subscription: SubscriptionClient (WebSocket)
├── masterExchange: ExchangeClient (master wallet) - NEW
└── tradingExchange: ExchangeClient (mode-dependent) - RENAMED
```

### State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Wallet Connection                            │
│                           │                                      │
│                           ▼                                      │
│               ┌───────────────────────┐                         │
│               │  Create MasterClient  │                         │
│               │  (always master wallet)│                         │
│               └───────────────────────┘                         │
│                           │                                      │
│                           ▼                                      │
│               ┌───────────────────────┐                         │
│               │   Check Agent Status  │                         │
│               │   (via extraAgents)    │                         │
│               └───────────────────────┘                         │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              │                         │                        │
│              ▼                         ▼                        │
│     Agent Valid                  Agent Invalid/None              │
│         │                              │                        │
│         ▼                              ▼                        │
│   Create TradingClient         Show "Enable Trading"            │
│   (agent signer)                       │                        │
│         │                              ▼                        │
│         │                    User clicks Enable                 │
│         │                              │                        │
│         │                              ▼                        │
│         │                    Generate keypair                   │
│         │                              │                        │
│         │                              ▼                        │
│         │               Call approveAgent via MasterClient      │
│         │                              │                        │
│         │                              ▼                        │
│         │                    Store keys in localStorage         │
│         │                              │                        │
│         │                              ▼                        │
│         │                    Create TradingClient               │
│         │                    (new agent signer)                 │
│         │                              │                        │
│         └──────────────────────────────┘                        │
│                           │                                      │
│                           ▼                                      │
│                    Trading Ready                                │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              │                         │                        │
│              ▼                         ▼                        │
│       Agent Mode                 Direct Mode                    │
│    (agent signs)             (master signs)                    │
│                                        │                        │
│                                        ▼                        │
│                              Recreate TradingClient             │
│                              (master wallet)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Fix Core Architecture

#### 1.1 Update Client Registry (`src/lib/hyperliquid/client-registry.ts`)

**Current**: Single `exchange` client in registry
**Change**: Add `masterExchange` and rename `exchange` to `tradingExchange`

```typescript
// Add new client management functions
let masterExchangeClient: ExchangeClient | null = null;
let tradingExchangeClient: ExchangeClient | null = null;

export function setMasterExchangeClient(wallet: AbstractWallet | null) {
  if (!wallet) {
    masterExchangeClient = null;
    return;
  }
  masterExchangeClient = new ExchangeClient({
    transport: httpTransport,
    wallet,
  });
}

export function setTradingExchangeClient(wallet: AbstractWallet | null) {
  if (!wallet) {
    tradingExchangeClient = null;
    return;
  }
  tradingExchangeClient = new ExchangeClient({
    transport: httpTransport,
    wallet,
  });
}

export function getMasterExchangeClient(): ExchangeClient | null {
  return masterExchangeClient;
}

export function getTradingExchangeClient(): ExchangeClient | null {
  return tradingExchangeClient;
}
```

#### 1.2 Update Context Types (`src/lib/hyperliquid/context.tsx`)

**Current**: `HyperliquidClients` has single `exchange`
**Change**: Split into `masterExchange` and `tradingExchange`

```typescript
export type HyperliquidClients = {
  info: InfoClient;
  subscription: SubscriptionClient;
  masterExchange: ExchangeClient | null;  // For approveAgent
  tradingExchange: ExchangeClient | null; // For orders, cancels, etc.
};
```

#### 1.3 Update HyperliquidTradingProvider (`src/lib/hyperliquid/context.tsx`)

**Changes**:
1. Create `masterExchangeClient` when `wallet` prop is available
2. Create `tradingExchangeClient` based on `signingMode`
3. Pass both clients through context

```typescript
// In HyperliquidTradingProvider:
useEffect(() => {
  // Master client: always uses the wagmi wallet
  if (wallet && userAddress) {
    setMasterExchangeClient(wallet);
  } else {
    setMasterExchangeClient(null);
  }

  return () => setMasterExchangeClient(null);
}, [wallet, userAddress]);

useEffect(() => {
  // Trading client: depends on signing mode
  if (signingMode === "agent" && agentLifecycle.signer) {
    setTradingExchangeClient(agentLifecycle.signer as AbstractWallet);
  } else if (signingMode === "direct" && directSigner) {
    setTradingExchangeClient(directSigner);
  } else {
    setTradingExchangeClient(null);
  }
}, [signingMode, directSigner, agentLifecycle.signer]);
```

#### 1.4 Update useExchangeApproveAgent Hook (`src/lib/hyperliquid/hooks/exchange/useExchangeApproveAgent.ts`)

**Change**: Use `masterExchange` instead of `exchange`

```typescript
export function useExchangeApproveAgent(
  options: UseExchangeApproveAgentOptions = {},
): UseExchangeApproveAgentReturnType {
  const { masterExchange } = useHyperliquidClients(); // Changed from exchange

  return useMutation({
    ...options,
    mutationKey: exchangeKeys.method("approveAgent"),
    mutationFn: (params) => {
      if (!masterExchange) throw new MissingWalletError();
      return masterExchange.approveAgent(params);
    },
  });
}
```

#### 1.5 Update All Trading Hooks

Update all hooks that use `exchange` to use `tradingExchange`:
- `useExchangeOrder`
- `useExchangeCancel`
- `useExchangeBatchModify`
- etc.

### Phase 2: Add Signing Mode Toggle UI

#### 2.1 Create Mode Toggle Component (`src/components/trade/signing-mode-toggle.tsx`)

```tsx
interface Props {
  value: SigningMode;
  onChange: (mode: SigningMode) => void;
  disabled?: boolean;
}

export function SigningModeToggle({ value, onChange, disabled }: Props) {
  const handleChange = (newMode: SigningMode) => {
    if (newMode === "direct" && value === "agent") {
      // Show warning before switching to direct mode
      // Use toast or modal
    }
    onChange(newMode);
  };

  return (
    <DropdownMenu>
      {/* Implementation */}
    </DropdownMenu>
  );
}
```

#### 2.2 Integrate into Order Entry Panel (`src/components/trade/order-entry/order-entry-panel.tsx`)

Add `SigningModeToggle` to the order entry header area.

### Phase 3: Update Enable Trading Flow

#### 3.1 Update Enable Trading Button Logic

**File**: `src/components/trade/order-entry/enable-trading-button.tsx` (or similar)

```tsx
export function EnableTradingButton() {
  const {
    signingMode,
    agentStatus,
    approveAgent,
    agentRegisterStatus
  } = useHyperliquidContext();

  // Only show in agent mode when agent not approved
  if (signingMode !== "agent") return null;
  if (agentStatus === "valid") return null;

  const isPending = agentRegisterStatus === "signing" || agentRegisterStatus === "verifying";

  return (
    <Button
      onClick={approveAgent}
      disabled={isPending}
    >
      {isPending ? "Awaiting Signature..." : "Enable Trading"}
    </Button>
  );
}
```

### Phase 4: Add Action Button Pending States

#### 4.1 Create Mutation State Hook

```typescript
export function useIsTradingPending(): boolean {
  const { signingMode } = useHyperliquidContext();

  // In direct mode, track if any trading mutation is pending
  // This prevents multiple wallet popups

  const orderMutation = useExchangeOrder();
  const cancelMutation = useExchangeCancel();
  // ... other mutations

  if (signingMode !== "direct") return false;

  return orderMutation.isPending || cancelMutation.isPending || /* ... */;
}
```

#### 4.2 Apply to Action Buttons

```tsx
function OrderButton({ onSubmit }: Props) {
  const isTradingPending = useIsTradingPending();

  return (
    <Button
      onClick={onSubmit}
      disabled={isTradingPending}
    >
      {isTradingPending ? <Spinner /> : "Place Order"}
    </Button>
  );
}
```

### Phase 5: Error Mapping

#### 5.1 Create Error Mapper (`src/lib/hyperliquid/errors.ts`)

```typescript
export function mapSigningError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // User rejection patterns
  if (message.includes("user rejected") || message.includes("User denied")) {
    return "Signature request was cancelled";
  }

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please try again.";
  }

  // Agent verification
  if (message.includes("verification failed")) {
    return "Agent verification failed. Please try again.";
  }

  // Default
  return "Something went wrong. Please try again.";
}
```

## File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/hyperliquid/wallet.ts` | Existing | Converts wagmi WalletClient → AbstractWallet (no changes needed) |
| `src/lib/hyperliquid/client-registry.ts` | Modify | Add master/trading client separation |
| `src/lib/hyperliquid/context.tsx` | Modify | Update providers, use toHyperliquidWallet for direct signer |
| `src/lib/hyperliquid/hooks/exchange/useExchangeApproveAgent.ts` | Modify | Use masterExchange |
| `src/lib/hyperliquid/hooks/exchange/*.ts` | Modify | Use tradingExchange |
| `src/lib/hyperliquid/hooks/useClients.ts` | Modify | Expose both clients |
| `src/lib/hyperliquid/errors.ts` | Create | Add error mapping utility |
| `src/components/trade/signing-mode-toggle.tsx` | Create | Mode toggle dropdown |
| `src/components/trade/order-entry/*.tsx` | Modify | Integrate toggle, pending states |

## Testing Checklist

- [ ] Wallet connects -> masterExchangeClient created with master wallet
- [ ] Click "Enable Trading" -> wallet popup appears (from masterExchange)
- [ ] Approve signature -> agent registered, tradingExchangeClient created with agent
- [ ] Place order in agent mode -> no wallet popup, order succeeds
- [ ] Switch to direct mode -> tradingExchangeClient recreated with master wallet
- [ ] Place order in direct mode -> wallet popup appears
- [ ] Cancel order in direct mode -> wallet popup appears
- [ ] Rapid click order button -> only one popup, button disabled
- [ ] Agent expires -> "Enable Trading" shows, can re-approve
- [ ] Disconnect wallet -> both clients cleared
- [ ] Reconnect different wallet -> fresh state, can enable trading

## Success Metrics

1. **Bug Fix**: "Enable Trading" successfully triggers wallet popup (was: never appeared)
2. **Mode Switching**: Users can toggle between agent/direct modes without page reload
3. **No Regression**: All existing trading functionality works in both modes
