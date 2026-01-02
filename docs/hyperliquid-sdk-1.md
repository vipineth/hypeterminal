# Introduction

A TypeScript SDK for the [Hyperliquid API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api).

{% tabs %}
{% tab title="npm" %}

```sh
npm i @nktkas/hyperliquid
```

{% endtab %}

{% tab title="pnpm" %}

```sh
pnpm add @nktkas/hyperliquid
```

{% endtab %}

{% tab title="yarn" %}

```sh
yarn add @nktkas/hyperliquid
```

{% endtab %}

{% tab title="bun" %}

```sh
bun add @nktkas/hyperliquid
```

{% endtab %}

{% tab title="deno" %}

```sh
deno add jsr:@nktkas/hyperliquid
```

{% endtab %}
{% endtabs %}

<table data-view="cards"><thead><tr><th></th><th></th></tr></thead><tbody><tr><td><strong>Type Safe</strong></td><td>100% TypeScript. Full inference for 80+ methods.</td></tr><tr><td><strong>Tested</strong></td><td>Types validated against real API responses.</td></tr><tr><td><strong>Minimal</strong></td><td>Few dependencies. Tree-shakeable.</td></tr><tr><td><strong>Universal</strong></td><td>Node.js, Deno, Bun, browsers, React Native.</td></tr><tr><td><strong>Transports</strong></td><td>Native <a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API">fetch</a> and <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSocket">WebSocket</a>.</td></tr><tr><td><strong>Wallet Support</strong></td><td>Works with <a href="https://viem.sh">viem</a> and <a href="https://ethers.org">ethers</a>.</td></tr></tbody></table>

***

## Examples

### Read Data

```ts
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";

const client = new InfoClient({ transport: new HttpTransport() });

// Order book
const book = await client.l2Book({ coin: "ETH" });
//    ^? { coin: string, time: number, levels: [{ px: string, sz: string, n: number }[], ...] }

// Account state
const state = await client.clearinghouseState({ user: "0x..." });
//    ^? { marginSummary: {...}, assetPositions: [...], withdrawable: string }
```

{% hint style="info" %}
Every method has fully typed parameters and responses. No more guessing what the API returns.
{% endhint %}

### Place Orders

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const client = new ExchangeClient({
  transport: new HttpTransport(),
  wallet: privateKeyToAccount("0x..."),
});

const result = await client.order({
  orders: [{
    a: 4, // Asset index (ETH)
    b: true, // Buy side
    p: "3000", // Price
    s: "0.1", // Size
    r: false, // Reduce only
    t: { limit: { tif: "Gtc" } },
  }],
  grouping: "na",
});
// ^? { status: "ok", response: { type: "order", data: { statuses: [...] } } }
```

### Real-time Updates

```ts
import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

const client = new SubscriptionClient({ transport: new WebSocketTransport() });

await client.l2Book({ coin: "ETH" }, (book) => {
  console.log(book.coin, book.levels[0][0].px);
  //          ^? { coin: string, time: number, levels: [...] }
});
```


# Installation

Install the SDK via your package manager or a `<script>` tag.

## Package Manager

{% tabs %}
{% tab title="npm" %}

```sh
npm i @nktkas/hyperliquid
```

{% endtab %}

{% tab title="pnpm" %}

```sh
pnpm add @nktkas/hyperliquid
```

{% endtab %}

{% tab title="yarn" %}

```sh
yarn add @nktkas/hyperliquid
```

{% endtab %}

{% tab title="bun" %}

```sh
bun add @nktkas/hyperliquid
```

{% endtab %}

{% tab title="deno" %}

```sh
deno add jsr:@nktkas/hyperliquid
```

{% endtab %}
{% endtabs %}

## CDN

If you're not using a package manager, you can use the SDK via an ESM-compatible CDN such as [esm.sh](https://esm.sh/). Simply add a `<script type="module">` tag to the bottom of your HTML file with the following content:

```html
<script type="module">
  import * as hl from "https://esm.sh/jsr/@nktkas/hyperliquid";
</script>
```

## Platform Requirements

{% hint style="info" %}
Node.js Requires **Node.js 20** or higher.

Node.js 22+ includes native WebSocket support. For earlier versions, install the `ws` package if you plan to use `WebSocketTransport`:

```sh
npm install ws
```

```ts
import WebSocket from "ws";
import * as hl from "@nktkas/hyperliquid";

const transport = new hl.WebSocketTransport({
  reconnect: {
    WebSocket, // Pass WebSocket class from ws package
  },
});
```

{% endhint %}

{% hint style="info" %}
React Native React Native requires polyfills for `TextEncoder` and `EventTarget`. Install and import them before the SDK:

```sh
npm install fast-text-encoding event-target-polyfill
```

```ts
import "fast-text-encoding";
import "event-target-polyfill";
import * as hl from "@nktkas/hyperliquid";
```

{% endhint %}


# Quick Start

Get started with the SDK in just a few lines of code.

{% stepper %}
{% step %}

#### Set up Transport

First, create a [Transport](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/transports/README.md) - the layer that handles communication with Hyperliquid servers.

{% tabs %}
{% tab title="HttpTransport" %}
Use [`HttpTransport`](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/transports/README.md#httptransport) for simple requests.

```ts
import { HttpTransport } from "@nktkas/hyperliquid";

const transport = new HttpTransport();
```

{% endtab %}

{% tab title="WebSocketTransport" %}
Use [`WebSocketTransport`](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/transports/README.md#websockettransport) for subscriptions or lower latency.

```ts
import { WebSocketTransport } from "@nktkas/hyperliquid";

const transport = new WebSocketTransport();
```

{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}

#### Create a Client

Next, create a [Client](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/clients/README.md) with your transport. The SDK provides three clients for different purposes:

{% tabs %}
{% tab title="InfoClient" %}
Use [`InfoClient`](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/clients/README.md#infoclient) to query market data, account state, and other read-only information.

```ts
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";

const transport = new HttpTransport();

const client = new InfoClient({ transport });

// Get mid prices for all assets
const mids = await client.allMids();
// => { "BTC": "97000.5", "ETH": "3500.25", ... }
```

{% endtab %}

{% tab title="ExchangeClient" %}
Use [`ExchangeClient`](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/clients/README.md#exchangeclient) to place orders, transfer funds, and perform other actions that require signing.

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const transport = new HttpTransport();

const client = new ExchangeClient({
  transport,
  wallet: privateKeyToAccount("0x..."), // viem account or ethers signer
});

// Place a limit order
const result = await client.order({
  orders: [{
    a: 0, // Asset index (0 = BTC)
    b: true, // Buy side
    p: "95000", // Price
    s: "0.01", // Size
    r: false, // Not reduce-only
    t: { limit: { tif: "Gtc" } },
  }],
  grouping: "na",
});
// => { status: "ok", response: { type: "order", data: { statuses: [...] } } }
```

{% endtab %}

