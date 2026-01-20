# Hyperliquid Signing Architecture

> Complete reference for Hyperliquid's three distinct signing mechanisms: L1 Actions, User-Signed Actions, and Arbitrum EVM transactions.

## Quick Reference

| Signing Type | Chain ID | Domain | Use Case | Network Required |
|--------------|----------|--------|----------|------------------|
| **L1 Actions** | 1337 | "Exchange" | Trading operations | None (API only) |
| **User-Signed** | 0x66eee (421614) | "HyperliquidSignTransaction" | Transfers, agent approval | None (API only) |
| **Arbitrum EVM** | 42161 | Standard EIP-712 | Deposits from Arbitrum | Arbitrum network |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HYPERLIQUID SIGNING                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────┐  │
│  │   L1 Actions         │  │   User-Signed        │  │  Arbitrum EVM │  │
│  │   (Trading)          │  │   (Admin/Transfers)  │  │  (Deposits)   │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├───────────────┤  │
│  │ Chain ID: 1337       │  │ Chain ID: 0x66eee    │  │ Chain ID:     │  │
│  │ Domain: "Exchange"   │  │ Domain: "Hyperliquid │  │ 42161         │  │
│  │                      │  │ SignTransaction"     │  │               │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├───────────────┤  │
│  │ • order              │  │ • withdraw3          │  │ • Permit      │  │
│  │ • cancel             │  │ • usdSend            │  │ • Bridge2     │  │
│  │ • modify             │  │ • spotSend           │  │   deposit     │  │
│  │ • updateLeverage     │  │ • approveAgent       │  │               │  │
│  │ • updateIsolatedMarg │  │ • approveBuilderFee  │  │               │  │
│  │ • twapOrder          │  │                      │  │               │  │
│  │ • scheduleCancel     │  │                      │  │               │  │
│  │ • vaultTransfer      │  │ • usdClassTransfer   │  │               │  │
│  │ • subAccountTransfer │  │ • sendAsset          │  │               │  │
│  │ • etc...             │  │ • tokenDelegate      │  │               │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────┘  │
│           │                         │                        │          │
│           ▼                         ▼                        ▼          │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────┐  │
│  │ signL1Action()       │  │ signUserSignedAction │  │ wagmi/viem    │  │
│  │ (SDK handles auto)   │  │ (SDK handles auto)   │  │ signTypedData │  │
│  └──────────────────────┘  └──────────────────────┘  └───────────────┘  │
│           │                         │                        │          │
│           └─────────────────────────┼────────────────────────┘          │
│                                     ▼                                    │
│                    ┌────────────────────────────┐                        │
│                    │   ExchangeClient (SDK)     │                        │
│                    │   Handles both L1 and      │                        │
│                    │   User-Signed automatically │                        │
│                    └────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Signing Type 1: L1 Actions (Trading)

High-frequency trading operations that use a "phantom agent" construction. **No EVM network connection required** - signing happens purely with the private key.

### Characteristics

| Property | Value |
|----------|-------|
| Chain ID | 1337 |
| Domain Name | "Exchange" |
| Serialization | Msgpack binary → keccak256 hash |
| Signed By | Agent wallet (PrivateKeySigner or local account) |
| Network | None required (Hyperliquid API only) |

### Methods Using L1 Signing

| Method | Description | Parameters |
|--------|-------------|------------|
| `order` | Place order(s) | `orders`, `grouping`, `builder?` |
| `cancel` | Cancel by order ID | `cancels: [{a, o}]` |
| `cancelByCloid` | Cancel by client order ID | `cancels: [{asset, cloid}]` |
| `modify` | Modify single order | `oid`, `order` |
| `batchModify` | Modify multiple orders | `modifies` |
| `updateLeverage` | Set leverage for asset | `asset`, `isCross`, `leverage` |
| `updateIsolatedMargin` | Add/remove isolated margin | `asset`, `isBuy`, `ntli` |
| `twapOrder` | Place TWAP order | `a`, `b`, `s`, `r`, `m`, `t` |
| `twapCancel` | Cancel TWAP | `a`, `t` |
| `scheduleCancel` | Dead man's switch | `time?` |
| `vaultTransfer` | Deposit/withdraw vault | `vaultAddress`, `isDeposit`, `usd` |
| `subAccountTransfer` | Transfer to sub-account | `subAccountUser`, `isDeposit`, `usd` |
| `subAccountSpotTransfer` | Spot transfer to sub-account | `subAccountUser`, `isDeposit`, `token`, `amount` |
| `createSubAccount` | Create sub-account | `name` |
| `createVault` | Create vault | `...` |
| `setDisplayName` | Set leaderboard name | `displayName` |

