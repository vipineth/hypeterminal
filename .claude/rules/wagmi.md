# Wagmi Rules

Rules and best practices for using wagmi v3 in this project.

## Migration from v2 to v3

### Renamed Hooks (Account → Connection)

The framework now emphasizes "connections" over "accounts":

| v2 (Deprecated) | v3 (Use Instead) |
|-----------------|------------------|
| `useAccount` | `useConnection` |
| `useAccountEffect` | `useConnectionEffect` |
| `useSwitchAccount` | `useSwitchConnection` |

### Removed Properties

These properties no longer exist on hooks - use dedicated hooks instead:

| Removed From | Property | Use Instead |
|--------------|----------|-------------|
| `useConnect()` | `.connectors` | `useConnectors()` |
| `useReconnect()` | `.connectors` | `useConnectors()` |
| `useDisconnect()` | `.connectors` | `useConnections()` |
| `useSwitchConnection()` | `.connectors` | `useConnections()` |
| `useSwitchChain()` | `.chains` | `useChains()` |

### Mutation Function Names

All mutation hooks now use standard `mutate` and `mutateAsync` properties (TanStack Query convention):

```tsx
// v3 pattern
const { mutate, mutateAsync } = useSendTransaction();

// Rename when destructuring if needed
const { mutate: sendTx } = useSendTransaction();
```

### Connector Dependencies

Connectors are now peer dependencies - install manually:

```bash
# MetaMask
pnpm add @metamask/sdk@~0.33.1

# WalletConnect
pnpm add @walletconnect/ethereum-provider@^2.21.1

# Safe
pnpm add @safe-global/safe-apps-provider@~0.18.6 @safe-global/safe-apps-sdk@^9.1.0
```

### TypeScript Version

Minimum TypeScript version is now `5.7.3`.

## Project-Specific Patterns

### With SigningModeProvider

When using wagmi hooks with our Hyperliquid integration:

1. Wagmi hooks must be used inside `WagmiProvider`
2. Pass `address` and `walletClient` to `SigningModeProvider`
3. Use `useSigningModeContext()` for trading operations instead of raw wagmi hooks

```tsx
// In root provider (must be inside WagmiProvider):
const { address } = useConnection();
const { data: walletClient } = useWalletClient();

// In components, prefer:
const { status, isReady, approve } = useSigningModeContext();
```

### Connection State

```tsx
// v3: Use useConnection
const { address, isConnected, connector } = useConnection();

// Get all connections
const connections = useConnections();

// Get all available connectors
const connectors = useConnectors();
```

### Chain Operations

```tsx
// Get available chains
const chains = useChains();

// Switch chain
const { switchChain, isPending } = useSwitchChain();
```