{% tab title="SubscriptionClient" %}
Use [`SubscriptionClient`](https://github.com/nktkas/hyperliquid/blob/main/core-concepts/clients/README.md#subscriptionclient) to subscribe to live market data via WebSocket.

```ts
import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

const transport = new WebSocketTransport();

const client = new SubscriptionClient({ transport });

// Subscribe to all mid prices
const subscription = await client.allMids((data) => {
  console.log("Price update:", data.mids);
});

// Later: unsubscribe
await subscription.unsubscribe();
```

{% endtab %}
{% endtabs %}
{% endstep %}
{% endstepper %}


# Transports

A Transport is the layer responsible for executing requests to Hyperliquid servers.

## HttpTransport

Executes requests via HTTP POST to the Hyperliquid API.

### Import

```ts
import { HttpTransport } from "@nktkas/hyperliquid";
```

### Usage

```ts
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";

const transport = new HttpTransport();
const client = new InfoClient({ transport });

const mids = await client.allMids();
```

### Parameters

#### isTestnet (optional)

* **Type:** `boolean`
* **Default:** `false`

Use testnet endpoints instead of mainnet.

```ts
const transport = new HttpTransport({
  isTestnet: true,
});
```

#### timeout (optional)

* **Type:** `number` | `null`
* **Default:** `10000`

Request timeout in milliseconds. Set to `null` to disable.

```ts
const transport = new HttpTransport({
  timeout: 30000,
});
```

#### apiUrl (optional)

* **Type:** `string` | `URL`
* **Default:** `https://api.hyperliquid.xyz` (mainnet) or `https://api.hyperliquid-testnet.xyz` (testnet)

Custom API URL for info and exchange requests.

```ts
const transport = new HttpTransport({
  apiUrl: "https://custom-api.example.com",
});
```

#### rpcUrl (optional)

* **Type:** `string` | `URL`
* **Default:** `https://rpc.hyperliquid.xyz` (mainnet) or `https://rpc.hyperliquid-testnet.xyz` (testnet)

Custom RPC URL for explorer requests (block details, transactions).

```ts
const transport = new HttpTransport({
  rpcUrl: "https://custom-rpc.example.com",
});
```

#### fetchOptions (optional)

* **Type:** [`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)

Custom options passed to the underlying [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) call.

```ts
const transport = new HttpTransport({
  fetchOptions: {
    headers: {
      "X-Custom-Header": "value",
    },
  },
});
```

## WebSocketTransport

WebSocket connection for [subscriptions](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions) and [POST requests](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/post-requests).

### Import

```ts
import { WebSocketTransport } from "@nktkas/hyperliquid";
```

### Usage

Subscription:

```ts
import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

const transport = new WebSocketTransport();
const client = new SubscriptionClient({ transport });

const subscription = await client.allMids((data) => {
  console.log(data.mids);
});
```

POST request:

```ts
import { InfoClient, WebSocketTransport } from "@nktkas/hyperliquid";

const transport = new WebSocketTransport();
const client = new InfoClient({ transport });

const mids = await client.allMids();
```

### Reconnection

When connection drops, the transport automatically reconnects with exponential backoff (max 10 seconds) and 3 attempts.

After reconnection, all active subscriptions are automatically restored if `resubscribe: true` (default).

### Parameters

#### isTestnet (optional)

* **Type:** `boolean`
* **Default:** `false`

Use testnet endpoints instead of mainnet.

```ts
const transport = new WebSocketTransport({
  isTestnet: true,
});
```

#### timeout (optional)

* **Type:** `number` | `null`
* **Default:** `10000`

Request timeout in milliseconds. Set to `null` to disable.

```ts
const transport = new WebSocketTransport({
  timeout: 30000,
});
```

#### url (optional)

* **Type:** `string` | `URL`
* **Default:** `wss://api.hyperliquid.xyz/ws` (mainnet) or `wss://api.hyperliquid-testnet.xyz/ws` (testnet)

Custom WebSocket URL.

```ts
const transport = new WebSocketTransport({
  url: "wss://custom-api.example.com/ws",
});
```

#### reconnect (optional)

* **Type:** `object`
* **Default:** `{ maxRetries: 3, connectionTimeout: 10000, reconnectionDelay: (attempt) => Math.min(~~(1 << attempt) * 150, 10000) }`

Reconnection policy. See [`ReconnectingWebSocketOptions`](https://github.com/nktkas/rews#options).

```ts
const transport = new WebSocketTransport({
  reconnect: {
    maxRetries: 10,
    reconnectionDelay: 1000, // fixed 1s delay
  },
});
```

#### resubscribe (optional)

* **Type:** `boolean`
* **Default:** `true`

Automatically restore active subscriptions after reconnection.

```ts
const transport = new WebSocketTransport({
  resubscribe: false, // handle resubscription manually
});
```


# Clients

Clients provide methods to interact with the Hyperliquid API. Each client corresponds to a specific API type.

## InfoClient

Read-only access to market data, user state, and other public information. Corresponds to the [Info endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint).

### Import

```ts
import { InfoClient } from "@nktkas/hyperliquid";
```

### Usage

```ts
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";

const transport = new HttpTransport();
const client = new InfoClient({ transport });

// Get all mid prices
const mids = await client.allMids();

// Get user's perpetual positions
const state = await client.clearinghouseState({
  user: "0x...",
});
```

### Parameters

#### transport (required)

* **Type:** [`HttpTransport`](https://nktkas.gitbook.io/hyperliquid/transports#httptransport) | [`WebSocketTransport`](https://nktkas.gitbook.io/hyperliquid/transports#websockettransport)

The transport used to send requests.

```ts
const client = new InfoClient({
  transport: new HttpTransport(),
});
```

## ExchangeClient

Execute actions: place orders, cancel orders, transfer funds, etc. Corresponds to the [Exchange endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint).

Requires a wallet for signing. The SDK handles [signing](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing) and [nonces](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets) automatically.

### Import

```ts
import { ExchangeClient } from "@nktkas/hyperliquid";
```

### Usage with viem

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount("0x...");
const transport = new HttpTransport();

const client = new ExchangeClient({ transport, wallet });

// Place a limit order
const result = await client.order({
  orders: [{
    a: 0, // asset index (BTC)
    b: true, // buy
    p: "50000", // price
    s: "0.01", // size
    r: false, // not reduce-only
    t: { limit: { tif: "Gtc" } },
  }],
  grouping: "na",
});
```

### Close a position (reduce-only)

To close an existing position, submit a reduce-only order in the opposite direction for the current position size. Use a market-style order (`FrontendMarket`) to exit quickly. Use a smaller size to close partially.

```ts
import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const transport = new HttpTransport();
const wallet = privateKeyToAccount("0x...");
const info = new InfoClient({ transport });
const exchange = new ExchangeClient({ transport, wallet });

const state = await info.clearinghouseState({ user: wallet.address });
const position = state.assetPositions.find((p) => p.position.coin === "ETH")?.position;

if (position) {
  const size = Number(position.szi);
  if (size !== 0) {
    const isLong = size > 0;
    const closeSize = Math.abs(size);

    await exchange.order({
      orders: [
        {
          a: 4, // asset index (ETH)
          b: !isLong, // opposite side
          p: "3000", // current mark price with slippage
          s: closeSize.toString(),
          r: true, // reduce-only
          t: { limit: { tif: "FrontendMarket" } },
        },
      ],
      grouping: "na",
    });
  }
}
```

### Cancel orders (one, many, or all)

Use the `cancel` action with an array of `{ a, o }` pairs (asset index and order id).

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const transport = new HttpTransport();
const wallet = privateKeyToAccount("0x...");
const exchange = new ExchangeClient({ transport, wallet });

// Cancel a single order
await exchange.cancel({
  cancels: [{ a: 4, o: 123 }], // asset index + order id
});

// Cancel multiple orders at once
await exchange.cancel({
  cancels: [
    { a: 4, o: 123 },
    { a: 4, o: 456 },
  ],
});
```

To cancel all open orders, fetch open orders and map each one to `{ a, o }` using the correct asset index for its coin.

### Usage with ethers

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { ethers } from "ethers";

const wallet = new ethers.Wallet("0x...");
const transport = new HttpTransport();

const client = new ExchangeClient({ transport, wallet });
```

### Usage with Multi-Sig

```ts
import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { privateKeyToAccount } from "viem/accounts";

const signer1 = privateKeyToAccount("0x...");
const signer2 = privateKeyToAccount("0x...");

const client = new ExchangeClient({
  transport: new HttpTransport(),
  signers: [signer1, signer2], // any number of signers
  multiSigUser: "0x...", // multi-sig account address
});
```

### Parameters

#### transport (required)

* **Type:** [`HttpTransport`](https://nktkas.gitbook.io/hyperliquid/transports#httptransport) | [`WebSocketTransport`](https://nktkas.gitbook.io/hyperliquid/transports#websockettransport)

The transport used to send requests.

#### wallet (required for single wallet)

* **Type:** `AbstractWallet`

The wallet used to sign requests. Supports:

* **viem:** [Local accounts](https://viem.sh/docs/accounts/local), [JSON-RPC accounts](https://viem.sh/docs/accounts/jsonRpc)
* **ethers:** [Wallet](https://docs.ethers.org/v6/api/wallet/), [JsonRpcSigner](https://docs.ethers.org/v6/api/providers/jsonrpc/#JsonRpcSigner)
* Any object with `address` and `signTypedData` method

#### signers (required for multi-sig)

* **Type:** `[AbstractWallet, ...AbstractWallet[]]`

Array of wallets for multi-sig signing. The first wallet is the [leader](https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/multi-sig).

#### multiSigUser (required for multi-sig)

* **Type:** `` `0x${string}` ``

The multi-signature account address.

#### signatureChainId (optional)

* **Type:** `` `0x${string}` `` | `(() => MaybePromise<`0x${string}`>)`
* **Default:** Wallet's connected chain ID

Custom chain ID for EIP-712 signing.

```ts
const client = new ExchangeClient({
  transport,
  wallet,
  signatureChainId: "0xa4b1", // Arbitrum One
});
```

#### defaultVaultAddress (optional)

* **Type:** `` `0x${string}` ``

Default vault address for vault-based operations. Can be overridden per-request.

```ts
const client = new ExchangeClient({
  transport,
  wallet,
  defaultVaultAddress: "0x...",
});

// Uses defaultVaultAddress
await client.order({ ... });

// Override for this request
await client.order({ ... }, { vaultAddress: "0x..." });
```

#### defaultExpiresAfter (optional)

* **Type:** `number` | `(() => MaybePromise<number>)`

Default expiration time in milliseconds for actions. See [Expires After](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#expires-after).

```ts
const client = new ExchangeClient({
  transport,
  wallet,
  defaultExpiresAfter: 60000, // 1 minute
});
```

#### nonceManager (optional)

* **Type:** `(address: string) => MaybePromise<number>`
* **Default:** Timestamp-based with auto-increment

Custom nonce generator. See [Hyperliquid nonces](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets#hyperliquid-nonces).

```ts
const client = new ExchangeClient({
  transport,
  wallet,
  nonceManager: async (address) => Date.now(),
});
```

## SubscriptionClient

Real-time data via WebSocket subscriptions. Corresponds to [WebSocket subscriptions](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions).

**Requires** [**`WebSocketTransport`**](https://nktkas.gitbook.io/hyperliquid/transports#websockettransport)**.**

### Import

```ts
import { SubscriptionClient } from "@nktkas/hyperliquid";
```

### Usage

```ts
import { SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

const transport = new WebSocketTransport();
const client = new SubscriptionClient({ transport });

// Subscribe to all mid prices
const subscription = await client.allMids((data) => {
  console.log(data.mids);
});

// Later: unsubscribe
await subscription.unsubscribe();
```

### Subscription Object

Each subscription returns an object with:

* `unsubscribe()` - Stop receiving updates
* `failureSignal` - [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that aborts if resubscription fails after reconnect

```ts
const subscription = await client.trades({ coin: "BTC" }, (data) => {
  console.log(data);
});

subscription.failureSignal.addEventListener("abort", (event) => {
  console.error("Subscription failed:", event.target.reason);
});
```

### Parameters

#### transport (required)

* **Type:** [`WebSocketTransport`](https://nktkas.gitbook.io/hyperliquid/transports#websockettransport)

Must be [`WebSocketTransport`](https://nktkas.gitbook.io/hyperliquid/transports#websockettransport). Does not work with [`HttpTransport`](https://nktkas.gitbook.io/hyperliquid/transports#httptransport).

```ts
const client = new SubscriptionClient({
  transport: new WebSocketTransport(),
});
```


# Error Handling

## Error Hierarchy

```
Error
├─ HyperliquidError (SDK)
│  ├─ TransportError
│  │  ├─ HttpRequestError
│  │  └─ WebSocketRequestError
│  ├─ ApiRequestError
│  └─ AbstractWalletError
└─ ValiError (valibot)
```

## HyperliquidError

Base class for all SDK errors.

```ts
import { HyperliquidError } from "@nktkas/hyperliquid";

try {
  await client.order({ ... });
} catch (error) {
  if (error instanceof HyperliquidError) {
    // Any SDK error
  }
}
```

## TransportError

Thrown when an error occurs at the transport level (network issues, timeouts).

### HttpRequestError

Thrown when an HTTP request fails.

```ts
import { HttpRequestError } from "@nktkas/hyperliquid";

try {
  await client.allMids();
} catch (error) {
  if (error instanceof HttpRequestError) {
    console.log(error.response); // Response object
    console.log(error.body); // Response body text
  }
}
```

### WebSocketRequestError

Thrown when a WebSocket request fails.

```ts
import { WebSocketRequestError } from "@nktkas/hyperliquid";

try {
  await client.allMids();
} catch (error) {
  if (error instanceof WebSocketRequestError) {
    console.log(error.message);
  }
}
```

## ApiRequestError

Thrown when the Hyperliquid API returns an error response. Contains the full response for inspection.

```ts
import { ApiRequestError } from "@nktkas/hyperliquid";

try {
  await client.order({ ... });
} catch (error) {
  if (error instanceof ApiRequestError) {
    console.log(error.message);  // Extracted error message
    console.log(error.response); // Full API response
  }
}
```

Common API errors:

* `"User or API Wallet 0x... does not exist"` - invalid signer or signature
* `"Insufficient margin to place order"` - not enough balance
* `"Price too far from oracle"` - price outside allowed range

## AbstractWalletError

Thrown when wallet operations fail (signing, getting address).

```ts
import { AbstractWalletError } from "@nktkas/hyperliquid";

try {
  await client.order({ ... });
} catch (error) {
  if (error instanceof AbstractWalletError) {
    console.log(error.message);
  }
}
```

## Validation Errors

Request parameters are validated before sending. Invalid parameters throw [`ValiError`](https://valibot.dev/api/ValiError/) from [valibot](https://valibot.dev/).

```ts
import * as v from "valibot";

try {
  await client.order({
    orders: [{
      a: -1, // invalid: must be non-negative
      // ...
    }],
    grouping: "na",
  });
} catch (error) {
  if (error instanceof v.ValiError) {
    console.log(error.issues); // Validation issues
  }
}
```

## Example: Comprehensive Error Handling

```ts
import {
  AbstractWalletError,
  ApiRequestError,
  HttpRequestError,
  HyperliquidError,
  WebSocketRequestError,
} from "@nktkas/hyperliquid";
import * as v from "valibot";

try {
  const result = await client.order({ ... });
} catch (error) {
  if (error instanceof v.ValiError) {
    // Invalid parameters (before request)
    console.error("Validation failed:", error.issues);
  } else if (error instanceof ApiRequestError) {
    // API returned an error
    console.error("API error:", error.message);
  } else if (error instanceof HttpRequestError) {
    // HTTP request failed
    console.error("HTTP error:", error.response?.status);
  } else if (error instanceof WebSocketRequestError) {
    // WebSocket request failed
    console.error("WebSocket error:", error.message);
  } else if (error instanceof AbstractWalletError) {
    // Wallet operation failed
    console.error("Wallet error:", error.message);
  } else if (error instanceof HyperliquidError) {
    // Other SDK error
    console.error("SDK error:", error.message);
  } else {
    // Unknown error
    throw error;
  }
}
```


# Info Methods


# activeAssetData

## POST /info

> Request user active asset data.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/activeAssetData","version":"1.0.0"},"tags":[{"name":"activeAssetData"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["activeAssetData"],"description":"Request user active asset data.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["activeAssetData"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","coin","user"],"description":"Request user active asset data."}}},"required":true},"responses":{"200":{"description":"User active asset data.","content":{"application/json":{"schema":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage configuration."},"maxTradeSzs":{"type":"array","items":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2,"description":"Maximum trade size range [min, max]."},"availableToTrade":{"type":"array","items":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2,"description":"Available to trade range [min, max]."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."}},"required":["user","coin","leverage","maxTradeSzs","availableToTrade","markPx"],"description":"User active asset data."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# alignedQuoteTokenInfo

## POST /info

> Request supply, rate, and pending payment information for an aligned quote token.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/alignedQuoteTokenInfo","version":"1.0.0"},"tags":[{"name":"alignedQuoteTokenInfo"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["alignedQuoteTokenInfo"],"description":"Request supply, rate, and pending payment information for an aligned quote token.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["alignedQuoteTokenInfo"]},"token":{"type":"number","minimum":0,"description":"Token index."}},"required":["type","token"],"description":"Request supply, rate, and pending payment information for an aligned quote token."}}},"required":true},"responses":{"200":{"description":"Supply, rate, and pending payment information for an aligned quote token.","content":{"application/json":{"schema":{"type":"object","properties":{"isAligned":{"type":"boolean","description":"Whether the token is aligned."},"firstAlignedTime":{"type":"number","minimum":0,"description":"Timestamp (in ms since epoch) when the token was first aligned."},"evmMintedSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total EVM minted supply."},"dailyAmountOwed":{"type":"array","items":{"type":"array","items":[{"type":"string","format":"date"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"Daily amount owed as an array of [date, amount] tuples."},"predictedRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Predicted rate."}},"required":["isAligned","firstAlignedTime","evmMintedSupply","dailyAmountOwed","predictedRate"],"description":"Supply, rate, and pending payment information for an aligned quote token."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# allMids

## POST /info

> Request mid coin prices.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/allMids","version":"1.0.0"},"tags":[{"name":"allMids"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["allMids"],"description":"Request mid coin prices.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["allMids"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type"],"description":"Request mid coin prices."}}},"required":true},"responses":{"200":{"description":"Mapping of coin symbols to mid prices.","content":{"application/json":{"schema":{"type":"object","additionalProperties":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},"description":"Mapping of coin symbols to mid prices."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# allPerpMetas

## POST /info

> Request trading metadata for all DEXes.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/allPerpMetas","version":"1.0.0"},"tags":[{"name":"allPerpMetas"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["allPerpMetas"],"description":"Request trading metadata for all DEXes.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["allPerpMetas"]}},"required":["type"],"description":"Request trading metadata for all DEXes."}}},"required":true},"responses":{"200":{"description":"Metadata for perpetual assets across all DEXes.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"name":{"type":"string","description":"Name of the universe."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"marginTableId":{"type":"number","minimum":0,"description":"Unique identifier for the margin requirements table."},"onlyIsolated":{"description":"Indicates if only isolated margin trading is allowed.","enum":[true]},"isDelisted":{"description":"Indicates if the universe is delisted.","enum":[true]},"marginMode":{"enum":["strictIsolated","noCross"],"description":"Trading margin mode constraint."},"growthMode":{"description":"Indicates if growth mode is enabled.","enum":["enabled"]},"lastGrowthModeChangeTime":{"type":"string","pattern":"^\\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\\d|0[1-9]|3[01])[T ](?:0\\d|1\\d|2[0-3])(?::[0-5]\\d){2}(?:\\.\\d{1,9})?$","description":"Timestamp of the last growth mode change."}},"required":["szDecimals","name","maxLeverage","marginTableId"]},"description":"Trading universes available for perpetual trading."},"marginTables":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"description":{"type":"string","description":"Description of the margin table."},"marginTiers":{"type":"array","items":{"type":"object","properties":{"lowerBound":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lower position size boundary for this tier."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage for this tier."}},"required":["lowerBound","maxLeverage"]},"description":"Array of margin tiers defining leverage limits."}},"required":["description","marginTiers"],"description":"Margin requirements table with multiple tiers."}],"minItems":2},"description":"Margin requirement tables for different leverage tiers."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."}},"required":["universe","marginTables","collateralToken"],"description":"Metadata for perpetual assets."},"description":"Metadata for perpetual assets across all DEXes."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# blockDetails

## POST /info

> Request block details by block height.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/blockDetails","version":"1.0.0"},"tags":[{"name":"blockDetails"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["blockDetails"],"description":"Request block details by block height.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["blockDetails"]},"height":{"type":"number","minimum":0,"description":"Block height."}},"required":["type","height"],"description":"Request block details by block height."}}},"required":true},"responses":{"200":{"description":"Response containing block information.","content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["blockDetails"]},"blockDetails":{"type":"object","properties":{"blockTime":{"type":"number","minimum":0,"description":"Block creation timestamp."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Block hash."},"height":{"type":"number","minimum":0,"description":"Block height in chain."},"numTxs":{"type":"number","minimum":0,"description":"Total transactions in block."},"proposer":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Block proposer address."},"txs":{"type":"array","items":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"type":"string","description":"Action type."}},"required":["type"],"description":"Action performed in transaction."},"block":{"type":"number","minimum":0,"description":"Block number where transaction was included."},"error":{"anyOf":[{"type":"string","nullable":true}],"description":"Error message if transaction failed."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."},"time":{"type":"number","minimum":0,"description":"Transaction creation timestamp."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Creator's address."}},"required":["action","block","error","hash","time","user"],"description":"Explorer transaction."},"description":"Array of transactions in the block."}},"required":["blockTime","hash","height","numTxs","proposer","txs"],"description":"The details of a block."}},"required":["type","blockDetails"],"description":"Response containing block information."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# candleSnapshot

## POST /info

> Request candlestick snapshots.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/candleSnapshot","version":"1.0.0"},"tags":[{"name":"candleSnapshot"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["candleSnapshot"],"description":"Request candlestick snapshots.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["candleSnapshot"]},"req":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"interval":{"enum":["1m","3m","5m","15m","30m","1h","2h","4h","8h","12h","1d","3d","1w","1M"],"description":"Time interval."},"startTime":{"type":"number","minimum":0,"description":"Start time (in ms since epoch)."},"endTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"End time (in ms since epoch)."}},"required":["coin","interval","startTime"],"description":"Request parameters."}},"required":["type","req"],"description":"Request candlestick snapshots."}}},"required":true},"responses":{"200":{"description":"Array of candlestick data points.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"t":{"type":"number","minimum":0,"description":"Opening timestamp (ms since epoch)."},"T":{"type":"number","minimum":0,"description":"Closing timestamp (ms since epoch)."},"s":{"type":"string","description":"Asset symbol."},"i":{"enum":["1m","3m","5m","15m","30m","1h","2h","4h","8h","12h","1d","3d","1w","1M"],"description":"Time interval."},"o":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Opening price."},"c":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Closing price."},"h":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Highest price."},"l":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lowest price."},"v":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total volume traded in base currency."},"n":{"type":"number","minimum":0,"description":"Number of trades executed."}},"required":["t","T","s","i","o","c","h","l","v","n"]},"description":"Array of candlestick data points."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# clearinghouseState

## POST /info

> Request clearinghouse state.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/clearinghouseState","version":"1.0.0"},"tags":[{"name":"clearinghouseState"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["clearinghouseState"],"description":"Request clearinghouse state.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["clearinghouseState"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Request clearinghouse state."}}},"required":true},"responses":{"200":{"description":"Account summary for perpetual trading.","content":{"application/json":{"schema":{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Account summary for perpetual trading."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# delegations

## POST /info

> Request user staking delegations.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/delegations","version":"1.0.0"},"tags":[{"name":"delegations"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["delegations"],"description":"Request user staking delegations.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["delegations"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user staking delegations."}}},"required":true},"responses":{"200":{"description":"Array of user's delegations to validators.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"validator":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Validator address."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of tokens delegated to the validator."},"lockedUntilTimestamp":{"type":"number","minimum":0,"description":"Locked until timestamp (in ms since epoch)."}},"required":["validator","amount","lockedUntilTimestamp"]},"description":"Array of user's delegations to validators."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# delegatorHistory

## POST /info

> Request user staking history.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/delegatorHistory","version":"1.0.0"},"tags":[{"name":"delegatorHistory"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["delegatorHistory"],"description":"Request user staking history.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["delegatorHistory"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user staking history."}}},"required":true},"responses":{"200":{"description":"Array of records of staking events by a delegator.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Timestamp of the delegation event (in ms since epoch)."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash of the delegation event."},"delta":{"anyOf":[{"type":"object","properties":{"delegate":{"type":"object","properties":{"validator":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the validator receiving or losing delegation."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of tokens being delegated or undelegated."},"isUndelegate":{"type":"boolean","description":"Whether this is an undelegation operation."}},"required":["validator","amount","isUndelegate"],"description":"Delegation operation details."}},"required":["delegate"]},{"type":"object","properties":{"cDeposit":{"type":"object","properties":{"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of tokens being deposited."}},"required":["amount"],"description":"Deposit details."}},"required":["cDeposit"]},{"type":"object","properties":{"withdrawal":{"type":"object","properties":{"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of tokens being withdrawn."},"phase":{"enum":["initiated","finalized"],"description":"Phase of the withdrawal process."}},"required":["amount","phase"],"description":"Withdrawal details."}},"required":["withdrawal"]}],"description":"Details of the update."}},"required":["time","hash","delta"]},"description":"Array of records of staking events by a delegator."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# delegatorRewards

## POST /info

> Request user staking rewards.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/delegatorRewards","version":"1.0.0"},"tags":[{"name":"delegatorRewards"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["delegatorRewards"],"description":"Request user staking rewards.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["delegatorRewards"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user staking rewards."}}},"required":true},"responses":{"200":{"description":"Array of rewards received from staking activities.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Timestamp when the reward was received (in ms since epoch)."},"source":{"enum":["delegation","commission"],"description":"Source of the reward."},"totalAmount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total reward amount."}},"required":["time","source","totalAmount"]},"description":"Array of rewards received from staking activities."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# delegatorSummary

## POST /info

> Request user's staking summary.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/delegatorSummary","version":"1.0.0"},"tags":[{"name":"delegatorSummary"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["delegatorSummary"],"description":"Request user's staking summary.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["delegatorSummary"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user's staking summary."}}},"required":true},"responses":{"200":{"description":"User's staking summary.","content":{"application/json":{"schema":{"type":"object","properties":{"delegated":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total amount of delegated tokens."},"undelegated":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total amount of undelegated tokens."},"totalPendingWithdrawal":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total amount of tokens pending withdrawal."},"nPendingWithdrawals":{"type":"number","minimum":0,"description":"Number of pending withdrawals."}},"required":["delegated","undelegated","totalPendingWithdrawal","nPendingWithdrawals"],"description":"User's staking summary."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# exchangeStatus

## POST /info

> Request exchange system status information.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/exchangeStatus","version":"1.0.0"},"tags":[{"name":"exchangeStatus"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["exchangeStatus"],"description":"Request exchange system status information.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["exchangeStatus"]}},"required":["type"],"description":"Request exchange system status information."}}},"required":true},"responses":{"200":{"description":"Exchange system status information.","content":{"application/json":{"schema":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Server time (in ms since epoch)."},"specialStatuses":{"anyOf":[{"nullable":true}],"description":"Special statuses of the exchange system."}},"required":["time","specialStatuses"],"description":"Exchange system status information."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# extraAgents

## POST /info

> Request user extra agents.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/extraAgents","version":"1.0.0"},"tags":[{"name":"extraAgents"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["extraAgents"],"description":"Request user extra agents.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["extraAgents"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user extra agents."}}},"required":true},"responses":{"200":{"description":"Array of extra agent details for a user.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Extra agent address."},"name":{"type":"string","minLength":1,"description":"Extra agent name."},"validUntil":{"type":"number","minimum":0,"description":"Validity period as a timestamp (in ms since epoch)."}},"required":["address","name","validUntil"]},"description":"Array of extra agent details for a user."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# frontendOpenOrders

## POST /info

> Request frontend open orders.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/frontendOpenOrders","version":"1.0.0"},"tags":[{"name":"frontendOpenOrders"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["frontendOpenOrders"],"description":"Request frontend open orders.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["frontendOpenOrders"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Request frontend open orders."}}},"required":true},"responses":{"200":{"description":"Array of open orders with additional display information.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"description":"Array of open orders with additional display information."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# fundingHistory

## POST /info

> Request funding history.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/fundingHistory","version":"1.0.0"},"tags":[{"name":"fundingHistory"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["fundingHistory"],"description":"Request funding history.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["fundingHistory"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"startTime":{"type":"number","minimum":0,"description":"Start time (in ms since epoch)."},"endTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"End time (in ms since epoch)."}},"required":["type","coin","startTime"],"description":"Request funding history."}}},"required":true},"responses":{"200":{"description":"Array of historical funding rate records for an asset.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"fundingRate":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"premium":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Premium price."},"time":{"type":"number","minimum":0,"description":"Funding record timestamp (ms since epoch)."}},"required":["coin","fundingRate","premium","time"]},"description":"Array of historical funding rate records for an asset."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# gossipRootIps

## POST /info

> Request gossip root IPs.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/gossipRootIps","version":"1.0.0"},"tags":[{"name":"gossipRootIps"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["gossipRootIps"],"description":"Request gossip root IPs.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["gossipRootIps"]}},"required":["type"],"description":"Request gossip root IPs."}}},"required":true},"responses":{"200":{"description":"Array of gossip root IPs.","content":{"application/json":{"schema":{"type":"array","items":{"type":"string","format":"ipv4"},"description":"Array of gossip root IPs."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# historicalOrders

## POST /info

> Request user historical orders.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/historicalOrders","version":"1.0.0"},"tags":[{"name":"historicalOrders"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["historicalOrders"],"description":"Request user historical orders.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["historicalOrders"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user historical orders."}}},"required":true},"responses":{"200":{"description":"Array of frontend orders with current processing status.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"order":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"status":{"enum":["open","filled","canceled","triggered","rejected","marginCanceled","vaultWithdrawalCanceled","openInterestCapCanceled","selfTradeCanceled","reduceOnlyCanceled","siblingFilledCanceled","delistedCanceled","liquidatedCanceled","scheduledCancel","tickRejected","minTradeNtlRejected","perpMarginRejected","reduceOnlyRejected","badAloPxRejected","iocCancelRejected","badTriggerPxRejected","marketOrderNoLiquidityRejected","positionIncreaseAtOpenInterestCapRejected","positionFlipAtOpenInterestCapRejected","tooAggressiveAtOpenInterestCapRejected","openInterestIncreaseRejected","insufficientSpotBalanceRejected","oracleRejected","perpMaxPositionRejected"],"description":"Order processing status.\n- `\"open\"`: Order active and waiting to be filled.\n- `\"filled\"`: Order fully executed.\n- `\"canceled\"`: Order canceled by the user.\n- `\"triggered\"`: Order triggered and awaiting execution.\n- `\"rejected\"`: Order rejected by the system.\n- `\"marginCanceled\"`: Order canceled due to insufficient margin.\n- `\"vaultWithdrawalCanceled\"`: Canceled due to a user withdrawal from vault.\n- `\"openInterestCapCanceled\"`: Canceled due to order being too aggressive when open interest was at cap.\n- `\"selfTradeCanceled\"`: Canceled due to self-trade prevention.\n- `\"reduceOnlyCanceled\"`: Canceled reduced-only order that does not reduce position.\n- `\"siblingFilledCanceled\"`: Canceled due to sibling ordering being filled.\n- `\"delistedCanceled\"`: Canceled due to asset delisting.\n- `\"liquidatedCanceled\"`: Canceled due to liquidation.\n- `\"scheduledCancel\"`: Canceled due to exceeding scheduled cancel deadline (dead man's switch).\n- `\"tickRejected\"`: Rejected due to invalid tick price.\n- `\"minTradeNtlRejected\"`: Rejected due to order notional below minimum.\n- `\"perpMarginRejected\"`: Rejected due to insufficient margin.\n- `\"reduceOnlyRejected\"`: Rejected due to reduce only.\n- `\"badAloPxRejected\"`: Rejected due to post-only immediate match.\n- `\"iocCancelRejected\"`: Rejected due to IOC not able to match.\n- `\"badTriggerPxRejected\"`: Rejected due to invalid TP/SL price.\n- `\"marketOrderNoLiquidityRejected\"`: Rejected due to lack of liquidity for market order.\n- `\"positionIncreaseAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"positionFlipAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"tooAggressiveAtOpenInterestCapRejected\"`: Rejected due to price too aggressive at open interest cap.\n- `\"openInterestIncreaseRejected\"`: Rejected due to open interest cap.\n- `\"insufficientSpotBalanceRejected\"`: Rejected due to insufficient spot balance.\n- `\"oracleRejected\"`: Rejected due to price too far from oracle.\n- `\"perpMaxPositionRejected\"`: Rejected due to exceeding margin tier limit at current leverage."},"statusTimestamp":{"type":"number","minimum":0,"description":"Timestamp when the status was last updated (in ms since epoch)."}},"required":["order","status","statusTimestamp"]},"description":"Array of frontend orders with current processing status."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# isVip

## POST /info

> Request to check if a user is a VIP.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/isVip","version":"1.0.0"},"tags":[{"name":"isVip"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["isVip"],"description":"Request to check if a user is a VIP.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["isVip"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request to check if a user is a VIP."}}},"required":true},"responses":{"200":{"description":"Boolean indicating user's VIP status.","content":{"application/json":{"schema":{"anyOf":[{"type":"boolean","nullable":true}],"description":"Boolean indicating user's VIP status."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# l2Book

## POST /info

> Request L2 order book.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/l2Book","version":"1.0.0"},"tags":[{"name":"l2Book"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["l2Book"],"description":"Request L2 order book.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["l2Book"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"nSigFigs":{"anyOf":[{"enum":[2,3,4,5],"nullable":true}],"description":"Number of significant figures."},"mantissa":{"anyOf":[{"enum":[2,5],"nullable":true}],"description":"Mantissa for aggregation (if `nSigFigs` is 5)."}},"required":["type","coin"],"description":"Request L2 order book."}}},"required":true},"responses":{"200":{"description":"L2 order book snapshot or `null` if the market does not exist.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"time":{"type":"number","minimum":0,"description":"Timestamp of the snapshot (in ms since epoch)."},"levels":{"type":"array","items":[{"type":"array","items":{"type":"object","properties":{"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size."},"n":{"type":"number","minimum":0,"description":"Number of individual orders."}},"required":["px","sz","n"],"description":"L2 order book level."}},{"type":"array","items":{"type":"object","properties":{"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size."},"n":{"type":"number","minimum":0,"description":"Number of individual orders."}},"required":["px","sz","n"],"description":"L2 order book level."}}],"minItems":2,"description":"Bid and ask levels (index 0 = bids, index 1 = asks)."}},"required":["coin","time","levels"],"nullable":true}],"description":"L2 order book snapshot or `null` if the market does not exist."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# leadingVaults

## POST /info

> Request leading vaults for a user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/leadingVaults","version":"1.0.0"},"tags":[{"name":"leadingVaults"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["leadingVaults"],"description":"Request leading vaults for a user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["leadingVaults"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request leading vaults for a user."}}},"required":true},"responses":{"200":{"description":"Array of leading vaults for a user.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"name":{"type":"string","description":"Vault name."}},"required":["address","name"]},"description":"Array of leading vaults for a user."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# legalCheck

## POST /info

> Request legal verification status of a user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/legalCheck","version":"1.0.0"},"tags":[{"name":"legalCheck"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["legalCheck"],"description":"Request legal verification status of a user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["legalCheck"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request legal verification status of a user."}}},"required":true},"responses":{"200":{"description":"Legal verification status for a user.","content":{"application/json":{"schema":{"type":"object","properties":{"ipAllowed":{"type":"boolean","description":"Whether the user IP address is allowed."},"acceptedTerms":{"type":"boolean","description":"Whether the user has accepted the terms of service."},"userAllowed":{"type":"boolean","description":"Whether the user is allowed to use the platform."}},"required":["ipAllowed","acceptedTerms","userAllowed"],"description":"Legal verification status for a user."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# liquidatable

## POST /info

> Request liquidatable.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/liquidatable","version":"1.0.0"},"tags":[{"name":"liquidatable"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["liquidatable"],"description":"Request liquidatable.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["liquidatable"]}},"required":["type"],"description":"Request liquidatable."}}},"required":true},"responses":{"200":{"description":"Response for liquidatable request.","content":{"application/json":{"schema":{"type":"array","items":{},"description":"Response for liquidatable request."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# marginTable

## POST /info

> Request margin table data.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/marginTable","version":"1.0.0"},"tags":[{"name":"marginTable"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["marginTable"],"description":"Request margin table data.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["marginTable"]},"id":{"type":"number","minimum":0,"description":"Margin requirements table."}},"required":["type","id"],"description":"Request margin table data."}}},"required":true},"responses":{"200":{"description":"Margin requirements table with multiple tiers.","content":{"application/json":{"schema":{"type":"object","properties":{"description":{"type":"string","description":"Description of the margin table."},"marginTiers":{"type":"array","items":{"type":"object","properties":{"lowerBound":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lower position size boundary for this tier."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage for this tier."}},"required":["lowerBound","maxLeverage"]},"description":"Array of margin tiers defining leverage limits."}},"required":["description","marginTiers"],"description":"Margin requirements table with multiple tiers."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# maxBuilderFee

## POST /info

> Request builder fee approval.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/maxBuilderFee","version":"1.0.0"},"tags":[{"name":"maxBuilderFee"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["maxBuilderFee"],"description":"Request builder fee approval.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["maxBuilderFee"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"builder":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Builder address."}},"required":["type","user","builder"],"description":"Request builder fee approval."}}},"required":true},"responses":{"200":{"description":"Maximum builder fee approval.","content":{"application/json":{"schema":{"type":"number","description":"Maximum builder fee approval."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# maxMarketOrderNtls

## POST /info

> Request maximum market order notionals.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/maxMarketOrderNtls","version":"1.0.0"},"tags":[{"name":"maxMarketOrderNtls"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["maxMarketOrderNtls"],"description":"Request maximum market order notionals.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["maxMarketOrderNtls"]}},"required":["type"],"description":"Request maximum market order notionals."}}},"required":true},"responses":{"200":{"description":"Array of tuples containing maximum market order notionals and their corresponding asset symbols.","content":{"application/json":{"schema":{"type":"array","items":{"type":"array","items":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"},{"type":"string"}],"minItems":2},"description":"Array of tuples containing maximum market order notionals and their corresponding asset symbols."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# meta

## POST /info

> Request trading metadata.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/meta","version":"1.0.0"},"tags":[{"name":"meta"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["meta"],"description":"Request trading metadata.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["meta"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type"],"description":"Request trading metadata."}}},"required":true},"responses":{"200":{"description":"Metadata for perpetual assets.","content":{"application/json":{"schema":{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"name":{"type":"string","description":"Name of the universe."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"marginTableId":{"type":"number","minimum":0,"description":"Unique identifier for the margin requirements table."},"onlyIsolated":{"description":"Indicates if only isolated margin trading is allowed.","enum":[true]},"isDelisted":{"description":"Indicates if the universe is delisted.","enum":[true]},"marginMode":{"enum":["strictIsolated","noCross"],"description":"Trading margin mode constraint."},"growthMode":{"description":"Indicates if growth mode is enabled.","enum":["enabled"]},"lastGrowthModeChangeTime":{"type":"string","pattern":"^\\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\\d|0[1-9]|3[01])[T ](?:0\\d|1\\d|2[0-3])(?::[0-5]\\d){2}(?:\\.\\d{1,9})?$","description":"Timestamp of the last growth mode change."}},"required":["szDecimals","name","maxLeverage","marginTableId"]},"description":"Trading universes available for perpetual trading."},"marginTables":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"description":{"type":"string","description":"Description of the margin table."},"marginTiers":{"type":"array","items":{"type":"object","properties":{"lowerBound":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lower position size boundary for this tier."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage for this tier."}},"required":["lowerBound","maxLeverage"]},"description":"Array of margin tiers defining leverage limits."}},"required":["description","marginTiers"],"description":"Margin requirements table with multiple tiers."}],"minItems":2},"description":"Margin requirement tables for different leverage tiers."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."}},"required":["universe","marginTables","collateralToken"],"description":"Metadata for perpetual assets."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# metaAndAssetCtxs

## POST /info

> Request metadata and asset contexts.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/metaAndAssetCtxs","version":"1.0.0"},"tags":[{"name":"metaAndAssetCtxs"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["metaAndAssetCtxs"],"description":"Request metadata and asset contexts.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["metaAndAssetCtxs"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type"],"description":"Request metadata and asset contexts."}}},"required":true},"responses":{"200":{"description":"Tuple containing metadata and array of asset contexts.","content":{"application/json":{"schema":{"type":"array","items":[{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"name":{"type":"string","description":"Name of the universe."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"marginTableId":{"type":"number","minimum":0,"description":"Unique identifier for the margin requirements table."},"onlyIsolated":{"description":"Indicates if only isolated margin trading is allowed.","enum":[true]},"isDelisted":{"description":"Indicates if the universe is delisted.","enum":[true]},"marginMode":{"enum":["strictIsolated","noCross"],"description":"Trading margin mode constraint."},"growthMode":{"description":"Indicates if growth mode is enabled.","enum":["enabled"]},"lastGrowthModeChangeTime":{"type":"string","pattern":"^\\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\\d|0[1-9]|3[01])[T ](?:0\\d|1\\d|2[0-3])(?::[0-5]\\d){2}(?:\\.\\d{1,9})?$","description":"Timestamp of the last growth mode change."}},"required":["szDecimals","name","maxLeverage","marginTableId"]},"description":"Trading universes available for perpetual trading."},"marginTables":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"description":{"type":"string","description":"Description of the margin table."},"marginTiers":{"type":"array","items":{"type":"object","properties":{"lowerBound":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lower position size boundary for this tier."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage for this tier."}},"required":["lowerBound","maxLeverage"]},"description":"Array of margin tiers defining leverage limits."}},"required":["description","marginTiers"],"description":"Margin requirements table with multiple tiers."}],"minItems":2},"description":"Margin requirement tables for different leverage tiers."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."}},"required":["universe","marginTables","collateralToken"],"description":"Metadata for perpetual assets."},{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"funding":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"openInterest":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest."},"premium":{"anyOf":[{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Premium price."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Oracle price."},"impactPxs":{"anyOf":[{"type":"array","items":{"type":"string"},"nullable":true}],"description":"Array of impact prices."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","funding","openInterest","premium","oraclePx","impactPxs","dayBaseVlm"],"description":"Perpetual asset context."}}],"minItems":2,"description":"Tuple containing metadata and array of asset contexts."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# openOrders