### Code Example

```typescript
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { PrivateKeySigner } from "@nktkas/hyperliquid/signing";

// Agent wallet signs with chainId 1337 automatically
const agentSigner = new PrivateKeySigner("0x...");
const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: agentSigner,
});

// SDK handles L1 signing internally
await client.order({
  orders: [{
    a: 0, b: true, p: "95000", s: "0.01",
    r: false, t: { limit: { tif: "Gtc" } }
  }],
  grouping: "na",
});
```

---

## Signing Type 2: User-Signed Actions (Admin/Transfers)

Administrative operations that use EIP-712 typed data with Hyperliquid's signature chain ID. **No EVM network connection required** - the chain ID is embedded in the signature, not the network.

### Characteristics

| Property | Value |
|----------|-------|
| Chain ID | 0x66eee (421614 decimal) |
| Domain Name | "HyperliquidSignTransaction" |
| Serialization | Direct EIP-712 typed data |
| Signed By | Master wallet (wagmi walletClient or viem account) |
| Network | None required (Hyperliquid API only) |

### Methods Using User-Signed Actions

| Method | Description | Parameters |
|--------|-------------|------------|
| `withdraw3` | Withdraw USDC to Arbitrum | `destination`, `amount` |
| `usdSend` | Send USDC to address | `destination`, `amount` |
| `spotSend` | Send spot tokens | `destination`, `token`, `amount` |
| `usdClassTransfer` | Move USDC perp↔spot | `amount`, `toPerp` |
| `sendAsset` | Transfer between DEXs/sub-accounts | `destination`, `sourceDex`, `destinationDex`, `token`, `amount` |
| `approveAgent` | Approve agent wallet | `agentAddress`, `agentName?`, `nonce` |
| `approveBuilderFee` | Approve builder fee | `builder`, `maxFeeRate`, `nonce` |
| `tokenDelegate` | Delegate/undelegate staking | `validator`, `amount`, `isUndelegate` |
| `userDexAbstraction` | Enable/disable HIP-3 DEX abstraction | `user`, `enabled` |

### Code Example

```typescript
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

// Master wallet for user-signed actions
const masterAccount = privateKeyToAccount("0x...");
const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: masterAccount,
});

// SDK handles user-signed action internally (chainId 0x66eee)
await client.withdraw3({
  destination: "0x...",
  amount: "100.0",
});
```

---

## Signing Type 3: Arbitrum EVM Transactions (Deposits)

Actual on-chain transactions on Arbitrum network. **Requires wallet connected to Arbitrum**.

### Characteristics

