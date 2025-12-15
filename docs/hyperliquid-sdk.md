# @nktkas/hyperliquid SDK Knowledge Base

> Quick reference for the Hyperliquid TypeScript SDK used in this project.

## Installation

```bash
pnpm add @nktkas/hyperliquid
```

---

## Core Concepts

### Transports

The SDK uses **transports** to communicate with Hyperliquid:

```typescript
import { HttpTransport, WebSocketTransport } from "@nktkas/hyperliquid";

// HTTP for one-off requests
const httpTransport = new HttpTransport({
  url: "https://api.hyperliquid.xyz", // mainnet
  // url: "https://api.hyperliquid-testnet.xyz", // testnet
});

// WebSocket for subscriptions
const wsTransport = new WebSocketTransport({
  url: "wss://api.hyperliquid.xyz/ws",
  reconnect: { maxAttempts: 10 },
});
```

### Three Client Types

| Client               | Purpose                               | Requires Wallet |
| -------------------- | ------------------------------------- | --------------- |
| `InfoClient`         | Market data, account info (read-only) | No              |
| `SubscriptionClient` | Real-time WebSocket updates           | No              |
| `ExchangeClient`     | Trading operations                    | Yes             |

---

## InfoClient Methods

Read-only data fetching via HTTP or WebSocket.

```typescript
import { InfoClient, HttpTransport } from "@nktkas/hyperliquid";

const info = new InfoClient({ transport: new HttpTransport() });
```

### Market Data

| Method                                                   | Parameters         | Returns                    | Description                    |
| -------------------------------------------------------- | ------------------ | -------------------------- | ------------------------------ |
| `allMids()`                                              | none               | `Record<string, string>`   | Mid prices for all assets      |
| `meta()`                                                 | none               | `MetaResponse`             | Perp metadata (asset list)     |
| `metaAndAssetCtxs()`                                     | none               | `MetaAndAssetCtxsResponse` | Meta + market context combined |
| `l2Book({ coin })`                                       | `{ coin: string }` | `L2BookResponse`           | Order book levels              |
| `candleSnapshot({ coin, interval, startTime, endTime })` | see type           | `CandleSnapshotResponse`   | Historical candles             |

### Account Data

| Method                                       | Parameters          | Returns                      | Description                     |
| -------------------------------------------- | ------------------- | ---------------------------- | ------------------------------- |
| `clearinghouseState({ user })`               | `{ user: Address }` | `ClearinghouseStateResponse` | Positions, margin, withdrawable |
| `openOrders({ user })`                       | `{ user: Address }` | `OpenOrdersResponse`         | Current open orders             |
| `userFills({ user })`                        | `{ user: Address }` | `UserFillsResponse`          | Trade history                   |
| `userFunding({ user, startTime, endTime? })` | see type            | `UserFundingResponse`        | Funding payments                |

### Example Usage

```typescript
// Get order book
const book = await info.l2Book({ coin: "ETH" });
// book.levels[0] = bids, book.levels[1] = asks

// Get user positions
const state = await info.clearinghouseState({
  user: "0x1234...",
});
// state.assetPositions contains all positions
```

---

## SubscriptionClient Methods

Real-time WebSocket updates with callback pattern.

```typescript
import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

const sub = new SubscriptionClient({
  transport: new WebSocketTransport(),
});
```

### Available Subscriptions

| Method                                 | Parameters | Event Type     | Description            |
| -------------------------------------- | ---------- | -------------- | ---------------------- |
| `allMids(callback)`                    | none       | `AllMidsEvent` | All asset mid prices   |
| `l2Book({ coin }, callback)`           | `{ coin }` | `L2BookEvent`  | Order book updates     |
| `trades({ coin }, callback)`           | `{ coin }` | `TradesEvent`  | Recent trades          |
| `candle({ coin, interval }, callback)` | see type   | `CandleEvent`  | Candle updates         |
| `user({ user }, callback)`             | `{ user }` | `UserEvent`    | Orders, fills, funding |

### Subscription Pattern

```typescript
// Subscribe
const subscription = await sub.l2Book({ coin: "ETH" }, (data) => {
  console.log("Book update:", data.levels);
});

// Later: unsubscribe
await subscription.unsubscribe();
```

---

## App WebSocket Hooks (Zustand)

This app uses a small React + Zustand layer on top of `SubscriptionClient` to:

- Keep a single underlying WebSocket subscription per channel/params (ref-counted across components)
- Write incoming events into a generic Zustand store (keyed by `method + params`)
- Read data anywhere via channel hooks or the generic hook

### Subscribe + Read (recommended)