## POST /info

> Request open orders.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/openOrders","version":"1.0.0"},"tags":[{"name":"openOrders"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["openOrders"],"description":"Request open orders.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["openOrders"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Request open orders."}}},"required":true},"responses":{"200":{"description":"Array of open orders.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."},"reduceOnly":{"description":"Indicates if the order is reduce-only.","enum":[true]}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz"],"description":"Open order."},"description":"Array of open orders."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# orderStatus

## POST /info

> Request order status.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/orderStatus","version":"1.0.0"},"tags":[{"name":"orderStatus"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["orderStatus"],"description":"Request order status.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["orderStatus"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"oid":{"anyOf":[{"type":"number","minimum":0},{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34}],"description":"Order ID or Client Order ID."}},"required":["type","user","oid"],"description":"Request order status."}}},"required":true},"responses":{"200":{"description":"Order status response.\n- If the order is found, returns detailed order information and its current status.\n- If the order is not found, returns a status of \"unknownOid\".","content":{"application/json":{"schema":{"oneOf":[{"type":"object","properties":{"status":{"description":"Indicates that the order was found.","enum":["order"]},"order":{"type":"object","properties":{"order":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"status":{"enum":["open","filled","canceled","triggered","rejected","marginCanceled","vaultWithdrawalCanceled","openInterestCapCanceled","selfTradeCanceled","reduceOnlyCanceled","siblingFilledCanceled","delistedCanceled","liquidatedCanceled","scheduledCancel","tickRejected","minTradeNtlRejected","perpMarginRejected","reduceOnlyRejected","badAloPxRejected","iocCancelRejected","badTriggerPxRejected","marketOrderNoLiquidityRejected","positionIncreaseAtOpenInterestCapRejected","positionFlipAtOpenInterestCapRejected","tooAggressiveAtOpenInterestCapRejected","openInterestIncreaseRejected","insufficientSpotBalanceRejected","oracleRejected","perpMaxPositionRejected"],"description":"Order processing status.\n- `\"open\"`: Order active and waiting to be filled.\n- `\"filled\"`: Order fully executed.\n- `\"canceled\"`: Order canceled by the user.\n- `\"triggered\"`: Order triggered and awaiting execution.\n- `\"rejected\"`: Order rejected by the system.\n- `\"marginCanceled\"`: Order canceled due to insufficient margin.\n- `\"vaultWithdrawalCanceled\"`: Canceled due to a user withdrawal from vault.\n- `\"openInterestCapCanceled\"`: Canceled due to order being too aggressive when open interest was at cap.\n- `\"selfTradeCanceled\"`: Canceled due to self-trade prevention.\n- `\"reduceOnlyCanceled\"`: Canceled reduced-only order that does not reduce position.\n- `\"siblingFilledCanceled\"`: Canceled due to sibling ordering being filled.\n- `\"delistedCanceled\"`: Canceled due to asset delisting.\n- `\"liquidatedCanceled\"`: Canceled due to liquidation.\n- `\"scheduledCancel\"`: Canceled due to exceeding scheduled cancel deadline (dead man's switch).\n- `\"tickRejected\"`: Rejected due to invalid tick price.\n- `\"minTradeNtlRejected\"`: Rejected due to order notional below minimum.\n- `\"perpMarginRejected\"`: Rejected due to insufficient margin.\n- `\"reduceOnlyRejected\"`: Rejected due to reduce only.\n- `\"badAloPxRejected\"`: Rejected due to post-only immediate match.\n- `\"iocCancelRejected\"`: Rejected due to IOC not able to match.\n- `\"badTriggerPxRejected\"`: Rejected due to invalid TP/SL price.\n- `\"marketOrderNoLiquidityRejected\"`: Rejected due to lack of liquidity for market order.\n- `\"positionIncreaseAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"positionFlipAtOpenInterestCapRejected\"`: Rejected due to open interest cap.\n- `\"tooAggressiveAtOpenInterestCapRejected\"`: Rejected due to price too aggressive at open interest cap.\n- `\"openInterestIncreaseRejected\"`: Rejected due to open interest cap.\n- `\"insufficientSpotBalanceRejected\"`: Rejected due to insufficient spot balance.\n- `\"oracleRejected\"`: Rejected due to price too far from oracle.\n- `\"perpMaxPositionRejected\"`: Rejected due to exceeding margin tier limit at current leverage."},"statusTimestamp":{"type":"number","minimum":0,"description":"Timestamp when the status was last updated (in ms since epoch)."}},"required":["order","status","statusTimestamp"],"description":"Order status details."}},"required":["status","order"]},{"type":"object","properties":{"status":{"description":"Indicates that the order was not found.","enum":["unknownOid"]}},"required":["status"]}],"description":"Order status response.\n- If the order is found, returns detailed order information and its current status.\n- If the order is not found, returns a status of \"unknownOid\"."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# perpDeployAuctionStatus

## POST /info

> Request for the status of the perpetual deploy auction.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/perpDeployAuctionStatus","version":"1.0.0"},"tags":[{"name":"perpDeployAuctionStatus"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["perpDeployAuctionStatus"],"description":"Request for the status of the perpetual deploy auction.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["perpDeployAuctionStatus"]}},"required":["type"],"description":"Request for the status of the perpetual deploy auction."}}},"required":true},"responses":{"200":{"description":"Status of the perpetual deploy auction.","content":{"application/json":{"schema":{"type":"object","properties":{"currentGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Current gas."},"durationSeconds":{"type":"number","minimum":0,"description":"Duration in seconds."},"endGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Ending gas."},"startGas":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Starting gas."},"startTimeSeconds":{"type":"number","minimum":0,"description":"Auction start time (seconds since epoch)."}},"required":["currentGas","durationSeconds","endGas","startGas","startTimeSeconds"],"description":"Status of the perpetual deploy auction."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# perpDexLimits

## POST /info

> Request builder deployed perpetual market limits.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/perpDexLimits","version":"1.0.0"},"tags":[{"name":"perpDexLimits"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["perpDexLimits"],"description":"Request builder deployed perpetual market limits.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["perpDexLimits"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","dex"],"description":"Request builder deployed perpetual market limits."}}},"required":true},"responses":{"200":{"description":"Builder deployed perpetual market limits.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"totalOiCap":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest cap."},"oiSzCapPerPerp":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Open interest size cap per perpetual."},"maxTransferNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maximum transfer notional amount."},"coinToOiCap":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"Coin to open interest cap mapping."}},"required":["totalOiCap","oiSzCapPerPerp","maxTransferNtl","coinToOiCap"],"nullable":true}],"description":"Builder deployed perpetual market limits."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# perpDexStatus

