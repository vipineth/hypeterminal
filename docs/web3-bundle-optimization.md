# Web3 Bundle Optimization (wagmi/viem)

This document covers strategies for optimizing the web3 bundle (wagmi + viem) which currently accounts for ~246KB (75KB gzip) of the initial load.

## Current State

### Bundle Breakdown

| Package | Size (approx) | Purpose |
|---------|---------------|---------|
| viem | ~150KB | Ethereum interactions |
| wagmi | ~70KB | React hooks for web3 |
| WalletConnect | ~50KB | WalletConnect connector |
| Other connectors | ~25KB | Injected, Coinbase |

### Integration Depth

wagmi is deeply integrated with **31 files** importing from it:
- Root provider wraps entire app
- Hooks used throughout for connection state
- Required even when user is not connected

---

## Why Full Lazy Loading Is Difficult

### The Provider Problem

```typescript
// wagmi hooks require WagmiProvider context
function RootProvider({ children }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}

// This hook fails without provider
function OrderEntry() {
  const { address, isConnected } = useAccount(); // Throws if no provider!
}
```

Lazy loading the entire WagmiProvider would break all hooks that check connection state.

---

## Feasible Optimizations

### 1. Tree-Shakable Imports (Already Applied)

```typescript
// ✅ Good: Specific imports
import { useAccount, useConnect } from 'wagmi';
import { arbitrum } from 'wagmi/chains';

// ❌ Bad: Barrel imports
import * as wagmi from 'wagmi';
```

**Verification:** Check build output for unused wagmi exports.

### 2. Lazy Load Heavy Connectors

WalletConnect alone is ~50KB. Load it only when needed:

```typescript
// src/config/wagmi.ts

// Current: All connectors loaded immediately
export function createWagmiConfig() {
  return createConfig({
    connectors: [
      injected(),
      coinbaseWallet(),
      walletConnect({ projectId: '...' }), // ~50KB loaded upfront
    ],
  });
}

// Optimized: Lazy load WalletConnect
export function createWagmiConfig() {
  return createConfig({
    connectors: [
      injected(), // Small, always needed
      // Load WalletConnect dynamically
      ...(typeof window !== 'undefined' ? [] : []),
    ],
  });
}

// Then load WalletConnect on demand
async function getWalletConnectConnector() {
  const { walletConnect } = await import('wagmi/connectors');
  return walletConnect({ projectId: '...' });
}
```

**Savings:** ~50KB gzip from initial load

### 3. Lazy Load Wallet Dialog

The wallet connection UI doesn't need to be in the initial bundle:

```typescript
// src/components/trade/components/wallet-dialog.tsx
// Already lazy loaded via global-modals.tsx ✅

const WalletDialog = createLazyComponent(
  () => import("./wallet-dialog"),
  "WalletDialog"
);
```

### 4. Defer Deposit Modal

The deposit modal uses heavy viem utilities:

```typescript
// Already lazy loaded ✅
const DepositModal = createLazyComponent(
  () => import("../order-entry/deposit-modal"),
  "DepositModal"
);
```

### 5. Tree-Shakable Viem Actions

Use action imports directly instead of client methods:

```typescript
// ❌ Less optimal: Client methods
import { createPublicClient } from 'viem';
const client = createPublicClient({ ... });
const balance = await client.getBalance({ address });

// ✅ More optimal: Direct action imports
import { getBalance } from 'viem/actions';
import { useClient } from 'wagmi';

const client = useClient();
const balance = await getBalance(client, { address });
```

---

## Alternative Approaches

### 1. Stub Provider Pattern

Create a minimal stub that provides mock values until wagmi loads:

```typescript
// Conceptual - requires significant refactoring

const WagmiStub = {
  useAccount: () => ({ address: undefined, isConnected: false }),
  useConnect: () => ({ connect: () => loadRealWagmi() }),
  // ... other hooks
};

// Initial load uses stubs
function RootProvider({ children }) {
  const [wagmiLoaded, setWagmiLoaded] = useState(false);

  if (!wagmiLoaded) {
    return (
      <WagmiStubContext.Provider value={WagmiStub}>
        {children}
      </WagmiStubContext.Provider>
    );
  }

  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}
```

**Complexity:** High - requires abstracting all wagmi hook usage

### 2. Server-Side Stub + Client Hydration

```typescript
// Server renders with stubs
// Client hydrates with real wagmi after initial paint

export function RootProvider({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <WagmiStubProvider>{children}</WagmiStubProvider>;
  }

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
```

**Trade-off:** Delays wallet reconnection, may cause flash

### 3. Separate Entry Points

Create separate builds:
- Main app (no wagmi)
- Wallet-connected app (with wagmi)

**Complexity:** Very high - requires architecture changes

---

## Recommended Actions

### Immediate (Low Effort)

1. **Verify tree-shaking** - Check bundle for unused exports
2. **Audit viem imports** - Use action imports where possible
3. **Confirm lazy components** - WalletDialog, DepositModal already split ✅

### Short-Term (Medium Effort)

1. **Lazy load WalletConnect connector** - ~50KB savings
2. **Lazy load CoinbaseWallet connector** - Additional savings
3. **Profile connector initialization** - May reveal quick wins

### Long-Term (High Effort)

1. **Stub provider pattern** - Major refactoring
2. **Alternative web3 library** - Evaluate lighter options
3. **Custom minimal client** - Build only what's needed

---

## Measuring Impact

```bash
# Current bundle size
pnpm build
# Check .output/public/assets/vendor-web3-*.js

# After optimization
pnpm build
pnpm perf:compare
```

---

## Bundle Size Targets

| Metric | Current | Target | Strategy |
|--------|---------|--------|----------|
| vendor-web3 | 246KB | <200KB | Lazy connectors |
| Initial JS | 1.64MB | <1.5MB | Combined optimizations |
| Gzip total | 492KB | <450KB | Tree-shaking + splitting |

---

## References

- [Lazy Load Provider Discussion](https://github.com/wevm/wagmi/discussions/32)
- [wagmi Tree-Shaking Guide](https://wagmi.sh/react/guides/viem)
- [Why wagmi](https://wagmi.sh/react/why) - Bundle size considerations
- [WalletConnect Connector](https://wagmi.sh/react/api/connectors/walletConnect)