```ts
import { useAllMidsSubscription, useL2BookSubscription, useTradesSubscription } from "@/hooks/hyperliquid";

const { data: allMids } = useAllMidsSubscription();
const { data: book } = useL2BookSubscription({ params: { coin: "ETH", nSigFigs: 5 } });
const { data: trades } = useTradesSubscription({ params: { coin: "ETH" } });
```

### Generic Hook (no custom hook needed)

```ts
import { useHyperliquidWs } from "@/hooks/hyperliquid";

const { data: assetCtxs } = useHyperliquidWs("allDexsAssetCtxs");
const { data: trades } = useHyperliquidWs("trades", { params: { coin: "ETH" } });
```

---

## ExchangeClient Methods

Trading operations - requires wallet for signing.

```typescript
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const exchange = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: privateKeyToAccount("0x..."),
});
```

### Trading Operations

| Method                                         | Parameters                     | Description            |
| ---------------------------------------------- | ------------------------------ | ---------------------- |
| `order({ orders, grouping })`                  | see type                       | Place orders           |
| `cancel({ cancels })`                          | `{ cancels: CancelRequest[] }` | Cancel orders          |
| `batchModify({ modifies })`                    | see type                       | Modify existing orders |
| `updateLeverage({ asset, isCross, leverage })` | see type                       | Change leverage        |
| `updateIsolatedMargin({ asset, isBuy, ntl })`  | see type                       | Adjust margin          |

### Order Structure

```typescript
const result = await exchange.order({
  orders: [
    {
      a: 0, // Asset index (from meta.universe)
      b: true, // true = buy, false = sell
      p: "95000", // Price as string
      s: "0.01", // Size as string
      r: false, // Reduce only
      t: {
        // Order type
        limit: { tif: "Gtc" }, // Gtc, Ioc, Alo
      },
      // Optional:
      // c: "my-cloid"   // Client order ID
    },
  ],
  grouping: "na", // "na" | "normalTpsl" | "positionTpsl"
});
```

---

## Type Exports

The SDK exports all types. Use them directly - don't redefine:

```typescript
import type {
  // Info types
  MetaResponse,
  L2BookResponse,
  ClearinghouseStateResponse,
  OpenOrdersResponse,

  // Subscription types
  AllMidsEvent,
  L2BookEvent,

  // Exchange types
  OrderRequest,
  OrderResponse,

  // Common
  Address,
} from "@nktkas/hyperliquid";
```

---

## Response Type Reference

### L2BookResponse

```typescript
{
  coin: string;
  time: number;
  levels: [
    { px: string; sz: string; n: number }[], // bids
    { px: string; sz: string; n: number }[]  // asks
  ]
}
```

### ClearinghouseStateResponse

```typescript
{
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  }
  assetPositions: Array<{
    position: {
      coin: string;
      szi: string; // Size (negative = short)
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      leverage: { type: "cross" | "isolated"; value: number };
      liquidationPx: string | null;
    };
  }>;
  withdrawable: string;
}
```

### MetaResponse

```typescript
{
  universe: Array<{
    name: string; // e.g., "ETH"
    szDecimals: number; // Size decimals
    maxLeverage: number;
    onlyIsolated: boolean;
  }>;
}
```

---

## Common Patterns

### Asset Index Lookup

The API uses asset indices, not names. Look up index from meta:

```typescript
const meta = await info.meta();
const ethIndex = meta.universe.findIndex((a) => a.name === "ETH");
// Use ethIndex for order.a parameter
```

### Price/Size Strings

API uses strings for precision. Convert carefully:

```typescript
// From API
const price = parseFloat(book.levels[0][0].px);

// To API
const orderPrice = price.toFixed(2); // or appropriate decimals
```

### Testnet vs Mainnet

```typescript
const isTestnet = import.meta.env.VITE_TESTNET === "true";

const httpTransport = new HttpTransport({
  url: isTestnet
    ? "https://api.hyperliquid-testnet.xyz"
    : "https://api.hyperliquid.xyz",
});
```

---

## Error Handling

```typescript
import { ApiRequestError } from "@nktkas/hyperliquid";

try {
  await exchange.order({ ... });
} catch (error) {
  if (error instanceof ApiRequestError) {
    console.error("API Error:", error.response);
    // error.response contains the error details
  }
}
```

---

## Links

- [NPM Package](https://www.npmjs.com/package/@nktkas/hyperliquid)
- [GitHub Repository](https://github.com/nktkas/hyperliquid)
- [Official Documentation](https://nktkas.gitbook.io/hyperliquid)
- [JSR API Reference](https://jsr.io/@nktkas/hyperliquid/doc)
- [Hyperliquid Official Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/)