## POST /info

> Request perp DEX status.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/perpDexStatus","version":"1.0.0"},"tags":[{"name":"perpDexStatus"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["perpDexStatus"],"description":"Request perp DEX status.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["perpDexStatus"]},"dex":{"type":"string","description":"Perp dex name of builder-deployed dex market. The empty string represents the first perp dex."}},"required":["type","dex"],"description":"Request perp DEX status."}}},"required":true},"responses":{"200":{"description":"Status of a perp DEX.","content":{"application/json":{"schema":{"type":"object","properties":{"totalNetDeposit":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total net deposit."}},"required":["totalNetDeposit"],"description":"Status of a perp DEX."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# perpDexs

## POST /info

> Request all perpetual dexs.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/perpDexs","version":"1.0.0"},"tags":[{"name":"perpDexs"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["perpDexs"],"description":"Request all perpetual dexs.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["perpDexs"]}},"required":["type"],"description":"Request all perpetual dexs."}}},"required":true},"responses":{"200":{"description":"Array of perpetual dexes (null is main dex).","content":{"application/json":{"schema":{"type":"array","items":{"anyOf":[{"type":"object","properties":{"name":{"type":"string","description":"Short name of the perpetual dex."},"fullName":{"type":"string","description":"Complete name of the perpetual dex."},"deployer":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Hex address of the dex deployer."},"oracleUpdater":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Hex address of the oracle updater, or null if not available."},"feeRecipient":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Hex address of the fee recipient, or null if not available."},"assetToStreamingOiCap":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string"}],"minItems":2},"description":"Mapping of asset names to their streaming open interest caps."},"subDeployers":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42}}],"minItems":2},"description":"List of delegated function names and their authorized executor addresses."},"deployerFeeScale":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee scale applied to deployer fees."},"lastDeployerFeeScaleChangeTime":{"type":"string","pattern":"^\\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\\d|0[1-9]|3[01])[T ](?:0\\d|1\\d|2[0-3])(?::[0-5]\\d){2}(?:\\.\\d{1,9})?$","description":"ISO 8601 timestamp (without timezone) of the last deployer fee scale change."},"assetToFundingMultiplier":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string"}],"minItems":2},"description":"Array of tuples mapping asset names to their funding multipliers."}},"required":["name","fullName","deployer","oracleUpdater","feeRecipient","assetToStreamingOiCap","subDeployers","deployerFeeScale","lastDeployerFeeScaleChangeTime","assetToFundingMultiplier"],"description":" Perpetual dex metadata.","nullable":true}]},"description":"Array of perpetual dexes (null is main dex)."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# perpsAtOpenInterestCap

## POST /info

> Request perpetuals at open interest cap.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/perpsAtOpenInterestCap","version":"1.0.0"},"tags":[{"name":"perpsAtOpenInterestCap"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["perpsAtOpenInterestCap"],"description":"Request perpetuals at open interest cap.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["perpsAtOpenInterestCap"]},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type"],"description":"Request perpetuals at open interest cap."}}},"required":true},"responses":{"200":{"description":"Array of perpetuals at open interest caps.","content":{"application/json":{"schema":{"type":"array","items":{"type":"string"},"description":"Array of perpetuals at open interest caps."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# portfolio

## POST /info

> Request user portfolio.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/portfolio","version":"1.0.0"},"tags":[{"name":"portfolio"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["portfolio"],"description":"Request user portfolio.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["portfolio"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user portfolio."}}},"required":true},"responses":{"200":{"description":"Portfolio metrics grouped by time periods.","content":{"application/json":{"schema":{"type":"array","items":[{"type":"array","items":[{"enum":["day"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["week"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["month"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["allTime"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpDay"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpWeek"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpMonth"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpAllTime"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2}],"minItems":8,"description":"Portfolio metrics grouped by time periods."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# preTransferCheck

## POST /info

> Request user existence check before transfer.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/preTransferCheck","version":"1.0.0"},"tags":[{"name":"preTransferCheck"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["preTransferCheck"],"description":"Request user existence check before transfer.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["preTransferCheck"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"source":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Source address."}},"required":["type","user","source"],"description":"Request user existence check before transfer."}}},"required":true},"responses":{"200":{"description":"Pre-transfer user existence check result.","content":{"application/json":{"schema":{"type":"object","properties":{"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Activation fee."},"isSanctioned":{"type":"boolean","description":"Whether the user is sanctioned."},"userExists":{"type":"boolean","description":"Whether the user exists."},"userHasSentTx":{"type":"boolean","description":"Whether the user has sent a transaction."}},"required":["fee","isSanctioned","userExists","userHasSentTx"],"description":"Pre-transfer user existence check result."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# predictedFundings

## POST /info

> Request predicted funding rates.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/predictedFundings","version":"1.0.0"},"tags":[{"name":"predictedFundings"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["predictedFundings"],"description":"Request predicted funding rates.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["predictedFundings"]}},"required":["type"],"description":"Request predicted funding rates."}}},"required":true},"responses":{"200":{"description":"Array of tuples of asset symbols and their predicted funding data.","content":{"application/json":{"schema":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"array","items":{"type":"array","items":[{"type":"string"},{"anyOf":[{"type":"object","properties":{"fundingRate":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Predicted funding rate."},"nextFundingTime":{"type":"number","minimum":0,"description":"Next funding time (ms since epoch)."},"fundingIntervalHours":{"type":"number","minimum":0,"description":"Funding interval in hours."}},"required":["fundingRate","nextFundingTime"],"nullable":true}]}],"minItems":2}}],"minItems":2},"description":"Array of tuples of asset symbols and their predicted funding data."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# recentTrades

## POST /info

> Request recent trades.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/recentTrades","version":"1.0.0"},"tags":[{"name":"recentTrades"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["recentTrades"],"description":"Request recent trades.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["recentTrades"]},"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."}},"required":["type","coin"],"description":"Request recent trades."}}},"required":true},"responses":{"200":{"description":"Array of recent trades.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol (e.g., BTC)."},"side":{"enum":["B","A"],"description":"Trade side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trade price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trade size."},"time":{"type":"number","minimum":0,"description":"Trade timestamp (in ms since epoch)."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."},"tid":{"type":"number","minimum":0,"description":"Trade ID."},"users":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42}],"minItems":2,"description":"Addresses of users involved in the trade [Maker, Taker]."}},"required":["coin","side","px","sz","time","hash","tid","users"]},"description":"Array of recent trades."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# referral

## POST /info

> Request user referral.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/referral","version":"1.0.0"},"tags":[{"name":"referral"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["referral"],"description":"Request user referral.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["referral"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user referral."}}},"required":true},"responses":{"200":{"description":"Referral details for a user.","content":{"application/json":{"schema":{"type":"object","properties":{"referredBy":{"anyOf":[{"type":"object","properties":{"referrer":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Referrer address."},"code":{"type":"string","minLength":1,"description":"Referral code used."}},"required":["referrer","code"],"nullable":true}],"description":"Referrer details."},"cumVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative traded volume."},"unclaimedRewards":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Rewards earned but not yet claimed."},"claimedRewards":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Rewards that have been claimed."},"builderRewards":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Builder reward amount."},"referrerState":{"oneOf":[{"type":"object","properties":{"stage":{"description":"Referrer is ready to receive rewards.","enum":["ready"]},"data":{"type":"object","properties":{"code":{"type":"string","minLength":1,"description":"Assigned referral code."},"nReferrals":{"type":"number","minimum":0,"description":"Total number of referrals."},"referralStates":{"type":"array","items":{"type":"object","properties":{"cumVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative traded volume."},"cumRewardedFeesSinceReferred":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total fees rewarded to the referred user since referral."},"cumFeesRewardedToReferrer":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total fees rewarded to the referrer from referred trades."},"timeJoined":{"type":"number","minimum":0,"description":"Timestamp when the referred user joined (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the referred user."},"tokenToState":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"cumVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative traded volume."},"cumRewardedFeesSinceReferred":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total fees rewarded to the referred user since referral."},"cumFeesRewardedToReferrer":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total fees rewarded to the referrer from referred trades."}},"required":["cumVlm","cumRewardedFeesSinceReferred","cumFeesRewardedToReferrer"]}],"minItems":2},"description":"Mapping of token IDs to referral reward states."}},"required":["cumVlm","cumRewardedFeesSinceReferred","cumFeesRewardedToReferrer","timeJoined","user","tokenToState"]},"description":"Summary of each referral state."}},"required":["code","nReferrals","referralStates"],"description":"Referral program details."}},"required":["stage","data"]},{"type":"object","properties":{"stage":{"description":"Referrer needs to create a referral code.","enum":["needToCreateCode"]}},"required":["stage"]},{"type":"object","properties":{"stage":{"description":"Referrer must complete a trade before earning rewards.","enum":["needToTrade"]},"data":{"type":"object","properties":{"required":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Required trading volume."}},"required":["required"],"description":"Required trading volume details for activation."}},"required":["stage","data"]}],"description":"Current state of the referrer."},"rewardHistory":{"type":"array","items":{"type":"object","properties":{"earned":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of earned rewards."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Traded volume at the time of reward."},"referralVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Traded volume via referrals."},"time":{"type":"number","minimum":0,"description":"Timestamp when the reward was earned (in ms since epoch)."}},"required":["earned","vlm","referralVlm","time"]},"description":"History of referral rewards."},"tokenToState":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"cumVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative traded volume."},"unclaimedRewards":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Rewards earned but not yet claimed."},"claimedRewards":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Rewards that have been claimed."},"builderRewards":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Builder reward amount."}},"required":["cumVlm","unclaimedRewards","claimedRewards","builderRewards"]}],"minItems":2},"description":"Mapping of token IDs to referral reward states."}},"required":["referredBy","cumVlm","unclaimedRewards","claimedRewards","builderRewards","referrerState","rewardHistory","tokenToState"],"description":"Referral details for a user."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# spotClearinghouseState

## POST /info

> Request spot clearinghouse state.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/spotClearinghouseState","version":"1.0.0"},"tags":[{"name":"spotClearinghouseState"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["spotClearinghouseState"],"description":"Request spot clearinghouse state.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["spotClearinghouseState"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"dex":{"type":"string","description":"DEX name (empty string for main dex)."}},"required":["type","user"],"description":"Request spot clearinghouse state."}}},"required":true},"responses":{"200":{"description":"Account summary for spot trading.","content":{"application/json":{"schema":{"type":"object","properties":{"balances":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."},"hold":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount on hold."},"entryNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Entry notional value."}},"required":["coin","token","total","hold","entryNtl"]},"description":"Array of available token balances."},"evmEscrows":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."}},"required":["coin","token","total"]},"description":"Array of escrowed balances."}},"required":["balances"],"description":"Account summary for spot trading."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# spotDeployState

## POST /info

> Request spot deploy state.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/spotDeployState","version":"1.0.0"},"tags":[{"name":"spotDeployState"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["spotDeployState"],"description":"Request spot deploy state.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["spotDeployState"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request spot deploy state."}}},"required":true},"responses":{"200":{"description":"Deploy state for spot tokens.","content":{"application/json":{"schema":{"type":"object","properties":{"states":{"type":"array","items":{"type":"object","properties":{"token":{"type":"number","minimum":0,"description":"Token ID."},"spec":{"type":"object","properties":{"name":{"type":"string","description":"Name of the token."},"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"weiDecimals":{"type":"number","minimum":0,"description":"Number of decimals for the token's smallest unit."}},"required":["name","szDecimals","weiDecimals"],"description":"Token specification."},"fullName":{"anyOf":[{"type":"string","nullable":true}],"description":"Full name of the token."},"deployerTradingFeeShare":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Deployer trading fee share for the token."},"spots":{"type":"array","items":{"type":"number","minimum":0},"description":"Spot indices for the token."},"maxSupply":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Maximum supply of the token."},"hyperliquidityGenesisBalance":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Hyperliquidity genesis balance of the token."},"totalGenesisBalanceWei":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total genesis balance (in wei) for the token."},"userGenesisBalances":{"type":"array","items":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"User genesis balances for the token."},"existingTokenGenesisBalances":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"Existing token genesis balances for the token."},"blacklistUsers":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"Blacklisted users for the token."}},"required":["token","spec","fullName","deployerTradingFeeShare","spots","maxSupply","hyperliquidityGenesisBalance","totalGenesisBalanceWei","userGenesisBalances","existingTokenGenesisBalances","blacklistUsers"]},"description":"Array of deploy states for tokens."},"gasAuction":{"type":"object","properties":{"currentGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Current gas."},"durationSeconds":{"type":"number","minimum":0,"description":"Duration in seconds."},"endGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Ending gas."},"startGas":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Starting gas."},"startTimeSeconds":{"type":"number","minimum":0,"description":"Auction start time (seconds since epoch)."}},"required":["currentGas","durationSeconds","endGas","startGas","startTimeSeconds"],"description":"Status of the spot deploy auction."}},"required":["states","gasAuction"],"description":"Deploy state for spot tokens."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# spotMeta

## POST /info

> Request spot trading metadata.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/spotMeta","version":"1.0.0"},"tags":[{"name":"spotMeta"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["spotMeta"],"description":"Request spot trading metadata.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["spotMeta"]}},"required":["type"],"description":"Request spot trading metadata."}}},"required":true},"responses":{"200":{"description":"Metadata for spot assets.","content":{"application/json":{"schema":{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"tokens":{"type":"array","items":{"type":"number","minimum":0},"description":"Token indices included in this universe."},"name":{"type":"string","description":"Name of the universe."},"index":{"type":"number","minimum":0,"description":"Unique identifier of the universe."},"isCanonical":{"type":"boolean","description":"Indicates if the token is the primary representation in the system."}},"required":["tokens","name","index","isCanonical"]},"description":"Trading universes available for spot trading."},"tokens":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","description":"Name of the token."},"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"weiDecimals":{"type":"number","minimum":0,"description":"Number of decimals for the token's smallest unit."},"index":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"tokenId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Token ID."},"isCanonical":{"type":"boolean","description":"Indicates if the token is the primary representation in the system."},"evmContract":{"anyOf":[{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Contract address."},"evm_extra_wei_decimals":{"type":"number","description":"Extra decimals in the token's smallest unit."}},"required":["address","evm_extra_wei_decimals"],"nullable":true}],"description":"EVM contract details."},"fullName":{"anyOf":[{"type":"string","nullable":true}],"description":"Full display name of the token."},"deployerTradingFeeShare":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Deployer trading fee share for the token."}},"required":["name","szDecimals","weiDecimals","index","tokenId","isCanonical","evmContract","fullName","deployerTradingFeeShare"]},"description":"Tokens available for spot trading."}},"required":["universe","tokens"],"description":"Metadata for spot assets."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# spotMetaAndAssetCtxs

## POST /info

> Request spot metadata and asset contexts.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/spotMetaAndAssetCtxs","version":"1.0.0"},"tags":[{"name":"spotMetaAndAssetCtxs"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["spotMetaAndAssetCtxs"],"description":"Request spot metadata and asset contexts.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["spotMetaAndAssetCtxs"]}},"required":["type"],"description":"Request spot metadata and asset contexts."}}},"required":true},"responses":{"200":{"description":"Tuple of spot metadata and asset contexts.","content":{"application/json":{"schema":{"type":"array","items":[{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"tokens":{"type":"array","items":{"type":"number","minimum":0},"description":"Token indices included in this universe."},"name":{"type":"string","description":"Name of the universe."},"index":{"type":"number","minimum":0,"description":"Unique identifier of the universe."},"isCanonical":{"type":"boolean","description":"Indicates if the token is the primary representation in the system."}},"required":["tokens","name","index","isCanonical"]},"description":"Trading universes available for spot trading."},"tokens":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","description":"Name of the token."},"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"weiDecimals":{"type":"number","minimum":0,"description":"Number of decimals for the token's smallest unit."},"index":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"tokenId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Token ID."},"isCanonical":{"type":"boolean","description":"Indicates if the token is the primary representation in the system."},"evmContract":{"anyOf":[{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Contract address."},"evm_extra_wei_decimals":{"type":"number","description":"Extra decimals in the token's smallest unit."}},"required":["address","evm_extra_wei_decimals"],"nullable":true}],"description":"EVM contract details."},"fullName":{"anyOf":[{"type":"string","nullable":true}],"description":"Full display name of the token."},"deployerTradingFeeShare":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Deployer trading fee share for the token."}},"required":["name","szDecimals","weiDecimals","index","tokenId","isCanonical","evmContract","fullName","deployerTradingFeeShare"]},"description":"Tokens available for spot trading."}},"required":["universe","tokens"],"description":"Metadata for spot assets."},{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"circulatingSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Circulating supply."},"coin":{"type":"string","description":"Asset symbol."},"totalSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total supply."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","circulatingSupply","coin","totalSupply","dayBaseVlm"],"description":"Spot asset context."}}],"minItems":2,"description":"Tuple of spot metadata and asset contexts."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# spotPairDeployAuctionStatus

## POST /info

> Request for the status of the spot deploy auction.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/spotPairDeployAuctionStatus","version":"1.0.0"},"tags":[{"name":"spotPairDeployAuctionStatus"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["spotPairDeployAuctionStatus"],"description":"Request for the status of the spot deploy auction.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["spotPairDeployAuctionStatus"]}},"required":["type"],"description":"Request for the status of the spot deploy auction."}}},"required":true},"responses":{"200":{"description":"Status of the spot deploy auction.","content":{"application/json":{"schema":{"type":"object","properties":{"currentGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Current gas."},"durationSeconds":{"type":"number","minimum":0,"description":"Duration in seconds."},"endGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Ending gas."},"startGas":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Starting gas."},"startTimeSeconds":{"type":"number","minimum":0,"description":"Auction start time (seconds since epoch)."}},"required":["currentGas","durationSeconds","endGas","startGas","startTimeSeconds"],"description":"Status of the spot deploy auction."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# subAccounts

## POST /info

> Request user sub-accounts.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/subAccounts","version":"1.0.0"},"tags":[{"name":"subAccounts"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["subAccounts"],"description":"Request user sub-accounts.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["subAccounts"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user sub-accounts."}}},"required":true},"responses":{"200":{"description":"Array of user sub-account or null if the user does not have any sub-accounts.","content":{"application/json":{"schema":{"anyOf":[{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","minLength":1,"description":"Sub-account name."},"subAccountUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-account address."},"master":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Master account address."},"clearinghouseState":{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Perpetual trading clearinghouse state summary."},"spotState":{"type":"object","properties":{"balances":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."},"hold":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount on hold."},"entryNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Entry notional value."}},"required":["coin","token","total","hold","entryNtl"]},"description":"Array of available token balances."},"evmEscrows":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."}},"required":["coin","token","total"]},"description":"Array of escrowed balances."}},"required":["balances"],"description":"Spot tokens clearinghouse state."}},"required":["name","subAccountUser","master","clearinghouseState","spotState"]},"nullable":true}],"description":"Array of user sub-account or null if the user does not have any sub-accounts."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# subAccounts2

