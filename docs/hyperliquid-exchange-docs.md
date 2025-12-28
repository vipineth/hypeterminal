# Hyperliquid Exchange API & SDK Integration Guide

This document serves as the guiding principle for developers and agents working on implementing features that interact with the Hyperliquid Exchange API using the SDK.

## Core Technology Stack

- **Viem**: Used for Ethereum-compatible signing and account management.
- **Wagmi**: React hooks for Ethereum, typically used to provide the `Account` or `Signer` to the SDK.
- **Valibot**: Used by the SDK for schema validation of requests and responses.

---

## 1. Wallet Integration (Viem/Wagmi)

The SDK uses an `AbstractWallet` interface to decouple from specific wallet libraries. It is directly compatible with Viem's `LocalAccount` and `JsonRpcAccount`.

### Bridging Wagmi to SDK
When using Wagmi, you can pass the Viem `Account` object directly to the `ExchangeClient`.

```typescript
import { useAccount } from 'wagmi';
import { ExchangeClient, HttpTransport } from '@nktkas/hyperliquid';

const { connector } = useAccount();

// ... inside a hook or component
const provider = await connector.getProvider();
// Bridging to SDK AbstractWallet
const wallet = {
  signTypedData: (params) => provider.request({ 
    method: 'eth_signTypedData_v4', 
    params: [address, JSON.stringify(params)] 
  }),
  getAddresses: async () => [address],
  getChainId: async () => chainId,
};

const client = new ExchangeClient({
  transport: new HttpTransport({ isTestnet: true }),
  wallet: wallet // Now compatible with AbstractWallet
});
```

### Key Considerations
1. **Lowercase Addresses**: All addresses in payloads should be lowercased. The SDK performs `toLowerCase()` internally in many places, but it's a best practice to provide them lowercased.
2. **Chain ID**: Hyperliquid's exchange domain always uses `chainId: 1337` for EIP-712 signing of L1 actions, regardless of the actual network. The SDK handles this automatically.
3. **Signature Chain ID**: For some actions (like `approveAgent`), the `signatureChainId` must be the actual hex chain ID (e.g., `0xa4b1` for Arbitrum).

---

## 2. Order Placement Principles

To make an order "work" on Hyperliquid, keep these things in account:

### Data Types & Precision
- **Prices (`p`)**: Must be strings. Use `formatUSD` or similar utilities to ensure correct precision.
- **Sizes (`s`)**: Must be strings.
- **Asset ID (`a`)**: Must be an integer (`number`). Use the `SymbolConverter` to get the ID from a symbol.
- **Reduce Only (`r`)**: Boolean.

### Order Types
- **Limit Order**: `{ limit: { tif: "Gtc" } }` (Good-till-Cancelled).
- **Trigger Orders (TP/SL)**: 
  - `tpsl: "tp"` or `"sl"`
  - `triggerPx`: The price at which the order activates.
  - `isMarket`: Whether to execute as a market order once triggered.

### Signing & Nonces
- **L1 Action Signing**: Most exchange actions (orders, cancels) are "L1 Actions". They are signed using EIP-712 into an "Agent" message.
- **Nonces**: The SDK uses `Date.now()` by default. If sending multiple requests in rapid succession, the SDK's internal `withLock` and `nonceManager` ensure they are sent in sequence to prevent replay errors or out-of-order execution.

### Vaults
If trading on behalf of a vault, you **must** provide the `vaultAddress` in the `ExchangeClient` config or as an option in the method call.

---

## 3. Endpoint & Method Reference

The `ExchangeClient` provides high-level methods for all Hyperliquid Exchange endpoints.

| Method | Purpose | Use Case |
| :--- | :--- | :--- |
| `order` | Place one or more orders | Limit, Market, TP, SL orders |
| `cancel` | Cancel orders by ID | Standard cancellation |
| `cancelByCloid` | Cancel by Client Order ID | Cancellation when OID is unknown |
| `modify` | Modify price/size of an order | Adjusting active limit orders |
| `batchModify` | Atomic cancel + replace | Efficiently moving multiple orders |
| `updateLeverage` | Set leverage for an asset | Changing risk profile (Cross/Isolated) |
| `updateIsolatedMargin` | Add/Remove margin | Managing isolated position health |
| `approveAgent` | Grant signing power to a key | Setting up an API wallet/agent |
| `usdSend` | Transfer USD | Sending funds between accounts/L1 |
| `spotSend` | Transfer Spot assets | Sending tokens |
| `createSubAccount` | Create a new sub-account | Account abstraction/organization |

---

## 4. SDK Usage Best Practices

### Error Handling
Always wrap SDK calls in `try/catch`. The SDK throws `ApiRequestError` for server-side errors (e.g., "Insufficient margin").

```typescript
import { ApiRequestError } from '@nktkas/hyperliquid';

try {
  const result = await client.order({ ... });
} catch (e) {
  if (e instanceof ApiRequestError) {
    console.error("Exchange Error:", e.message);
  }
}
```

### Tree Shaking
For optimal bundle size, you can import raw functions instead of using the `ExchangeClient`.

```typescript
import { order } from '@nktkas/hyperliquid/api/exchange';
// Call directly with config:
await order({ transport, wallet }, { orders: [...] });
```

### Multi-Sig
The SDK supports multi-sig accounts by passing an array of `signers` and the `multiSigUser` address to the config.

---

## Guiding Principles for Agents
1. **Verify Asset ID**: Never assume an asset ID. Check metadata first.
2. **Respect Decimals**: Always check `szDecimals` for the asset before sending size.
3. **Use CLOIDs**: Use `c` (Client Order ID) for tracking orders across sessions. It should be a 16-byte hex string.
4. **Testnet First**: Always validate new implementation logic on Testnet (`isTestnet: true`).
