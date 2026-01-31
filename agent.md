# HypeTerminal - AI Agent Guide

## Project Overview

HypeTerminal is a web-based trading terminal for Hyperliquid, a decentralized perpetual exchange. It provides professional-grade trading features including real-time order books, TradingView charts, multi-wallet support, and advanced order types.

## Tech Stack

| Category | Technologies |
|----------|--------------|
| Framework | React 19, TanStack Start, TypeScript 5.7, Vite 7 |
| Routing | TanStack Router (file-based) |
| State | Zustand (persisted), TanStack Query |
| Styling | Tailwind CSS 4, Radix UI, shadcn/ui |
| Web3 | Wagmi 3, Viem, @nktkas/hyperliquid SDK |
| Charts | TradingView Charting Library |
| Forms | React Hook Form, Zod |
| i18n | Lingui (6 languages) |
| Testing | Vitest |
| Linting | Biome |

## Directory Structure

```
src/
├── components/           # React components
│   ├── trade/           # Trading UI (chart, orderbook, positions, order-entry)
│   ├── ui/              # Reusable primitives (button, dialog, input, etc.)
│   └── pages/           # Page-level components
├── config/              # App configuration and constants
├── domain/              # Business logic (calculations, derivations)
├── hooks/               # React hooks (trade/, ui/)
├── lib/                 # Utilities
│   ├── hyperliquid/     # Exchange integration (clients, hooks, signing)
│   ├── trade/           # Trading calculations (numbers, orders, orderbook)
│   ├── chart/           # TradingView datafeed
│   └── performance/     # Monitoring utilities
├── providers/           # React context providers
├── routes/              # File-based routing
├── stores/              # Zustand state stores
├── types/               # TypeScript definitions
└── locales/             # i18n translations
```

## Key Conventions

### Component Rules
- One component per file
- No index.ts barrel files - import directly
- Props interface always named `Props`
- Use function declarations over arrows
- Use `cn()` from `@/lib/cn` for class composition
- No comments - code should be self-documenting
- No console.log in production

### React Hooks
- `useEffect` - Only for side effects (subscriptions, DOM, external APIs)
- `useMemo` - Only for expensive calculations or referential equality
- `useState` - Prefer primitives over complex objects
- `useCallback` - Only when passing to memoized children

### Hyperliquid Integration
- `useInfo*` hooks - One-time data fetches
- `useSub*` hooks - Real-time WebSocket subscriptions
- `useAction*` hooks - Mutations (orders, transfers)
- Process data in `lib/`, not components

### State Management
Zustand stores in `src/stores/`:
- `useMarketStore` - Selected market, favorites
- `useOrderEntryStore` - Order form state
- `useGlobalSettingsStore` - User preferences

### Styling
- Tailwind CSS with custom color tokens in `src/styles.css`
- Radix UI for accessible primitives
- CVA for component variants
- Mobile breakpoint: 768px

## Important Files

| File | Purpose |
|------|---------|
| `src/routes/__root.tsx` | Root layout |
| `src/providers/root.tsx` | Provider composition |
| `src/config/constants.ts` | Global constants |
| `src/lib/trade/numbers.ts` | Precise arithmetic (Big.js) |
| `src/lib/hyperliquid/clients.ts` | API client singletons |
| `src/lib/format.ts` | Number/currency formatting |

## Data Flow

```
User Input → React Component → Zustand Store / React Hook Form
                                        ↓
                              TanStack Query + Hyperliquid Hooks
                                        ↓
                              HTTP/WebSocket → Hyperliquid API
```

## Commands

```bash
pnpm dev      # Start dev server (port 3000)
pnpm build    # Production build
pnpm lint     # Run Biome linter
pnpm format   # Format code
pnpm check    # Full checks (lint + format)
pnpm test     # Run tests
```

## Common Tasks

### Adding a New Component
1. Create file in appropriate directory (`components/trade/`, `components/ui/`)
2. Export with `interface Props` for props
3. Use `cn()` for conditional classes
4. Move complex logic to `lib/` utilities

### Adding a New Hook
1. Data fetching: Add to `src/lib/hyperliquid/hooks/info/`
2. Subscriptions: Add to `src/lib/hyperliquid/hooks/subscription/`
3. Mutations: Add to `src/lib/hyperliquid/hooks/exchange/`
4. UI utilities: Add to `src/hooks/ui/`

### Adding State
1. Create store in `src/stores/use-{name}-store.ts`
2. Use Zustand with persist middleware if needed
3. Add Zod schema for validation

### Working with Numbers
Always use `Big.js` for financial calculations:
```typescript
import Big from "big.js";
const result = Big(price).times(quantity).toFixed(2);
```

## Code Quality

- TypeScript strict mode enabled
- Biome for linting and formatting
- Pre-commit hooks via Lefthook:
  - `biome` - Auto-fixes imports and formatting on staged files
  - `lingui-extract` - Extracts i18n strings
  - `commitlint` - Validates commit message format
- Conventional commits enforced

## External Integrations

- **Hyperliquid API** - Exchange data and order execution
- **TradingView** - Professional charting
- **Wallet Providers** - MetaMask, WalletConnect, Coinbase, Rabby
- **Arbitrum** - Token deposits via bridge

## Performance Considerations

- Code splitting via TanStack Router lazy loading
- Virtual scrolling for large lists (TanStack Virtual)
- WebSocket batch updates for real-time data
- Bundle splitting: vendor-radix, vendor-tanstack, vendor-charts, vendor-web3