| Property | Value |
|----------|-------|
| Chain ID | 42161 (Arbitrum One) |
| Contract | Bridge2 (`0x2df1c51e09aecf9cacb7bc98cb1742757f163df7`) |
| Token | USDC (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`) |
| Signed By | Master wallet via wagmi |
| Network | **Arbitrum required** |

### Deposit Flow

1. **Sign EIP-712 Permit** - Authorize Bridge2 to spend USDC
2. **Call `batchedDepositWithPermit`** - On-chain transaction on Arbitrum
3. **Hyperliquid credits** - Funds appear in HyperCore account

### Code Example (Current Implementation)

```typescript
// From use-arbitrum-deposit.ts
const { signTypedData } = useSignTypedData();
const { writeContract } = useWriteContract();

// Step 1: Sign permit (EIP-712 on Arbitrum)
signTypedData({
  domain: {
    name: "USD Coin",
    version: "2",
    chainId: BigInt(ARBITRUM_CHAIN_ID),
    verifyingContract: CONTRACTS.arbitrum.usdc,
  },
  types: PERMIT_TYPES,
  primaryType: "Permit",
  message: { owner, spender, value, nonce, deadline },
}, {
  onSuccess: (sig) => {
    // Step 2: Submit deposit transaction
    writeContract({
      address: CONTRACTS.arbitrum.bridge2,
      abi: BRIDGE2_ABI,
      functionName: "batchedDepositWithPermit",
      args: [/* deposit params */],
      chainId: ARBITRUM_CHAIN_ID,
    });
  },
});
```

---

## Withdrawal Flow (HyperCore → Arbitrum)

Withdrawals use **User-Signed Actions** (not Arbitrum EVM).

| Step | Action | Signing Type |
|------|--------|--------------|
| 1 | Call `exchange.withdraw3()` | User-Signed (0x66eee) |
| 2 | Hyperliquid processes | Automatic |
| 3 | USDC arrives on Arbitrum | ~10 min |

```typescript
// Withdrawal - uses User-Signed Action, NOT Arbitrum tx
await exchangeClient.withdraw3({
  destination: arbitrumAddress,
  amount: "100.0",
});
```

---

## Complete Method → Signing Type Reference

### L1 Actions (Chain ID: 1337)

| Category | Methods |
|----------|---------|
| **Orders** | `order`, `cancel`, `cancelByCloid`, `modify`, `batchModify` |
| **TWAP** | `twapOrder`, `twapCancel` |
| **Position** | `updateLeverage`, `updateIsolatedMargin` |
| **Schedule** | `scheduleCancel` |
| **Sub-accounts** | `createSubAccount`, `subAccountTransfer`, `subAccountSpotTransfer`, `subAccountModify` |
| **Vaults** | `createVault`, `vaultTransfer`, `vaultModify`, `vaultDistribute` |
| **Account** | `setDisplayName`, `setReferrer`, `registerReferrer`, `claimRewards` |
| **Staking (L1)** | `cDeposit`, `cWithdraw`, `linkStakingUser`, `cSignerAction`, `cValidatorAction` |
| **Advanced** | `evmUserModify`, `perpDeploy`, `spotDeploy`, `reserveRequestWeight`, `agentEnableDexAbstraction`, `convertToMultiSigUser`, `noop` |

### User-Signed Actions (Chain ID: 0x66eee)

| Category | Methods |
|----------|---------|
| **Withdrawals** | `withdraw3` |
| **External Transfers** | `usdSend`, `spotSend` |
| **Internal Transfers** | `usdClassTransfer`, `sendAsset` |
| **Approvals** | `approveAgent`, `approveBuilderFee` |
| **Staking** | `tokenDelegate` |
| **Advanced** | `userDexAbstraction` |

### Arbitrum EVM Transactions (Chain ID: 42161)

| Category | Methods |
|----------|---------|
| **Deposits** | EIP-712 Permit + `Bridge2.batchedDepositWithPermit()` |

---

## Bridging: HyperCore ↔ HyperEVM ↔ Arbitrum

### System Addresses

| Token | System Address |
|-------|----------------|
| USDC | `0x2000000000000000000000000000000000000000` |
| HYPE | `0x2222222222222222222222222222222222222222` |

### Contract Addresses (Mainnet)

| Contract | Address |
|----------|---------|
| Native USDC (Arbitrum) | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Bridge2 (Arbitrum) | `0x2df1c51e09aecf9cacb7bc98cb1742757f163df7` |
| CoreDepositWallet (HyperEVM) | `0x6b9e773128f453f5c2c60935ee2de2cbc5390a24` |
| CoreWriter (HyperEVM) | `0x3333333333333333333333333333333333333333` |

### Bridge Flows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BRIDGE FLOWS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ARBITRUM → HYPERCORE (Deposit)                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                           │
│  │ Arbitrum │───▶│ Bridge2  │───▶│ HyperCore│                           │
│  │ USDC     │    │ Contract │    │ Balance  │                           │
│  └──────────┘    └──────────┘    └──────────┘                           │
│  Signing: Arbitrum EVM (42161)                                           │
│                                                                          │
│  HYPERCORE → ARBITRUM (Withdraw)                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                           │
│  │ HyperCore│───▶│ withdraw3│───▶│ Arbitrum │                           │
│  │ Balance  │    │ API Call │    │ USDC     │                           │
│  └──────────┘    └──────────┘    └──────────┘                           │
│  Signing: User-Signed (0x66eee)                                          │
│                                                                          │
│  HYPERCORE → HYPEREVM (Internal Bridge)                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                           │
│  │ HyperCore│───▶│ spotSend │───▶│ HyperEVM │                           │
│  │ Spot     │    │ to 0x200.│    │ USDC     │                           │
│  └──────────┘    └──────────┘    └──────────┘                           │
│  Signing: User-Signed (0x66eee)                                          │
│                                                                          │
│  HYPEREVM → HYPERCORE (Internal Bridge)                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                           │
│  │ HyperEVM │───▶│ CoreDepo-│───▶│ HyperCore│                           │
│  │ USDC     │    │ sitWallet│    │ Balance  │                           │
│  └──────────┘    └──────────┘    └──────────┘                           │
│  Signing: HyperEVM transaction                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Wallet Pattern

The recommended pattern for frontend applications to avoid chain ID conflicts.

### Why Use Agent Wallets?

Browser wallets enforce chain ID matching:
- L1 Actions require chain ID 1337
- Browser connected to Arbitrum (42161) → **Conflict!**

Solution: Two-wallet pattern

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AGENT WALLET PATTERN                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐         ┌──────────────────────┐              │
│  │   Master Wallet      │         │    Agent Wallet      │              │
│  │   (Browser/wagmi)    │         │    (PrivateKeySigner)│              │
│  ├──────────────────────┤         ├──────────────────────┤              │
│  │ • approveAgent       │────────▶│ • order              │              │
│  │ • approveBuilderFee  │  signs  │ • cancel             │              │
│  │ • withdraw3          │  once   │ • modify             │              │
│  │ • usdSend            │         │ • updateLeverage     │              │
│  │ • spotSend           │         │ • All L1 Actions     │              │
│  └──────────────────────┘         └──────────────────────┘              │
│           │                                  │                           │
│           │ Chain ID: 0x66eee               │ Chain ID: 1337            │
│           │ (No network switch needed)       │ (No network needed)       │
│           │                                  │                           │
│           ▼                                  ▼                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Hyperliquid API                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Current Implementation

```typescript
// useAgentRegistration.ts - Generates and stores agent wallet
const register = async () => {
  // 1. Generate new agent keypair
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // 2. Master wallet signs approveAgent (User-Signed, 0x66eee)
  await exchangeClient.approveAgent({
    agentAddress: account.address,
    agentName,
  });

  // 3. Store agent in localStorage
  setAgent(env, address, privateKey, account.address);
};

// useSignedExchange.ts - Creates ExchangeClient with agent
const exchange = useMemo(() => {
  if (!signer) return null;
  return createExchangeClient(signer); // Agent signs all L1 actions
}, [signer]);
```

---

## Implementation Strategy

### For wagmi/viem Integration

| Signing Type | Implementation |
|--------------|----------------|
| **L1 Actions** | `PrivateKeySigner` (agent wallet, stored locally) |
| **User-Signed** | `walletClient.signTypedData()` via SDK's AbstractWallet adapter |
| **Arbitrum EVM** | `useSignTypedData()` + `useWriteContract()` from wagmi |

### Wallet Adapter Pattern

```typescript
// wallet.ts - Adapts wagmi walletClient for Hyperliquid SDK
export function toHyperliquidWallet(
  walletClient: WalletClient,
  address: `0x${string}`,
): AbstractWallet {
  return {
    address,
    signTypedData: async (params) => {
      return walletClient.signTypedData({
        account: address,
        domain: params.domain,
        types: params.types,
        primaryType: params.primaryType,
        message: params.message,
      });
    },
  };
}
```

---

## Common Pitfalls

| Issue | Cause | Solution |
|-------|-------|----------|
| "User or API Wallet does not exist" | Wrong chain ID or key ordering | Use SDK, don't manually sign |
| "Provided chainId must match" | Browser wallet chain mismatch | Use agent wallet for L1 actions |
| Signature recovery fails | Address not lowercase | SDK handles automatically |
| "Agent not approved" | Using agent before approval | Call `approveAgent` first |

### Chain ID Reference

| Purpose | Chain ID | Decimal |
|---------|----------|---------|
| L1 Actions | 1337 | 1337 |
| User-Signed | 0x66eee | 421614 |
| Arbitrum One | 42161 | 42161 |
| Arbitrum Sepolia | 421614 | 421614 |

---

## Implementation Strategy

> See [signing-architecture-proposal.md](./signing-architecture-proposal.md) for full details.

### Current State Issues

| Issue | Description |
|-------|-------------|
| **Wrong client for withdrawals** | `withdraw3`, `usdSend`, `spotSend` use agent client but need master wallet |
| **Two ExchangeClients confusion** | Context has master wallet client, `useSignedExchange` has agent client |
| **Overlapping hooks** | 6+ hooks with unclear responsibilities |
| **Naming confusion** | `useSignedExchange` returns client, not signing function |

### Proposed Module Structure

```
src/lib/hyperliquid/
├── signing/              # Agent + master wallet management
│   ├── use-agent-status.ts
│   ├── use-agent-registration.ts
│   └── use-master-wallet.ts
│
├── trading/              # L1 Actions (agent wallet)
│   ├── use-trading-client.ts
│   └── use-trading-status.ts
│
├── admin/                # User-Signed Actions (master wallet)
│   ├── use-admin-client.ts
│   ├── use-withdraw.ts        # withdraw3
│   ├── use-transfer.ts        # usdSend, spotSend
│   ├── use-usd-class-transfer.ts  # usdClassTransfer (perp↔spot)
│   ├── use-send-asset.ts      # sendAsset (DEX/sub-account transfers)
│   └── use-staking.ts         # tokenDelegate
│
└── bridge/               # Arbitrum EVM (wagmi)
    └── use-deposit.ts
```

### Hook → Signing Type → Client Mapping

| Hook | Signing Type | Client | Wallet |
|------|--------------|--------|--------|
| `useExchangeOrder` | L1 Action | Trading | Agent |
| `useExchangeCancel` | L1 Action | Trading | Agent |
| `useExchangeUpdateLeverage` | L1 Action | Trading | Agent |
| `useExchangeVaultTransfer` | L1 Action | Trading | Agent |
| `useExchangeSubAccountTransfer` | L1 Action | Trading | Agent |
| `useWithdraw` | User-Signed | Admin | **Master** |
| `useTransfer` (usdSend) | User-Signed | Admin | **Master** |
| `useTransfer` (spotSend) | User-Signed | Admin | **Master** |
| `useUsdClassTransfer` | User-Signed | Admin | **Master** |
| `useSendAsset` | User-Signed | Admin | **Master** |
| `useAgentRegistration` | User-Signed | Admin | **Master** |
| `useDeposit` | Arbitrum EVM | wagmi | **Master** |

### Key Implementation Details

#### Trading Client (Agent Wallet)
```typescript
// trading/use-trading-client.ts
export function useTradingClient() {
  const { env } = useHyperliquid();
  const { address } = useConnection();
  const { status, agentAddress } = useAgentStatus();

  const client = useMemo(() => {
    if (status !== "ready") return null;
    const agent = readAgentFromStorage(env, address);
    if (!agent) return null;
    const signer = privateKeyToAccount(agent.privateKey);
    return createExchangeClient(signer);
  }, [status, env, address]);

  return { client, isReady: client !== null };
}
```

#### Admin Client (Master Wallet)
```typescript
// admin/use-admin-client.ts
export function useAdminClient() {
  const { data: walletClient } = useWalletClient();
  const { address } = useConnection();

  const client = useMemo(() => {
    if (!walletClient || !address) return null;
    const wallet = toHyperliquidWallet(walletClient, address);
    if (!wallet) return null;
    return createExchangeClient(wallet);
  }, [walletClient, address]);

  return { client, isReady: client !== null };
}
```

#### Deposit (wagmi Direct)
```typescript
// bridge/use-deposit.ts
export function useDeposit() {
  const { chainId } = useConnection();
  const { signTypedData } = useSignTypedData();
  const { writeContract } = useWriteContract();

  const isArbitrum = chainId === ARBITRUM_CHAIN_ID;

  // ... permit signing + contract call
}
```

### Migration Checklist

- [ ] Create `signing/` module with agent status hooks
- [ ] Create `trading/` module with `useTradingClient`
- [ ] Create `admin/` module with `useAdminClient`
- [ ] Move `use-arbitrum-deposit.ts` to `bridge/use-deposit.ts`
- [ ] Update `useExchangeWithdraw3` to use admin client
- [ ] Update `useExchangeUsdSend` to use admin client
- [ ] Update `useExchangeSpotSend` to use admin client
- [ ] Update `useExchangeUsdClassTransfer` to use admin client
- [ ] Update `useExchangeSendAsset` to use admin client (if exists)
- [ ] Update exchange hooks to explicitly use trading client
- [ ] Deprecate `useSignedExchange`, `useTradingAgent`, etc.
- [ ] Update all component consumers