## POST /info

> Request user sub-accounts (V2).

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/subAccounts2","version":"1.0.0"},"tags":[{"name":"subAccounts2"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["subAccounts2"],"description":"Request user sub-accounts (V2).","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["subAccounts2"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user sub-accounts (V2)."}}},"required":true},"responses":{"200":{"description":"Array of user sub-account or null if the user does not have any sub-accounts.","content":{"application/json":{"schema":{"anyOf":[{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","minLength":1,"description":"Sub-account name."},"subAccountUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-account address."},"master":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Master account address."},"dexToClearinghouseState":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Account summary for perpetual trading."}],"minItems":2},"minItems":1,"description":"DEX to clearinghouse state mapping. Always includes the main DEX (empty dex name)."},"spotState":{"type":"object","properties":{"balances":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."},"hold":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount on hold."},"entryNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Entry notional value."}},"required":["coin","token","total","hold","entryNtl"]},"description":"Array of available token balances."},"evmEscrows":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."}},"required":["coin","token","total"]},"description":"Array of escrowed balances."}},"required":["balances"],"description":"Spot tokens clearinghouse state."}},"required":["name","subAccountUser","master","dexToClearinghouseState","spotState"]},"nullable":true}],"description":"Array of user sub-account or null if the user does not have any sub-accounts."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# tokenDetails

## POST /info

> Request token details.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/tokenDetails","version":"1.0.0"},"tags":[{"name":"tokenDetails"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["tokenDetails"],"description":"Request token details.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["tokenDetails"]},"tokenId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Token ID."}},"required":["type","tokenId"],"description":"Request token details."}}},"required":true},"responses":{"200":{"description":"Details of a token.","content":{"application/json":{"schema":{"type":"object","properties":{"name":{"type":"string","description":"Name of the token."},"maxSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maximum supply of the token."},"totalSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total supply of the token."},"circulatingSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Circulating supply of the token."},"szDecimals":{"type":"number","minimum":0,"description":"Decimal places for the minimum tradable unit."},"weiDecimals":{"type":"number","minimum":0,"description":"Decimal places for the token's smallest unit."},"midPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mid price of the token."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price of the token."},"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's price of the token."},"genesis":{"anyOf":[{"type":"object","properties":{"userBalances":{"type":"array","items":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"string"}],"minItems":2},"description":"User balances."},"existingTokenBalances":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string"}],"minItems":2},"description":"Existing token balances."},"blacklistUsers":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"Blacklisted users."}},"required":["userBalances","existingTokenBalances","blacklistUsers"],"nullable":true}],"description":"Genesis data for the token."},"deployer":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Deployer address."},"deployGas":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Gas used during token deployment."},"deployTime":{"anyOf":[{"type":"string","nullable":true}],"description":"Deployment time."},"seededUsdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Seeded USDC amount for the token."},"nonCirculatingUserBalances":{"type":"array","items":{"type":"array","items":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"type":"string"}],"minItems":2},"description":"Non-circulating user balances of the token."},"futureEmissions":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Future emissions amount."}},"required":["name","maxSupply","totalSupply","circulatingSupply","szDecimals","weiDecimals","midPx","markPx","prevDayPx","genesis","deployer","deployGas","deployTime","seededUsdc","nonCirculatingUserBalances","futureEmissions"],"description":"Details of a token."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# twapHistory

## POST /info

> Request twap history of a user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/twapHistory","version":"1.0.0"},"tags":[{"name":"twapHistory"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["twapHistory"],"description":"Request twap history of a user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["twapHistory"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request twap history of a user."}}},"required":true},"responses":{"200":{"description":"Array of user's TWAP history.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Creation time of the history record (in seconds since epoch)."},"state":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"executedNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed notional value."},"executedSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed size."},"minutes":{"type":"number","minimum":0,"description":"Duration in minutes."},"randomize":{"type":"boolean","description":"Indicates if the TWAP randomizes execution."},"reduceOnly":{"type":"boolean","description":"Indicates if the order is reduce-only."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size."},"timestamp":{"type":"number","minimum":0,"description":"Start time of the TWAP order (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["coin","executedNtl","executedSz","minutes","randomize","reduceOnly","side","sz","timestamp","user"],"description":"State of the TWAP order."},"status":{"oneOf":[{"type":"object","properties":{"status":{"enum":["finished","activated","terminated"],"description":"Status of the TWAP order."}},"required":["status"]},{"type":"object","properties":{"status":{"description":"Status of the TWAP order.","enum":["error"]},"description":{"type":"string","description":"Error message."}},"required":["status","description"]}],"description":"Current status of the TWAP order.\n- `\"finished\"`: Fully executed.\n- `\"activated\"`: Active and executing.\n- `\"terminated\"`: Terminated.\n- `\"error\"`: An error occurred."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["time","state","status"]},"description":"Array of user's TWAP history."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# txDetails

## POST /info

> Request transaction details by transaction hash.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/txDetails","version":"1.0.0"},"tags":[{"name":"txDetails"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["txDetails"],"description":"Request transaction details by transaction hash.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["txDetails"]},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."}},"required":["type","hash"],"description":"Request transaction details by transaction hash."}}},"required":true},"responses":{"200":{"description":"Response with transaction details.","content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Response type.","enum":["txDetails"]},"tx":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"type":"string","description":"Action type."}},"required":["type"],"description":"Action performed in transaction."},"block":{"type":"number","minimum":0,"description":"Block number where transaction was included."},"error":{"anyOf":[{"type":"string","nullable":true}],"description":"Error message if transaction failed."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."},"time":{"type":"number","minimum":0,"description":"Transaction creation timestamp."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Creator's address."}},"required":["action","block","error","hash","time","user"],"description":"Transaction details."}},"required":["type","tx"],"description":"Response with transaction details."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userDetails

## POST /info

> Request array of user transaction details.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userDetails","version":"1.0.0"},"tags":[{"name":"userDetails"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userDetails"],"description":"Request array of user transaction details.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userDetails"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request array of user transaction details."}}},"required":true},"responses":{"200":{"description":"Response array of user transaction details.","content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["userDetails"]},"txs":{"type":"array","items":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"type":"string","description":"Action type."}},"required":["type"],"description":"Action performed in transaction."},"block":{"type":"number","minimum":0,"description":"Block number where transaction was included."},"error":{"anyOf":[{"type":"string","nullable":true}],"description":"Error message if transaction failed."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Transaction hash."},"time":{"type":"number","minimum":0,"description":"Transaction creation timestamp."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Creator's address."}},"required":["action","block","error","hash","time","user"],"description":"Explorer transaction."},"description":"Array of user transaction details."}},"required":["type","txs"],"description":"Response array of user transaction details."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userDexAbstraction

## POST /info

> Request user HIP-3 DEX abstraction state.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userDexAbstraction","version":"1.0.0"},"tags":[{"name":"userDexAbstraction"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userDexAbstraction"],"description":"Request user HIP-3 DEX abstraction state.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userDexAbstraction"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user HIP-3 DEX abstraction state."}}},"required":true},"responses":{"200":{"description":"User HIP-3 DEX abstraction state.","content":{"application/json":{"schema":{"anyOf":[{"type":"boolean","nullable":true}],"description":"User HIP-3 DEX abstraction state."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userFees

## POST /info

> Request user fees.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userFees","version":"1.0.0"},"tags":[{"name":"userFees"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userFees"],"description":"Request user fees.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userFees"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user fees."}}},"required":true},"responses":{"200":{"description":"User fees.","content":{"application/json":{"schema":{"type":"object","properties":{"dailyUserVlm":{"type":"array","items":{"type":"object","properties":{"date":{"type":"string","format":"date","description":"Date in YYYY-M-D format."},"userCross":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User cross-trade volume."},"userAdd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User add-liquidity volume."},"exchange":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Exchange total volume."}},"required":["date","userCross","userAdd","exchange"]},"description":"Daily user volume metrics."},"feeSchedule":{"type":"object","properties":{"cross":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cross-trade fee rate."},"add":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Add-liquidity fee rate."},"spotCross":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Spot cross-trade fee rate."},"spotAdd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Spot add-liquidity fee rate."},"tiers":{"type":"object","properties":{"vip":{"type":"array","items":{"type":"object","properties":{"ntlCutoff":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Notional volume cutoff."},"cross":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cross-trade fee rate."},"add":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Add-liquidity fee rate."},"spotCross":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Spot cross-trade fee rate."},"spotAdd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Spot add-liquidity fee rate."}},"required":["ntlCutoff","cross","add","spotCross","spotAdd"]},"description":"Array of VIP fee tiers."},"mm":{"type":"array","items":{"type":"object","properties":{"makerFractionCutoff":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maker fraction cutoff."},"add":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Add-liquidity fee rate."}},"required":["makerFractionCutoff","add"]},"description":"Array of market maker fee tiers."}},"required":["vip","mm"],"description":"Fee tiers details."},"referralDiscount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Referral discount rate."},"stakingDiscountTiers":{"type":"array","items":{"type":"object","properties":{"bpsOfMaxSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Basis points of maximum supply."},"discount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Discount rate applied."}},"required":["bpsOfMaxSupply","discount"]},"description":"Array of staking discount tiers."}},"required":["cross","add","spotCross","spotAdd","tiers","referralDiscount","stakingDiscountTiers"],"description":"Fee schedule information."},"userCrossRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User cross-trade rate."},"userAddRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User add-liquidity rate."},"userSpotCrossRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User spot cross-trade rate."},"userSpotAddRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User spot add-liquidity rate."},"activeReferralDiscount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Active referral discount rate."},"trial":{"anyOf":[{"nullable":true}],"description":"Trial details."},"feeTrialEscrow":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee trial escrow amount."},"nextTrialAvailableTimestamp":{"anyOf":[{"nullable":true}],"description":"Timestamp when next trial becomes available."},"stakingLink":{"anyOf":[{"type":"object","properties":{"stakingUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Linked account address:\n- When queried by staking account: contains trading account address.\n- When queried by trading account: contains staking account address."},"type":{"enum":["requested","stakingUser","tradingUser"],"description":"Link status:\n- `requested` = link initiated by trading user, awaiting staking user confirmation.\n- `stakingUser` = response queried by staking account.\n- `tradingUser` = response queried by trading account."}},"required":["stakingUser","type"],"nullable":true}],"description":"Permanent link between staking and trading accounts.\nStaking user gains full control of trading account funds.\nStaking user forfeits own fee discounts."},"activeStakingDiscount":{"type":"object","properties":{"bpsOfMaxSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Basis points of maximum supply."},"discount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Discount rate applied."}},"required":["bpsOfMaxSupply","discount"],"description":"Active staking discount details."}},"required":["dailyUserVlm","feeSchedule","userCrossRate","userAddRate","userSpotCrossRate","userSpotAddRate","activeReferralDiscount","trial","feeTrialEscrow","nextTrialAvailableTimestamp","stakingLink","activeStakingDiscount"],"description":"User fees."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userFills

## POST /info

> Request array of user fills.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userFills","version":"1.0.0"},"tags":[{"name":"userFills"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userFills"],"description":"Request array of user fills.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userFills"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"aggregateByTime":{"type":"boolean","description":"If true, partial fills are aggregated when a crossing order fills multiple resting orders."}},"required":["type","user"],"description":"Request array of user fills."}}},"required":true},"responses":{"200":{"description":"Array of user trade fills.","content":{"application/json":{"schema":{"type":"array","items":{"allOf":[{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"User fill."},{"type":"object","properties":{"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."},"liquidation":{"type":"object","properties":{"liquidatedUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the liquidated user."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price at the time of liquidation."},"method":{"enum":["market","backstop"],"description":"Liquidation method."}},"required":["liquidatedUser","markPx","method"],"description":"Liquidation details."}},"required":[]}]},"description":"Array of user trade fills."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userFillsByTime

## POST /info

> Request array of user fills by time.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userFillsByTime","version":"1.0.0"},"tags":[{"name":"userFillsByTime"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userFillsByTime"],"description":"Request array of user fills by time.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userFillsByTime"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"startTime":{"type":"number","minimum":0,"description":"Start time (in ms since epoch)."},"endTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"End time (in ms since epoch)."},"aggregateByTime":{"type":"boolean","description":"If true, partial fills are aggregated when a crossing order fills multiple resting orders."}},"required":["type","user","startTime"],"description":"Request array of user fills by time."}}},"required":true},"responses":{"200":{"description":"Array of user trade fills by time.","content":{"application/json":{"schema":{"type":"array","items":{"allOf":[{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"User fill."},{"type":"object","properties":{"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."},"liquidation":{"type":"object","properties":{"liquidatedUser":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the liquidated user."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price at the time of liquidation."},"method":{"enum":["market","backstop"],"description":"Liquidation method."}},"required":["liquidatedUser","markPx","method"],"description":"Liquidation details."}},"required":[]}]},"description":"Array of user trade fills by time."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userFunding

## POST /info

> Request array of user funding ledger updates.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userFunding","version":"1.0.0"},"tags":[{"name":"userFunding"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userFunding"],"description":"Request array of user funding ledger updates.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userFunding"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"startTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Start time (in ms since epoch)."},"endTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"End time (in ms since epoch)."}},"required":["type","user"],"description":"Request array of user funding ledger updates."}}},"required":true},"responses":{"200":{"description":"Array of user funding ledger updates.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Timestamp of the update (in ms since epoch)."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"delta":{"type":"object","properties":{"type":{"description":"Update type.","enum":["funding"]},"coin":{"type":"string","description":"Asset symbol."},"usdc":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"fundingRate":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Applied funding rate."},"nSamples":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Number of samples."}},"required":["type","coin","usdc","szi","fundingRate","nSamples"],"description":"Update details."}},"required":["time","hash","delta"]},"description":"Array of user funding ledger updates."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userNonFundingLedgerUpdates

## POST /info

> Request user non-funding ledger updates.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userNonFundingLedgerUpdates","version":"1.0.0"},"tags":[{"name":"userNonFundingLedgerUpdates"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userNonFundingLedgerUpdates"],"description":"Request user non-funding ledger updates.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userNonFundingLedgerUpdates"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"startTime":{"type":"number","minimum":0,"description":"Start time (in ms since epoch)."},"endTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"End time (in ms since epoch)."}},"required":["type","user"],"description":"Request user non-funding ledger updates."}}},"required":true},"responses":{"200":{"description":"Array of user's non-funding ledger update.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"time":{"type":"number","minimum":0,"description":"Timestamp of the update (in ms since epoch)."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"delta":{"oneOf":[{"type":"object","properties":{"type":{"description":"Update type.","enum":["accountClassTransfer"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"toPerp":{"type":"boolean","description":"Indicates if the transfer is to the perpetual account."}},"required":["type","usdc","toPerp"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["deposit"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount deposited in USDC."}},"required":["type","usdc"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["internalTransfer"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Initiator address."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Transfer fee."}},"required":["type","usdc","user","destination","fee"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["liquidation"]},"liquidatedNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional value of liquidated positions."},"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Account value at liquidation time."},"leverageType":{"enum":["Cross","Isolated"],"description":"Leverage type for liquidated positions."},"liquidatedPositions":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol of the liquidated position."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size liquidated."}},"required":["coin","szi"]},"description":"Details of each liquidated position."}},"required":["type","liquidatedNtlPos","accountValue","leverageType","liquidatedPositions"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["rewardsClaim"]},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of rewards claimed."},"token":{"type":"string","description":"Token symbol."}},"required":["type","amount","token"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["spotTransfer"]},"token":{"type":"string","description":"Token symbol."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred."},"usdcValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Equivalent USDC value."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Initiator address."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Transfer fee."},"nativeTokenFee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee in native token."},"nonce":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Nonce of the transfer."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."}},"required":["type","token","amount","usdcValue","user","destination","fee","nativeTokenFee","nonce","feeToken"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["subAccountTransfer"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount transferred in USDC."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Initiator address."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."}},"required":["type","usdc","user","destination"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultCreate"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the created vault."},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Initial allocated amount in USDC."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Vault creation fee."}},"required":["type","vault","usdc","fee"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultDeposit"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the target vault."},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount deposited in USDC."}},"required":["type","vault","usdc"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultDistribution"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the vault distributing funds."},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount distributed in USDC."}},"required":["type","vault","usdc"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["vaultWithdraw"]},"vault":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the user withdrawing funds."},"requestedUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Withdrawal request amount in USD."},"commission":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Withdrawal commission fee."},"closingCost":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Closing cost associated with positions."},"basis":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Basis value for withdrawal calculation."},"netWithdrawnUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Net withdrawn amount in USD after fees and costs."}},"required":["type","vault","user","requestedUsd","commission","closingCost","basis","netWithdrawnUsd"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["withdraw"]},"usdc":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount withdrawn in USDC."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Withdrawal fee."}},"required":["type","usdc","nonce","fee"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["send"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the sender."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"sourceDex":{"type":"string","description":"Source DEX (\"\" for default USDC perp DEX, \"spot\" for spot)."},"destinationDex":{"type":"string","description":"Destination DEX (\"\" for default USDC perp DEX, \"spot\" for spot)."},"token":{"type":"string","description":"Token identifier."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to send (not in wei)."},"usdcValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Equivalent USDC value."},"fee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Transfer fee."},"nativeTokenFee":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee in native token."},"nonce":{"type":"number","minimum":0,"description":"Nonce of the transfer."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."}},"required":["type","user","destination","sourceDex","destinationDex","token","amount","usdcValue","fee","nativeTokenFee","nonce","feeToken"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["deployGasAuction"]},"token":{"type":"string","description":"Token symbol."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount in the specified token."}},"required":["type","token","amount"]},{"type":"object","properties":{"type":{"description":"Update type.","enum":["cStakingTransfer"]},"token":{"type":"string","description":"Token symbol."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount in the specified token."},"isDeposit":{"type":"boolean","description":"`true` for deposit, `false` for withdrawal."}},"required":["type","token","amount","isDeposit"]}],"description":"Update details."}},"required":["time","hash","delta"]},"description":"Array of user's non-funding ledger update."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userRateLimit

## POST /info

> Request user rate limits.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userRateLimit","version":"1.0.0"},"tags":[{"name":"userRateLimit"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userRateLimit"],"description":"Request user rate limits.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userRateLimit"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user rate limits."}}},"required":true},"responses":{"200":{"description":"User rate limits.","content":{"application/json":{"schema":{"type":"object","properties":{"cumVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative trading volume."},"nRequestsUsed":{"type":"number","minimum":0,"description":"Number of API requests used."},"nRequestsCap":{"type":"number","minimum":0,"description":"Maximum allowed API requests."},"nRequestsSurplus":{"type":"number","minimum":0,"description":"Number of surplus API requests."}},"required":["cumVlm","nRequestsUsed","nRequestsCap","nRequestsSurplus"],"description":"User rate limits."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userRole

## POST /info

> Request user role.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userRole","version":"1.0.0"},"tags":[{"name":"userRole"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userRole"],"description":"Request user role.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userRole"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user role."}}},"required":true},"responses":{"200":{"description":"User role.","content":{"application/json":{"schema":{"oneOf":[{"type":"object","properties":{"role":{"enum":["missing","user","vault"],"description":"Role identifier."}},"required":["role"]},{"type":"object","properties":{"role":{"description":"Role identifier.","enum":["agent"]},"data":{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Master account address associated with the agent."}},"required":["user"],"description":"Details for agent role."}},"required":["role","data"]},{"type":"object","properties":{"role":{"description":"Role identifier.","enum":["subAccount"]},"data":{"type":"object","properties":{"master":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Master account address associated with the sub-account."}},"required":["master"],"description":"Details for sub-account role."}},"required":["role","data"]}],"description":"User role."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userToMultiSigSigners

## POST /info

> Request multi-sig signers for a user.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userToMultiSigSigners","version":"1.0.0"},"tags":[{"name":"userToMultiSigSigners"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userToMultiSigSigners"],"description":"Request multi-sig signers for a user.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userToMultiSigSigners"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request multi-sig signers for a user."}}},"required":true},"responses":{"200":{"description":"Multi-sig signers for a user or null if the user does not have any multi-sig signers.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"authorizedUsers":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"minItems":1,"description":"Authorized users addresses."},"threshold":{"type":"number","minimum":1,"description":"Threshold number of signatures required."}},"required":["authorizedUsers","threshold"],"nullable":true}],"description":"Multi-sig signers for a user or null if the user does not have any multi-sig signers."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userTwapSliceFills

