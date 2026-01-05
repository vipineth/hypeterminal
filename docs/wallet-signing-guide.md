# Wallet and Signing Architecture

This guide documents the wallet connection, signing, and trading architecture for HyperTerminal.

## Overview

HyperTerminal supports two signing modes for trading:

| Mode | Description | UX | Security |
|------|-------------|-----|----------|
| **Agent** (default) | Auto-generated API wallet signs orders | Fast, no popups | Key stored in localStorage |
| **Direct** | User signs each order via wallet | Wallet popup each order | Keys never leave wallet |

## Library Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
├─────────────────────────────────────────────────────────────────┤
│  wagmi          │  viem           │  @nktkas/hyperliquid        │
│  (React hooks)  │  (Core library) │  (Hyperliquid SDK)          │
├─────────────────┼─────────────────┼─────────────────────────────┤
│  useWalletClient│  accounts       │  exchange actions           │
│  useConnection  │  signTypedData  │  info queries               │
│  useSwitchChain │  transports     │  websocket subscriptions    │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### wagmi
- React hooks for wallet connection state
- `useConnection()` - get `address`, `isConnected`
- `useWalletClient()` - get viem WalletClient for signing
- `useSwitchChain()` - switch to Arbitrum if needed

### viem
- Core Ethereum library (wagmi's foundation)
- `generatePrivateKey()` - generate agent wallet keys
- `privateKeyToAccount()` - create account from private key
- `WalletClient.signTypedData()` - sign EIP-712 typed data

### @nktkas/hyperliquid SDK
- Hyperliquid-specific API wrapper
- Accepts any signer with `signTypedData` method
- Handles L1 action signing, exchange requests

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/hyperliquid/use-trading-agent.ts` | Main hook for trading - provides `activeSigner` |
| `src/stores/use-trade-settings-store.ts` | Stores `signingMode` preference (agent/direct) |
| `src/stores/use-api-wallet-store.ts` | Stores agent wallet private keys per environment |
| `src/lib/hyperliquid/wallet.ts` | Adapter: wagmi WalletClient → SDK AbstractWallet |
| `src/lib/hyperliquid/exchange.ts` | Exchange action helpers (orders, leverage, etc.) |
| `src/lib/hyperliquid/clients.ts` | SDK client factories (transport, info client) |

## Signing Flow

### Agent Mode (Default)

```
1. User connects wallet via wagmi
2. App generates ephemeral private key (generatePrivateKey)
3. User approves agent one-time (wallet popup)
4. All subsequent orders signed by agent key (no popups)
```

### Direct Mode

```
1. User connects wallet via wagmi
2. Each order triggers wallet popup for signature
3. User signs with hardware wallet / MetaMask
```

## Common Patterns

### Get Active Signer

```typescript
import { useTradingAgent } from "@/hooks/hyperliquid/use-trading-agent";

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  const { address } = useConnection();
  
  const { 
    activeSigner,     // The signer to use for orders
    isReadyToTrade,   // Can we submit orders?
    signingMode,      // "agent" | "direct"
    isApproved,       // Is agent approved? (only relevant for agent mode)
    approveAgent,     // Function to approve agent
  } = useTradingAgent({
    user: address,
    walletClient,
    enabled: !!address,
  });

  if (!isReadyToTrade) {
    return <button onClick={approveAgent}>Enable Trading</button>;
  }

  // Use activeSigner for orders...
}
```

### Place an Order

```typescript
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { makeExchangeConfig, placeSingleOrder } from "@/lib/hyperliquid/exchange";

async function placeOrder(activeSigner, order) {
  const transport = getHttpTransport();
  // Config includes signatureChainId (0xa4b1 for Arbitrum)
  const config = makeExchangeConfig(transport, activeSigner);
  
  const result = await placeSingleOrder(config, { order });
  
  const status = result.response?.data?.statuses?.[0];
  if (status && "error" in status) {
    throw new Error(status.error);
  }
  
  return result;
}
```

### Cancel Orders

```typescript
import { cancelOrders, makeExchangeConfig } from "@/lib/hyperliquid/exchange";

async function cancelMyOrders(activeSigner, cancels) {
  const transport = getHttpTransport();
  const config = makeExchangeConfig(transport, activeSigner);
  
  const result = await cancelOrders(config, { cancels });
  return result;
}
```

### Change Signing Mode

```typescript
import { useTradeSettingsActions } from "@/stores/use-trade-settings-store";

function SigningModeToggle() {
  const { setSigningMode } = useTradeSettingsActions();
  
  return (
    <select onChange={(e) => setSigningMode(e.target.value)}>
      <option value="agent">Agent (Fast)</option>
      <option value="direct">Direct (Wallet)</option>
    </select>
  );
}
```

## Signer Types

The SDK accepts different signer types:

### For Agent Mode (Local Account)

```typescript
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(privateKey);
// account has { address, signTypedData }
// Pass directly to makeExchangeConfig
```

### For Direct Mode (Wallet)

```typescript
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";

const wallet = toHyperliquidWallet(walletClient);
// wallet adapts WalletClient to SDK's AbstractWallet interface
// Pass to makeExchangeConfig
```

## Error Handling

### Agent Not Approved

```typescript
const { isApproved, needsAgentApproval, approveAgent } = useTradingAgent(...);

if (needsAgentApproval) {
  // Show "Enable Trading" button that calls approveAgent()
}
```

### Signer Not Ready

```typescript
const { isReadyToTrade, activeSigner } = useTradingAgent(...);

if (!isReadyToTrade || !activeSigner) {
  // Cannot submit orders yet
  // - Agent mode: agent not approved yet
  // - Direct mode: wallet not connected
}
```

## Storage

| Store | Key | Data |
|-------|-----|------|
| `use-api-wallet-store` | `hyperliquid-api-wallet` | Private keys per env |
| `use-trade-settings-store` | `trade-settings` | `signingMode`, leverage, etc. |

Both use Zustand with localStorage persistence and zod validation.

## Chain ID Configuration

The SDK requires `signatureChainId` for EIP-712 signing. This is configured in `makeExchangeConfig`:

```typescript
// src/lib/hyperliquid/exchange.ts
export function makeExchangeConfig(transport, wallet) {
  return { 
    transport, 
    wallet, 
    signatureChainId: "0xa4b1" // Arbitrum One (42161)
  };
}
```

This ensures typed data signing works correctly regardless of which wallet adapter is used.

## Security Considerations

1. **Agent Mode**: Private keys are stored in localStorage. Suitable for active trading on trusted devices. Keys are environment-specific (mainnet/testnet).

2. **Direct Mode**: Keys never leave the wallet. Every order requires user confirmation. More secure but slower UX.

3. **Agent Approval**: One-time signature required to authorize the agent address. Can be revoked via Hyperliquid UI.