## POST /info

> Request user TWAP slice fills.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userTwapSliceFills","version":"1.0.0"},"tags":[{"name":"userTwapSliceFills"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userTwapSliceFills"],"description":"Request user TWAP slice fills.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userTwapSliceFills"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user TWAP slice fills."}}},"required":true},"responses":{"200":{"description":"Array of user's twap slice fills.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"fill":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"TWAP fill record."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["fill","twapId"]},"description":"Array of user's twap slice fills."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userTwapSliceFillsByTime

## POST /info

> Request user TWAP slice fills by time.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userTwapSliceFillsByTime","version":"1.0.0"},"tags":[{"name":"userTwapSliceFillsByTime"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userTwapSliceFillsByTime"],"description":"Request user TWAP slice fills by time.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userTwapSliceFillsByTime"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"startTime":{"type":"number","minimum":0,"description":"Start time (in ms since epoch)."},"endTime":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"End time (in ms since epoch)."},"aggregateByTime":{"type":"boolean","description":"If true, partial fills are aggregated when a crossing order fills multiple resting orders."}},"required":["type","user","startTime"],"description":"Request user TWAP slice fills by time."}}},"required":true},"responses":{"200":{"description":"Array of user's twap slice fill by time.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"fill":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"px":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"time":{"type":"number","minimum":0,"description":"Timestamp when the trade occurred (in ms since epoch)."},"startPosition":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Start position size."},"dir":{"type":"string","description":"Direction indicator for frontend display."},"closedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Realized PnL."},"hash":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"L1 transaction hash."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"crossed":{"type":"boolean","description":"Indicates if the fill was a taker order."},"fee":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Fee charged or rebate received (negative indicates rebate)."},"tid":{"type":"number","minimum":0,"description":"Unique transaction identifier for a partial fill of an order."},"feeToken":{"type":"string","description":"Token in which the fee is denominated (e.g., \"USDC\")."},"twapId":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"ID of the TWAP."}},"required":["coin","px","sz","side","time","startPosition","dir","closedPnl","hash","oid","crossed","fee","tid","feeToken","twapId"],"description":"TWAP fill record."},"twapId":{"type":"number","minimum":0,"description":"ID of the TWAP."}},"required":["fill","twapId"]},"description":"Array of user's twap slice fill by time."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# userVaultEquities

## POST /info

> Request user vault deposits.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/userVaultEquities","version":"1.0.0"},"tags":[{"name":"userVaultEquities"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["userVaultEquities"],"description":"Request user vault deposits.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["userVaultEquities"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request user vault deposits."}}},"required":true},"responses":{"200":{"description":"Array of user's vault deposits.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"equity":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"User deposited equity."},"lockedUntilTimestamp":{"type":"number","minimum":0,"description":"Timestamp when the user can withdraw their equity."}},"required":["vaultAddress","equity","lockedUntilTimestamp"]},"description":"Array of user's vault deposits."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# validatorL1Votes

## POST /info

> Request validator L1 votes.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/validatorL1Votes","version":"1.0.0"},"tags":[{"name":"validatorL1Votes"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["validatorL1Votes"],"description":"Request validator L1 votes.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["validatorL1Votes"]}},"required":["type"],"description":"Request validator L1 votes."}}},"required":true},"responses":{"200":{"description":"Array of L1 governance votes cast by validators.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"expireTime":{"type":"number","description":"Timestamp when the vote expires (in ms since epoch)."},"action":{"anyOf":[{"type":"object","properties":{"D":{"type":"string"}},"required":["D"]},{"type":"object","properties":{"C":{"type":"array","items":{"type":"string"}}},"required":["C"]}],"description":"Type of the vote."},"votes":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"List of validator addresses that cast this vote."}},"required":["expireTime","action","votes"]},"description":"Array of L1 governance votes cast by validators."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# validatorSummaries

## POST /info

> Request validator summaries.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/validatorSummaries","version":"1.0.0"},"tags":[{"name":"validatorSummaries"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["validatorSummaries"],"description":"Request validator summaries.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["validatorSummaries"]}},"required":["type"],"description":"Request validator summaries."}}},"required":true},"responses":{"200":{"description":"Array of validator performance statistics.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"validator":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the validator."},"signer":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the validator signer."},"name":{"type":"string","description":"Name of the validator."},"description":{"type":"string","description":"Description of the validator."},"nRecentBlocks":{"type":"number","minimum":0,"description":"Number of blocks produced recently."},"stake":{"type":"integer","description":"Total amount of tokens staked **(unsafe integer)**."},"isJailed":{"type":"boolean","description":"Whether the validator is currently jailed."},"unjailableAfter":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Timestamp when the validator can be unjailed (in ms since epoch)."},"isActive":{"type":"boolean","description":"Whether the validator is currently active."},"commission":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Commission rate charged by the validator."},"stats":{"type":"array","items":[{"type":"array","items":[{"enum":["day"]},{"type":"object","properties":{"uptimeFraction":{"type":"string","description":"Fraction of time the validator was online."},"predictedApr":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Predicted annual percentage rate of returns."},"nSamples":{"type":"number","minimum":0,"description":"Number of samples used for statistics calculation."}},"required":["uptimeFraction","predictedApr","nSamples"],"description":"Statistics for validator performance over a time period."}],"minItems":2},{"type":"array","items":[{"enum":["week"]},{"type":"object","properties":{"uptimeFraction":{"type":"string","description":"Fraction of time the validator was online."},"predictedApr":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Predicted annual percentage rate of returns."},"nSamples":{"type":"number","minimum":0,"description":"Number of samples used for statistics calculation."}},"required":["uptimeFraction","predictedApr","nSamples"],"description":"Statistics for validator performance over a time period."}],"minItems":2},{"type":"array","items":[{"enum":["month"]},{"type":"object","properties":{"uptimeFraction":{"type":"string","description":"Fraction of time the validator was online."},"predictedApr":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Predicted annual percentage rate of returns."},"nSamples":{"type":"number","minimum":0,"description":"Number of samples used for statistics calculation."}},"required":["uptimeFraction","predictedApr","nSamples"],"description":"Statistics for validator performance over a time period."}],"minItems":2}],"minItems":3,"description":"Performance statistics over different time periods."}},"required":["validator","signer","name","description","nRecentBlocks","stake","isJailed","unjailableAfter","isActive","commission","stats"]},"description":"Array of validator performance statistics."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# vaultDetails

## POST /info

> Request details of a vault.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/vaultDetails","version":"1.0.0"},"tags":[{"name":"vaultDetails"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["vaultDetails"],"description":"Request details of a vault.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["vaultDetails"]},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"user":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"User address."}},"required":["type","vaultAddress"],"description":"Request details of a vault."}}},"required":true},"responses":{"200":{"description":"Details of a vault or null if the vault does not exist.","content":{"application/json":{"schema":{"type":"object","properties":{"name":{"type":"string","description":"Vault name."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"leader":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Leader address."},"description":{"type":"string","description":"Vault description."},"portfolio":{"type":"array","items":[{"type":"array","items":[{"enum":["day"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["week"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["month"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["allTime"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpDay"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpWeek"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpMonth"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2},{"type":"array","items":[{"enum":["perpAllTime"]},{"type":"object","properties":{"accountValueHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for account value as [timestamp, value]."},"pnlHistory":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"History entries for profit and loss as [timestamp, value]."},"vlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Volume metric for the portfolio."}},"required":["accountValueHistory","pnlHistory","vlm"],"description":"Portfolio metrics snapshot."}],"minItems":2}],"minItems":8,"description":"Vault portfolio metrics grouped by time periods."},"apr":{"type":"number","description":"Annual percentage rate."},"followerState":{"anyOf":[{"type":"object","properties":{"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Follower address."},"vaultEquity":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Follower vault equity."},"pnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Current profit and loss."},"allTimePnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"All-time profit and loss."},"daysFollowing":{"type":"number","minimum":0,"description":"Subscription duration in days."},"vaultEntryTime":{"type":"number","minimum":0,"description":"Vault entry timestamp."},"lockupUntil":{"type":"number","minimum":0,"description":"Timestamp when funds become unlocked."}},"required":["user","vaultEquity","pnl","allTimePnl","daysFollowing","vaultEntryTime","lockupUntil"],"nullable":true}],"description":"Current user follower state."},"leaderFraction":{"type":"number","description":"Ownership percentage held by leader."},"leaderCommission":{"type":"number","description":"Leader commission percentage."},"followers":{"type":"array","items":{"type":"object","properties":{"user":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},{"enum":["Leader"]}],"description":"Follower address or Leader."},"vaultEquity":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Follower vault equity."},"pnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Current profit and loss."},"allTimePnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"All-time profit and loss."},"daysFollowing":{"type":"number","minimum":0,"description":"Subscription duration in days."},"vaultEntryTime":{"type":"number","minimum":0,"description":"Vault entry timestamp."},"lockupUntil":{"type":"number","minimum":0,"description":"Timestamp when funds become unlocked."}},"required":["user","vaultEquity","pnl","allTimePnl","daysFollowing","vaultEntryTime","lockupUntil"]},"description":"Array of vault followers."},"maxDistributable":{"type":"number","description":"Maximum distributable amount."},"maxWithdrawable":{"type":"number","description":"Maximum withdrawable amount."},"isClosed":{"type":"boolean","description":"Vault closure status."},"relationship":{"oneOf":[{"type":"object","properties":{"type":{"enum":["normal","child"],"description":"Relationship type."}},"required":["type"]},{"type":"object","properties":{"type":{"description":"Relationship type.","enum":["parent"]},"data":{"type":"object","properties":{"childAddresses":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"Child vault addresses."}},"required":["childAddresses"],"description":"Child vault information."}},"required":["type","data"]}],"description":"Vault relationship type."},"allowDeposits":{"type":"boolean","description":"Deposit permission status."},"alwaysCloseOnWithdraw":{"type":"boolean","description":"Position closure policy on withdrawal."}},"required":["name","vaultAddress","leader","description","portfolio","apr","followerState","leaderFraction","leaderCommission","followers","maxDistributable","maxWithdrawable","isClosed","relationship","allowDeposits","alwaysCloseOnWithdraw"],"description":"Details of a vault or null if the vault does not exist."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# vaultSummaries

## POST /info

> Request a list of vaults less than 2 hours old.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/vaultSummaries","version":"1.0.0"},"tags":[{"name":"vaultSummaries"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["vaultSummaries"],"description":"Request a list of vaults less than 2 hours old.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["vaultSummaries"]}},"required":["type"],"description":"Request a list of vaults less than 2 hours old."}}},"required":true},"responses":{"200":{"description":"Array of vaults less than 2 hours old.","content":{"application/json":{"schema":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string","description":"Vault name."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"leader":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Leader address."},"tvl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total value locked."},"isClosed":{"type":"boolean","description":"Vault closure status."},"relationship":{"oneOf":[{"type":"object","properties":{"type":{"enum":["normal","child"],"description":"Relationship type."}},"required":["type"]},{"type":"object","properties":{"type":{"description":"Relationship type.","enum":["parent"]},"data":{"type":"object","properties":{"childAddresses":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"Child vault addresses."}},"required":["childAddresses"],"description":"Child vault information."}},"required":["type","data"]}],"description":"Vault relationship type."},"createTimeMillis":{"type":"number","minimum":0,"description":"Creation timestamp."}},"required":["name","vaultAddress","leader","tvl","isClosed","relationship","createTimeMillis"]},"description":"Array of vaults less than 2 hours old."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# webData2

## POST /info

> Request comprehensive user and market data.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - info/webData2","version":"1.0.0"},"tags":[{"name":"webData2"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/info":{"post":{"tags":["webData2"],"description":"Request comprehensive user and market data.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"type":{"description":"Type of request.","enum":["webData2"]},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["type","user"],"description":"Request comprehensive user and market data."}}},"required":true},"responses":{"200":{"description":"Comprehensive user and market data.","content":{"application/json":{"schema":{"type":"object","properties":{"clearinghouseState":{"type":"object","properties":{"marginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Margin summary details."},"crossMarginSummary":{"type":"object","properties":{"accountValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total account value."},"totalNtlPos":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total notional position value."},"totalRawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total raw USD value."},"totalMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total margin used."}},"required":["accountValue","totalNtlPos","totalRawUsd","totalMarginUsed"],"description":"Cross-margin summary details."},"crossMaintenanceMarginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Maintenance margin used for cross-margin positions."},"withdrawable":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount available for withdrawal."},"assetPositions":{"type":"array","items":{"type":"object","properties":{"type":{"description":"Position type.","enum":["oneWay"]},"position":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"szi":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Signed position size."},"leverage":{"oneOf":[{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["isolated"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."},"rawUsd":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount of USD used (1 = $1)."}},"required":["type","value","rawUsd"]},{"type":"object","properties":{"type":{"description":"Leverage type.","enum":["cross"]},"value":{"type":"number","minimum":1,"description":"Leverage value used."}},"required":["type","value"]}],"description":"Leverage details."},"entryPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average entry price."},"positionValue":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Position value."},"unrealizedPnl":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Unrealized profit and loss."},"returnOnEquity":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Return on equity."},"liquidationPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Liquidation price."},"marginUsed":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Margin used."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"cumFunding":{"type":"object","properties":{"allTime":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Total funding paid or received since account opening."},"sinceOpen":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the position was opened."},"sinceChange":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding accumulated since the last change in position size."}},"required":["allTime","sinceOpen","sinceChange"],"description":"Cumulative funding details."}},"required":["coin","szi","leverage","entryPx","positionValue","unrealizedPnl","returnOnEquity","liquidationPx","marginUsed","maxLeverage","cumFunding"],"description":"Position details."}},"required":["type","position"]},"description":"Array of asset positions."},"time":{"type":"number","minimum":0,"description":"Timestamp when data was retrieved (in ms since epoch)."}},"required":["marginSummary","crossMarginSummary","crossMaintenanceMarginUsed","withdrawable","assetPositions","time"],"description":"Account summary for perpetual trading."},"leadingVaults":{"type":"array","items":{"type":"object","properties":{"address":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."},"name":{"type":"string","description":"Vault name."}},"required":["address","name"]},"description":"Array of leading vaults for a user."},"totalVaultEquity":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total equity in vaults."},"openOrders":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"limitPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Limit price."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"timestamp":{"type":"number","minimum":0,"description":"Timestamp when the order was placed (in ms since epoch)."},"origSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Original size at order placement."},"triggerCondition":{"type":"string","description":"Condition for triggering the order."},"isTrigger":{"type":"boolean","description":"Indicates if the order is a trigger order."},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"children":{"type":"array","items":{},"description":"Child orders associated with this order."},"isPositionTpsl":{"type":"boolean","description":"Indicates if the order is a position TP/SL order."},"reduceOnly":{"type":"boolean","description":"Indicates whether the order is reduce-only."},"orderType":{"enum":["Market","Limit","Stop Market","Stop Limit","Take Profit Market","Take Profit Limit"],"description":"Order type for market execution.\n- `\"Market\"`: Executes immediately at the market price.\n- `\"Limit\"`: Executes at the specified limit price or better.\n- `\"Stop Market\"`: Activates as a market order when a stop price is reached.\n- `\"Stop Limit\"`: Activates as a limit order when a stop price is reached.\n- `\"Take Profit Market\"`: Executes as a market order when a take profit price is reached.\n- `\"Take Profit Limit\"`: Executes as a limit order when a take profit price is reached. "},"tif":{"anyOf":[{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"nullable":true}],"description":"Time-in-force:\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."},"cloid":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"nullable":true}],"description":"Client Order ID."}},"required":["coin","side","limitPx","sz","oid","timestamp","origSz","triggerCondition","isTrigger","triggerPx","children","isPositionTpsl","reduceOnly","orderType","tif","cloid"],"description":"Open order with additional display information."},"description":"Array of open orders with additional display information."},"agentAddress":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Agent address if one exists."},"agentValidUntil":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Timestamp until which the agent is valid."},"cumLedger":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Cumulative ledger value."},"meta":{"type":"object","properties":{"universe":{"type":"array","items":{"type":"object","properties":{"szDecimals":{"type":"number","minimum":0,"description":"Minimum decimal places for order sizes."},"name":{"type":"string","description":"Name of the universe."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage."},"marginTableId":{"type":"number","minimum":0,"description":"Unique identifier for the margin requirements table."},"onlyIsolated":{"description":"Indicates if only isolated margin trading is allowed.","enum":[true]},"isDelisted":{"description":"Indicates if the universe is delisted.","enum":[true]},"marginMode":{"enum":["strictIsolated","noCross"],"description":"Trading margin mode constraint."},"growthMode":{"description":"Indicates if growth mode is enabled.","enum":["enabled"]},"lastGrowthModeChangeTime":{"type":"string","pattern":"^\\d{4}-(?:0[1-9]|1[0-2])-(?:[12]\\d|0[1-9]|3[01])[T ](?:0\\d|1\\d|2[0-3])(?::[0-5]\\d){2}(?:\\.\\d{1,9})?$","description":"Timestamp of the last growth mode change."}},"required":["szDecimals","name","maxLeverage","marginTableId"]},"description":"Trading universes available for perpetual trading."},"marginTables":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"description":{"type":"string","description":"Description of the margin table."},"marginTiers":{"type":"array","items":{"type":"object","properties":{"lowerBound":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Lower position size boundary for this tier."},"maxLeverage":{"type":"number","minimum":1,"description":"Maximum allowed leverage for this tier."}},"required":["lowerBound","maxLeverage"]},"description":"Array of margin tiers defining leverage limits."}},"required":["description","marginTiers"],"description":"Margin requirements table with multiple tiers."}],"minItems":2},"description":"Margin requirement tables for different leverage tiers."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."}},"required":["universe","marginTables","collateralToken"],"description":"Metadata for perpetual assets."},"assetCtxs":{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"funding":{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","description":"Funding rate."},"openInterest":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total open interest."},"premium":{"anyOf":[{"type":"string","pattern":"^-?[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Premium price."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Oracle price."},"impactPxs":{"anyOf":[{"type":"array","items":{"type":"string"},"nullable":true}],"description":"Array of impact prices."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","funding","openInterest","premium","oraclePx","impactPxs","dayBaseVlm"],"description":"Perpetual asset context."},"description":"Array of contexts for each perpetual asset."},"serverTime":{"type":"number","minimum":0,"description":"Server timestamp (in ms since epoch)."},"isVault":{"type":"boolean","description":"Whether this account is a vault."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."},"twapStates":{"type":"array","items":{"type":"array","items":[{"type":"number","minimum":0},{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"executedNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed notional value."},"executedSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Executed size."},"minutes":{"type":"number","minimum":0,"description":"Duration in minutes."},"randomize":{"type":"boolean","description":"Indicates if the TWAP randomizes execution."},"reduceOnly":{"type":"boolean","description":"Indicates if the order is reduce-only."},"side":{"enum":["B","A"],"description":"Order side (\"B\" = Bid/Buy, \"A\" = Ask/Sell)."},"sz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Order size."},"timestamp":{"type":"number","minimum":0,"description":"Start time of the TWAP order (in ms since epoch)."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"User address."}},"required":["coin","executedNtl","executedSz","minutes","randomize","reduceOnly","side","sz","timestamp","user"],"description":"TWAP order state."}],"minItems":2},"description":"Array of tuples containing TWAP order ID and its state."},"spotState":{"type":"object","properties":{"balances":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."},"hold":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount on hold."},"entryNtl":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Entry notional value."}},"required":["coin","token","total","hold","entryNtl"]},"description":"Array of available token balances."},"evmEscrows":{"type":"array","items":{"type":"object","properties":{"coin":{"type":"string","description":"Asset symbol."},"token":{"type":"number","minimum":0,"description":"Unique identifier for the token."},"total":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total balance."}},"required":["coin","token","total"]},"description":"Array of escrowed balances."}},"required":["balances"],"description":"Account summary for spot trading."},"spotAssetCtxs":{"type":"array","items":{"type":"object","properties":{"prevDayPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Previous day's closing price."},"dayNtlVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily notional volume."},"markPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Mark price."},"midPx":{"anyOf":[{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","nullable":true}],"description":"Mid price."},"circulatingSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Circulating supply."},"coin":{"type":"string","description":"Asset symbol."},"totalSupply":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total supply."},"dayBaseVlm":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Daily volume in base currency."}},"required":["prevDayPx","dayNtlVlm","markPx","midPx","circulatingSupply","coin","totalSupply","dayBaseVlm"],"description":"Spot asset context."},"description":"Asset context for each spot asset."},"optOutOfSpotDusting":{"description":"Whether the user has opted out of spot dusting.","enum":[true]},"perpsAtOpenInterestCap":{"type":"array","items":{"type":"string"},"description":"Assets currently at their open interest cap."}},"required":["clearinghouseState","leadingVaults","totalVaultEquity","openOrders","agentAddress","agentValidUntil","cumLedger","meta","assetCtxs","serverTime","isVault","user","twapStates","spotAssetCtxs"],"description":"Comprehensive user and market data."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}},"500":{"description":"Internal Server Error","content":{"application/json":{"schema":{"type":"null"}}}}}}}}}
```


# Exchange Methods


# agentEnableDexAbstraction

## POST /exchange

> Enable HIP-3 DEX abstraction.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/agentEnableDexAbstraction","version":"1.0.0"},"tags":[{"name":"agentEnableDexAbstraction"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["agentEnableDexAbstraction"],"description":"Enable HIP-3 DEX abstraction.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["agentEnableDexAbstraction"]}},"required":["type"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Enable HIP-3 DEX abstraction."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# approveAgent

## POST /exchange

> Approve an agent to sign on behalf of the master account.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/approveAgent","version":"1.0.0"},"tags":[{"name":"approveAgent"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["approveAgent"],"description":"Approve an agent to sign on behalf of the master account.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["approveAgent"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"agentAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Agent address."},"agentName":{"anyOf":[{"type":"string","minLength":1,"maxLength":17,"nullable":true}],"description":"Agent name or null for unnamed agent."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","agentAddress","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Approve an agent to sign on behalf of the master account."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# approveBuilderFee

## POST /exchange

> Approve a maximum fee rate for a builder.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/approveBuilderFee","version":"1.0.0"},"tags":[{"name":"approveBuilderFee"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["approveBuilderFee"],"description":"Approve a maximum fee rate for a builder.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["approveBuilderFee"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"maxFeeRate":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?%$","description":"Max fee rate (e.g., \"0.01%\")."},"builder":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Builder address."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","maxFeeRate","builder","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Approve a maximum fee rate for a builder."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# batchModify

## POST /exchange

> Modify multiple orders.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/batchModify","version":"1.0.0"},"tags":[{"name":"batchModify"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["batchModify"],"description":"Modify multiple orders.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["batchModify"]},"modifies":{"type":"array","items":{"type":"object","properties":{"oid":{"anyOf":[{"type":"number","minimum":0},{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34}],"description":"Order ID or Client Order ID."},"order":{"type":"object","properties":{"a":{"type":"number","minimum":0,"description":"Asset ID."},"b":{"type":"boolean","description":"Position side (`true` for long, `false` for short)."},"p":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"s":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size (in base currency units)."},"r":{"type":"boolean","description":"Is reduce-only?"},"t":{"anyOf":[{"type":"object","properties":{"limit":{"type":"object","properties":{"tif":{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"description":"Time-in-force.\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."}},"required":["tif"],"description":"Limit order parameters."}},"required":["limit"]},{"type":"object","properties":{"trigger":{"type":"object","properties":{"isMarket":{"type":"boolean","description":"Is market order?"},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"tpsl":{"enum":["tp","sl"],"description":"Indicates whether it is take profit or stop loss."}},"required":["isMarket","triggerPx","tpsl"],"description":"Trigger order parameters."}},"required":["trigger"]}],"description":"Order type (`limit` for limit orders, `trigger` for stop-loss/take-profit orders)."},"c":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["a","b","p","s","r","t"],"description":"New order parameters."}},"required":["oid","order"]},"description":"Order modifications."}},"required":["type","modifies"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Modify multiple orders."}}},"required":true},"responses":{"200":{"description":"Response for order batch modifications.","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["order"]},"data":{"type":"object","properties":{"statuses":{"type":"array","items":{"anyOf":[{"type":"object","properties":{"resting":{"type":"object","properties":{"oid":{"type":"number","minimum":0,"description":"Order ID."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["oid"],"description":"Resting order status."}},"required":["resting"]},{"type":"object","properties":{"filled":{"type":"object","properties":{"totalSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size filled."},"avgPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average price of fill."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["totalSz","avgPx","oid"],"description":"Filled order status."}},"required":["filled"]},{"type":"object","properties":{"error":{"type":"string","description":"Error message."}},"required":["error"]},{"enum":["waitingForFill"]},{"enum":["waitingForTrigger"]}]},"description":"Array of statuses for each placed order."}},"required":["statuses"],"description":"Specific data."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"],"description":"Response for order batch modifications."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# cDeposit

## POST /exchange

> Transfer native token from the user spot account into staking for delegating to validators.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/cDeposit","version":"1.0.0"},"tags":[{"name":"cDeposit"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["cDeposit"],"description":"Transfer native token from the user spot account into staking for delegating to validators.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["cDeposit"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"wei":{"type":"number","minimum":1,"description":"Amount of wei to deposit into staking balance (float * 1e8)."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","wei","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Transfer native token from the user spot account into staking for delegating to validators."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# cSignerAction

## POST /exchange

> Jail or unjail self as a validator signer.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/cSignerAction","version":"1.0.0"},"tags":[{"name":"cSignerAction"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["cSignerAction"],"description":"Jail or unjail self as a validator signer.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"anyOf":[{"type":"object","properties":{"type":{"description":"Type of action.","enum":["CSignerAction"]},"jailSelf":{"description":"Jail the signer.","nullable":true}},"required":["type","jailSelf"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["CSignerAction"]},"unjailSelf":{"description":"Unjail the signer.","nullable":true}},"required":["type","unjailSelf"]}],"description":"Action to jail or unjail the signer."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Jail or unjail self as a validator signer."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# cValidatorAction

## POST /exchange

> Action related to validator management.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/cValidatorAction","version":"1.0.0"},"tags":[{"name":"cValidatorAction"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["cValidatorAction"],"description":"Action related to validator management.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"anyOf":[{"type":"object","properties":{"type":{"description":"Type of action.","enum":["CValidatorAction"]},"changeProfile":{"type":"object","properties":{"node_ip":{"anyOf":[{"type":"object","properties":{"Ip":{"type":"string","description":"IP address."}},"required":["Ip"],"nullable":true}],"description":"Validator node IP address."},"name":{"anyOf":[{"type":"string","nullable":true}],"description":"Validator name."},"description":{"anyOf":[{"type":"string","nullable":true}],"description":"Validator description."},"unjailed":{"type":"boolean","description":"Whether the validator is unjailed."},"disable_delegations":{"anyOf":[{"type":"boolean","nullable":true}],"description":"Enable or disable delegations."},"commission_bps":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Commission rate in basis points (1 = 0.0001%)."},"signer":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"Signer address."}},"required":["node_ip","name","description","unjailed","disable_delegations","commission_bps","signer"],"description":"Profile changes to apply."}},"required":["type","changeProfile"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["CValidatorAction"]},"register":{"type":"object","properties":{"profile":{"type":"object","properties":{"node_ip":{"type":"object","properties":{"Ip":{"type":"string","description":"IP address."}},"required":["Ip"],"description":"Validator node IP address."},"name":{"type":"string","description":"Validator name."},"description":{"type":"string","description":"Validator description."},"delegations_disabled":{"type":"boolean","description":"Whether delegations are disabled."},"commission_bps":{"type":"number","minimum":0,"description":"Commission rate in basis points (1 = 0.0001%)."},"signer":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Signer address."}},"required":["node_ip","name","description","delegations_disabled","commission_bps","signer"],"description":"Validator profile information."},"unjailed":{"type":"boolean","description":"Initial jail status."},"initial_wei":{"type":"number","minimum":0,"description":"Initial stake amount in wei."}},"required":["profile","unjailed","initial_wei"],"description":"Registration parameters."}},"required":["type","register"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["CValidatorAction"]},"unregister":{"description":"Unregister the validator.","nullable":true}},"required":["type","unregister"]}],"description":"Validator management action."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Action related to validator management."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# cWithdraw

## POST /exchange

> Transfer native token from staking into the user's spot account.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/cWithdraw","version":"1.0.0"},"tags":[{"name":"cWithdraw"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["cWithdraw"],"description":"Transfer native token from staking into the user's spot account.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["cWithdraw"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"wei":{"type":"number","minimum":1,"description":"Amount of wei to withdraw from staking balance (float * 1e8)."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","wei","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Transfer native token from staking into the user's spot account."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# cancel

## POST /exchange

> Cancel order(s).

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/cancel","version":"1.0.0"},"tags":[{"name":"cancel"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["cancel"],"description":"Cancel order(s).","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["cancel"]},"cancels":{"type":"array","items":{"type":"object","properties":{"a":{"type":"number","minimum":0,"description":"Asset ID."},"o":{"type":"number","minimum":0,"description":"Order ID."}},"required":["a","o"]},"description":"Orders to cancel by asset and order ID."}},"required":["type","cancels"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Cancel order(s)."}}},"required":true},"responses":{"200":{"description":"Response for order cancellation.","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["cancel"]},"data":{"type":"object","properties":{"statuses":{"type":"array","items":{"anyOf":[{"enum":["success"]},{"type":"object","properties":{"error":{"type":"string","description":"Error message returned by the exchange."}},"required":["error"]}]},"description":"Array of statuses for each canceled order."}},"required":["statuses"],"description":"Specific data."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"],"description":"Response for order cancellation."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# cancelByCloid

## POST /exchange

> Cancel order(s) by cloid.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/cancelByCloid","version":"1.0.0"},"tags":[{"name":"cancelByCloid"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["cancelByCloid"],"description":"Cancel order(s) by cloid.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["cancelByCloid"]},"cancels":{"type":"array","items":{"type":"object","properties":{"asset":{"type":"number","minimum":0,"description":"Asset ID."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["asset","cloid"]},"description":"Orders to cancel by asset and client order ID."}},"required":["type","cancels"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Cancel order(s) by cloid."}}},"required":true},"responses":{"200":{"description":"Response for order cancellation by cloid.","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["cancel"]},"data":{"type":"object","properties":{"statuses":{"type":"array","items":{"anyOf":[{"enum":["success"]},{"type":"object","properties":{"error":{"type":"string","description":"Error message returned by the exchange."}},"required":["error"]}]},"description":"Array of statuses for each canceled order."}},"required":["statuses"],"description":"Specific data."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"],"description":"Response for order cancellation by cloid."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# claimRewards

## POST /exchange

> Claim rewards from referral program.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/claimRewards","version":"1.0.0"},"tags":[{"name":"claimRewards"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["claimRewards"],"description":"Claim rewards from referral program.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["claimRewards"]}},"required":["type"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Claim rewards from referral program."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# convertToMultiSigUser

## POST /exchange

> Convert a single-signature account to a multi-signature account or vice versa.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/convertToMultiSigUser","version":"1.0.0"},"tags":[{"name":"convertToMultiSigUser"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["convertToMultiSigUser"],"description":"Convert a single-signature account to a multi-signature account or vice versa.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["convertToMultiSigUser"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"signers":{"anyOf":[{"anyOf":[{"type":"object","properties":{"authorizedUsers":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"List of authorized user addresses."},"threshold":{"type":"number","minimum":1,"maximum":10,"description":"Minimum number of signatures required."}},"required":["authorizedUsers","threshold"],"nullable":true}],"description":"Multi-sig config or `null` to revert to single-sig."},{"anyOf":[{"type":"object","properties":{"authorizedUsers":{"type":"array","items":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42},"description":"List of authorized user addresses."},"threshold":{"type":"number","minimum":1,"maximum":10,"description":"Minimum number of signatures required."}},"required":["authorizedUsers","threshold"],"nullable":true}],"description":"Multi-sig config or `null` to revert to single-sig."}],"description":"Signers configuration.\n\nMust be `ConvertToMultiSigUserRequestSignersSchema` converted to a string via `JSON.stringify(...)`."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","signers","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Convert a single-signature account to a multi-signature account or vice versa."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# createSubAccount

## POST /exchange

> Create a sub-account.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/createSubAccount","version":"1.0.0"},"tags":[{"name":"createSubAccount"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["createSubAccount"],"description":"Create a sub-account.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["createSubAccount"]},"name":{"type":"string","minLength":1,"maxLength":16,"description":"Sub-account name."}},"required":["type","name"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Create a sub-account."}}},"required":true},"responses":{"200":{"description":"Response for creating a sub-account.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["createSubAccount"]},"data":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-account address."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"]},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Response for creating a sub-account."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# createVault

## POST /exchange

> Create a vault.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/createVault","version":"1.0.0"},"tags":[{"name":"createVault"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["createVault"],"description":"Create a vault.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["createVault"]},"name":{"type":"string","minLength":3,"maxLength":50,"description":"Vault name."},"description":{"type":"string","minLength":10,"maxLength":250,"description":"Vault description."},"initialUsd":{"type":"number","minimum":100000000,"description":"Initial balance (float * 1e6)."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","name","description","initialUsd","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Create a vault."}}},"required":true},"responses":{"200":{"description":"Response for creating a vault.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["createVault"]},"data":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"]},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Response for creating a vault."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# evmUserModify

## POST /exchange

> Configure block type for EVM transactions.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/evmUserModify","version":"1.0.0"},"tags":[{"name":"evmUserModify"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["evmUserModify"],"description":"Configure block type for EVM transactions.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["evmUserModify"]},"usingBigBlocks":{"type":"boolean","description":"`true` for large blocks, `false` for small blocks."}},"required":["type","usingBigBlocks"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Configure block type for EVM transactions."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# linkStakingUser

## POST /exchange

> Link staking and trading accounts for fee discount attribution.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/linkStakingUser","version":"1.0.0"},"tags":[{"name":"linkStakingUser"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["linkStakingUser"],"description":"Link staking and trading accounts for fee discount attribution.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["linkStakingUser"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Target account address.\n- Trading user initiating: enter staking account address.\n- Staking user finalizing: enter trading account address."},"isFinalize":{"type":"boolean","description":"Link phase.\n- `false` = trading user initiates link request.\n- `true` = staking user finalizes permanent link."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","user","isFinalize","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Link staking and trading accounts for fee discount attribution."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# modify

## POST /exchange

> Modify an order.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/modify","version":"1.0.0"},"tags":[{"name":"modify"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["modify"],"description":"Modify an order.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["modify"]},"oid":{"anyOf":[{"type":"number","minimum":0},{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34}],"description":"Order ID or Client Order ID."},"order":{"type":"object","properties":{"a":{"type":"number","minimum":0,"description":"Asset ID."},"b":{"type":"boolean","description":"Position side (`true` for long, `false` for short)."},"p":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"s":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size (in base currency units)."},"r":{"type":"boolean","description":"Is reduce-only?"},"t":{"anyOf":[{"type":"object","properties":{"limit":{"type":"object","properties":{"tif":{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"description":"Time-in-force.\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."}},"required":["tif"],"description":"Limit order parameters."}},"required":["limit"]},{"type":"object","properties":{"trigger":{"type":"object","properties":{"isMarket":{"type":"boolean","description":"Is market order?"},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"tpsl":{"enum":["tp","sl"],"description":"Indicates whether it is take profit or stop loss."}},"required":["isMarket","triggerPx","tpsl"],"description":"Trigger order parameters."}},"required":["trigger"]}],"description":"Order type (`limit` for limit orders, `trigger` for stop-loss/take-profit orders)."},"c":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["a","b","p","s","r","t"],"description":"New order parameters."}},"required":["type","oid","order"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Modify an order."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# noop

## POST /exchange

> This action does not do anything (no operation), but causes the nonce to be marked as used.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/noop","version":"1.0.0"},"tags":[{"name":"noop"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["noop"],"description":"This action does not do anything (no operation), but causes the nonce to be marked as used.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["noop"]}},"required":["type"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"This action does not do anything (no operation), but causes the nonce to be marked as used."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# order

## POST /exchange

> Place an order(s).

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/order","version":"1.0.0"},"tags":[{"name":"order"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["order"],"description":"Place an order(s).","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["order"]},"orders":{"type":"array","items":{"type":"object","properties":{"a":{"type":"number","minimum":0,"description":"Asset ID."},"b":{"type":"boolean","description":"Position side (`true` for long, `false` for short)."},"p":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Price."},"s":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Size (in base currency units)."},"r":{"type":"boolean","description":"Is reduce-only?"},"t":{"anyOf":[{"type":"object","properties":{"limit":{"type":"object","properties":{"tif":{"enum":["Gtc","Ioc","Alo","FrontendMarket","LiquidationMarket"],"description":"Time-in-force.\n- `\"Gtc\"`: Remains active until filled or canceled.\n- `\"Ioc\"`: Fills immediately or cancels any unfilled portion.\n- `\"Alo\"`: Adds liquidity only.\n- `\"FrontendMarket\"`: Similar to Ioc, used in Hyperliquid UI.\n- `\"LiquidationMarket\"`: Similar to Ioc, used in Hyperliquid UI."}},"required":["tif"],"description":"Limit order parameters."}},"required":["limit"]},{"type":"object","properties":{"trigger":{"type":"object","properties":{"isMarket":{"type":"boolean","description":"Is market order?"},"triggerPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Trigger price."},"tpsl":{"enum":["tp","sl"],"description":"Indicates whether it is take profit or stop loss."}},"required":["isMarket","triggerPx","tpsl"],"description":"Trigger order parameters."}},"required":["trigger"]}],"description":"Order type (`limit` for limit orders, `trigger` for stop-loss/take-profit orders)."},"c":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["a","b","p","s","r","t"]},"description":"Array of order parameters."},"grouping":{"enum":["na","normalTpsl","positionTpsl"],"description":"Order grouping strategy:\n- `na`: Standard order without grouping.\n- `normalTpsl`: TP/SL order with fixed size that doesn't adjust with position changes.\n- `positionTpsl`: TP/SL order that adjusts proportionally with the position size."},"builder":{"type":"object","properties":{"b":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Builder address."},"f":{"type":"number","minimum":0,"maximum":1000,"description":"Builder fee in 0.1bps (1 = 0.0001%). Max 100 for perps (0.1%), 1000 for spot (1%)."}},"required":["b","f"],"description":"Builder fee."}},"required":["type","orders"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Place an order(s)."}}},"required":true},"responses":{"200":{"description":"Response for order placement.","content":{"application/json":{"schema":{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["order"]},"data":{"type":"object","properties":{"statuses":{"type":"array","items":{"anyOf":[{"type":"object","properties":{"resting":{"type":"object","properties":{"oid":{"type":"number","minimum":0,"description":"Order ID."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["oid"],"description":"Resting order status."}},"required":["resting"]},{"type":"object","properties":{"filled":{"type":"object","properties":{"totalSz":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Total size filled."},"avgPx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Average price of fill."},"oid":{"type":"number","minimum":0,"description":"Order ID."},"cloid":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":34,"maxLength":34,"description":"Client Order ID."}},"required":["totalSz","avgPx","oid"],"description":"Filled order status."}},"required":["filled"]},{"type":"object","properties":{"error":{"type":"string","description":"Error message."}},"required":["error"]},{"enum":["waitingForFill"]},{"enum":["waitingForTrigger"]}]},"description":"Array of statuses for each placed order."}},"required":["statuses"],"description":"Specific data."}},"required":["type","data"],"description":"Response details."}},"required":["status","response"],"description":"Response for order placement."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# perpDeploy

## POST /exchange

> Deploying HIP-3 assets.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/perpDeploy","version":"1.0.0"},"tags":[{"name":"perpDeploy"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["perpDeploy"],"description":"Deploying HIP-3 assets.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"anyOf":[{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"registerAsset2":{"type":"object","properties":{"maxGas":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Max gas in native token wei. If not provided, then uses current deploy auction price."},"assetRequest":{"type":"object","properties":{"coin":{"type":"string","description":"Coin symbol for the new asset."},"szDecimals":{"type":"number","minimum":0,"description":"Number of decimal places for size."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Initial oracle price for the asset."},"marginTableId":{"type":"number","minimum":0,"description":"Margin table identifier for risk management."},"marginMode":{"enum":["strictIsolated","noCross"],"description":"'strictIsolated' does not allow withdrawing of isolated margin from open position."}},"required":["coin","szDecimals","oraclePx","marginTableId","marginMode"],"description":"Contains new asset listing parameters."},"dex":{"type":"string","description":"Name of the dex."},"schema":{"anyOf":[{"type":"object","properties":{"fullName":{"type":"string","description":"Full name of the dex."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."},"oracleUpdater":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"User to update oracles. If not provided, then deployer is assumed to be oracle updater."}},"required":["fullName","collateralToken","oracleUpdater"],"nullable":true}],"description":"Contains new dex parameters."}},"required":["maxGas","assetRequest","dex","schema"],"description":"Parameters for registering a new perpetual asset (v2)."}},"required":["type","registerAsset2"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"registerAsset":{"type":"object","properties":{"maxGas":{"anyOf":[{"type":"number","minimum":0,"nullable":true}],"description":"Max gas in native token wei. If not provided, then uses current deploy auction price."},"assetRequest":{"type":"object","properties":{"coin":{"type":"string","description":"Coin symbol for the new asset."},"szDecimals":{"type":"number","minimum":0,"description":"Number of decimal places for size."},"oraclePx":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Initial oracle price for the asset."},"marginTableId":{"type":"number","minimum":0,"description":"Margin table identifier for risk management."},"onlyIsolated":{"type":"boolean","description":"Whether the asset can only be traded with isolated margin."}},"required":["coin","szDecimals","oraclePx","marginTableId","onlyIsolated"],"description":"Contains new asset listing parameters."},"dex":{"type":"string","description":"Name of the dex."},"schema":{"anyOf":[{"type":"object","properties":{"fullName":{"type":"string","description":"Full name of the dex."},"collateralToken":{"type":"number","minimum":0,"description":"Collateral token index."},"oracleUpdater":{"anyOf":[{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"nullable":true}],"description":"User to update oracles. If not provided, then deployer is assumed to be oracle updater."}},"required":["fullName","collateralToken","oracleUpdater"],"nullable":true}],"description":"Contains new dex parameters."}},"required":["maxGas","assetRequest","dex","schema"],"description":"Parameters for registering a new perpetual asset."}},"required":["type","registerAsset"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setOracle":{"type":"object","properties":{"dex":{"type":"string","description":"Name of the dex."},"oraclePxs":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"A list (sorted by key) of asset and oracle prices."},"markPxs":{"type":"array","items":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2}},"description":"An outer list of inner lists (inner list sorted by key) of asset and mark prices."},"externalPerpPxs":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"A list (sorted by key) of asset and external prices which prevent sudden mark price deviations."}},"required":["dex","oraclePxs","markPxs","externalPerpPxs"],"description":"Parameters for setting oracle and mark prices for assets."}},"required":["type","setOracle"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setFundingMultipliers":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$"}],"minItems":2},"description":"A list (sorted by key) of asset and funding multiplier."}},"required":["type","setFundingMultipliers"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"haltTrading":{"type":"object","properties":{"coin":{"type":"string","description":"Coin symbol for the asset to halt or resume."},"isHalted":{"type":"boolean","description":"Whether trading should be halted (true) or resumed (false)."}},"required":["coin","isHalted"],"description":"Parameters for halting or resuming trading for an asset."}},"required":["type","haltTrading"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setMarginTableIds":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"number","minimum":0}],"minItems":2},"description":"A list (sorted by key) of asset and margin table ids."}},"required":["type","setMarginTableIds"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setFeeRecipient":{"type":"object","properties":{"dex":{"type":"string","description":"Name of the DEX."},"feeRecipient":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Address of the fee recipient."}},"required":["dex","feeRecipient"],"description":"Parameters for setting the fee recipient."}},"required":["type","setFeeRecipient"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setOpenInterestCaps":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"number","minimum":0}],"minItems":2},"description":"A list (sorted by key) of asset and open interest cap notionals."}},"required":["type","setOpenInterestCaps"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setSubDeployers":{"type":"object","properties":{"dex":{"type":"string","description":"Name of the DEX."},"subDeployers":{"type":"array","items":{"type":"object","properties":{"variant":{"type":"string","description":"Corresponds to a variant of PerpDeployAction."},"user":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Sub-deployer address."},"allowed":{"type":"boolean","description":"Add or remove the subDeployer from the authorized set for the action variant."}},"required":["variant","user","allowed"]},"description":"A modification to sub-deployer permissions."}},"required":["dex","subDeployers"],"description":"A modification to sub-deployer permissions."}},"required":["type","setSubDeployers"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setMarginModes":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"enum":["strictIsolated","noCross"]}],"minItems":2},"description":"A list (sorted by key) of asset and margin modes."}},"required":["type","setMarginModes"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setFeeScale":{"type":"object","properties":{"dex":{"type":"string","description":"Name of the dex."},"scale":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Fee scale (between 0.0 and 3.0)."}},"required":["dex","scale"],"description":"Set fee scale."}},"required":["type","setFeeScale"]},{"type":"object","properties":{"type":{"description":"Type of action.","enum":["perpDeploy"]},"setGrowthModes":{"type":"array","items":{"type":"array","items":[{"type":"string"},{"type":"boolean"}],"minItems":2},"description":"A list (sorted by key) of asset and growth modes."}},"required":["type","setGrowthModes"]}],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Deploying HIP-3 assets."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# registerReferrer

## POST /exchange

> Create a referral code.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/registerReferrer","version":"1.0.0"},"tags":[{"name":"registerReferrer"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["registerReferrer"],"description":"Create a referral code.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["registerReferrer"]},"code":{"type":"string","minLength":1,"maxLength":20,"description":"Referral code to create."}},"required":["type","code"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Create a referral code."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# reserveRequestWeight

## POST /exchange

> Reserve additional rate-limited actions for a fee.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/reserveRequestWeight","version":"1.0.0"},"tags":[{"name":"reserveRequestWeight"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["reserveRequestWeight"],"description":"Reserve additional rate-limited actions for a fee.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["reserveRequestWeight"]},"weight":{"type":"number","minimum":0,"maximum":1844674407370955,"description":"Amount of request weight to reserve."}},"required":["type","weight"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Reserve additional rate-limited actions for a fee."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# scheduleCancel

## POST /exchange

> Schedule a cancel-all operation at a future time.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/scheduleCancel","version":"1.0.0"},"tags":[{"name":"scheduleCancel"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["scheduleCancel"],"description":"Schedule a cancel-all operation at a future time.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["scheduleCancel"]},"time":{"type":"number","minimum":0,"description":"Scheduled time (in ms since epoch).\nMust be at least 5 seconds in the future.\n\nIf not specified, will cause all scheduled cancel operations to be deleted."}},"required":["type"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"vaultAddress":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Vault address (for vault trading)."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Schedule a cancel-all operation at a future time."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# sendAsset

## POST /exchange

> Transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/sendAsset","version":"1.0.0"},"tags":[{"name":"sendAsset"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["sendAsset"],"description":"Transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["sendAsset"]},"signatureChainId":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","description":"Chain ID in hex format for EIP-712 signing."},"hyperliquidChain":{"enum":["Mainnet","Testnet"],"description":"HyperLiquid network type."},"destination":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42,"description":"Destination address."},"sourceDex":{"type":"string","description":"Source DEX (\"\" for default USDC perp DEX, \"spot\" for spot)."},"destinationDex":{"type":"string","description":"Destination DEX (\"\" for default USDC perp DEX, \"spot\" for spot)."},"token":{"type":"string","description":"Token identifier."},"amount":{"type":"string","pattern":"^[0-9]+(\\.[0-9]+)?$","description":"Amount to send (not in wei)."},"fromSubAccount":{"anyOf":[{"enum":[""]},{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":42,"maxLength":42}],"description":"Source sub-account address (\"\" for main account)."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."}},"required":["type","signatureChainId","hyperliquidChain","destination","sourceDex","destinationDex","token","amount","nonce"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."}},"required":["action","nonce","signature"],"description":"Transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```


# setDisplayName

## POST /exchange

> Set the display name in the leaderboard.

```json
{"openapi":"3.1.1","info":{"title":"Hyperliquid API - exchange/setDisplayName","version":"1.0.0"},"tags":[{"name":"setDisplayName"}],"servers":[{"url":"https://api.hyperliquid.xyz","description":"Mainnet"},{"url":"https://api.hyperliquid-testnet.xyz","description":"Testnet"}],"paths":{"/exchange":{"post":{"tags":["setDisplayName"],"description":"Set the display name in the leaderboard.","requestBody":{"content":{"application/json":{"schema":{"type":"object","properties":{"action":{"type":"object","properties":{"type":{"description":"Type of action.","enum":["setDisplayName"]},"displayName":{"type":"string","maxLength":20,"description":"Display name.\nSet to an empty string to remove the display name."}},"required":["type","displayName"],"description":"Action to perform."},"nonce":{"type":"number","minimum":0,"description":"Nonce (timestamp in ms) used to prevent replay attacks."},"signature":{"type":"object","properties":{"r":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"First 32-byte component."},"s":{"type":"string","pattern":"^0[xX][0-9a-fA-F]+$","minLength":66,"maxLength":66,"description":"Second 32-byte component."},"v":{"enum":[27,28],"description":"Recovery identifier."}},"required":["r","s","v"],"description":"ECDSA signature components."},"expiresAfter":{"type":"number","minimum":0,"description":"Expiration time of the action."}},"required":["action","nonce","signature"],"description":"Set the display name in the leaderboard."}}},"required":true},"responses":{"200":{"description":"Successful response without specific data or error response.","content":{"application/json":{"schema":{"anyOf":[{"type":"object","properties":{"status":{"description":"Successful status.","enum":["ok"]},"response":{"type":"object","properties":{"type":{"description":"Type of response.","enum":["default"]}},"required":["type"],"description":"Response details."}},"required":["status","response"],"description":"Successful response without specific data."},{"type":"object","properties":{"status":{"description":"Error status.","enum":["err"]},"response":{"type":"string","description":"Error message."}},"required":["status","response"],"description":"Error response for failed operations."}],"description":"Successful response without specific data or error response."}}}},"422":{"description":"Failed to deserialize the JSON body into the target type","content":{"text/plain":{"schema":{"type":"string"}}}}}}}}}
```
