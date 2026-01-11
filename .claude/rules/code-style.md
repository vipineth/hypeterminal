---
globs: ["*.ts", "*.tsx", "*.js", "*.jsx"]
alwaysApply: true
description: Code style rules
---

## Component Structure

- **One component per file** - Each file should export one main component; small internal helpers are OK
- **No index.ts barrel files** - Import directly from the file, not through index.ts re-exports
- **Name props interface `Props`** - The main component's props interface should always be named `Props`
- **Prefer `interface` over `type`** - Use `interface Props` not `type Props` for component props
- **Prefer function declarations** - Define handlers/utilities as `function handleClick()` instead of arrow functions
- **Use `clsx` for class combining** - Always use `cn()` to combine conditional classes, not `cn()` or template literals
- **Keep components clean** - Move calculations and business logic to `lib/` utilities
- **Organize utils by domain** - Use folders like `lib/trade/`, `lib/chart/`, etc.
- **Minimize useEffect** - Only use when truly needed for side effects, not for derived state
- **No comments in components** - Logic should be self-explanatory; add comments only in lib utilities when needed
- Components should primarily handle: state, hooks, and JSX rendering

```tsx
// Good - interface Props and clsx usage
import { cn } from "@/lib/cn";

interface Props {
  value: number;
  isActive: boolean;
  className?: string;
}

export function PriceDisplay({ value, isActive, className }: Props) {
  return (
    <span className={cn("text-sm tabular-nums", isActive && "text-terminal-green", className)}>
      {value}
    </span>
  );
}

// Bad - type instead of interface, custom name, cn() usage
type PriceDisplayProps = { ... };
export function PriceDisplay({ ... }: PriceDisplayProps) {
  return <span className={cn("text-sm", isActive && "text-green")}>{value}</span>;
}
```

```tsx
// Bad - calculations in component
const bestBid = bids[0]?.price;
const bestAsk = asks[0]?.price;
const mid = Number.isFinite(bestBid) && Number.isFinite(bestAsk) ? (bestBid + bestAsk) / 2 : undefined;
const spread = Number.isFinite(bestBid) && Number.isFinite(bestAsk) ? bestAsk - bestBid : undefined;

// Good - use utility from lib/trade/orderbook.ts
const spreadInfo = useMemo(() => calculateSpreadInfo(bids, asks), [bids, asks]);
```

## Comments

- **No unnecessary comments** - Code should be self-documenting
- Only add comments when logic is genuinely non-obvious or there's important context
- Never add comments that just describe what the code does (e.g., `// set state`)
- Never add JSDoc comments unless they provide genuinely useful information beyond the types

## Console Statements

- **Never leave `console.log` in production code**
- Remove all debug logging before committing
- Use proper error handling instead of console statements

## Helper Functions

- Only create helper functions when:
  - Logic is reused in multiple places
  - Logic is complex enough to benefit from a named abstraction
  - Function significantly improves readability
- **Don't create helpers for simple one-liners**
- Prefer inline logic for straightforward operations

## Simplification

- Prefer direct expressions over intermediate variables when the expression is clear
- Chain operations when it improves readability
- Use ternary operators for simple conditional assignments

## React Hooks

### useEffect
- **Avoid useEffect for derived state** - Use direct calculations or useMemo instead
- Only use useEffect for true side effects: subscriptions, DOM manipulation, external API calls
- Never use useEffect to sync state that can be computed from other state/props

```tsx
// Bad - useEffect for derived state
const [selectedOption, setSelectedOption] = useState(null);
useEffect(() => {
  if (selectedOption === null && options.length > 0) {
    setSelectedOption(options[0]);
  }
}, [options]);

// Good - derive from index
const [selectedIndex, setSelectedIndex] = useState(0);
const selectedOption = options[selectedIndex] ?? options[0];
```

### useMemo
- Use for expensive calculations or when referential equality matters
- Don't over-memoize simple operations
- Wrap utility function calls that process data

```tsx
// Good - memoize data transformation
const bids = useMemo(() => buildOrderBookRows(orderbook?.levels[0]), [orderbook?.levels]);

// Bad - unnecessary memoization
const doubled = useMemo(() => value * 2, [value]);
```

### useState
- Prefer primitive values or indices over complex objects when possible
- Use single state for related values that change together

### useCallback
- Only use when passing callbacks to memoized children
- Don't wrap every function - only when preventing unnecessary re-renders

## hl-react Subscription Components

### Hook Usage
- Use subscription hooks (`useSubL2Book`, `useSubTrades`, etc.) for real-time data
- Use info hooks (`useInfoClearinghouseState`, etc.) for one-time fetches
- Use action hooks (`useActionOrder`, `useActionCancel`, etc.) for mutations
- Destructure only what you need: `{ data, status, error }`

### Data Processing
- **Process in lib/, not components** - Create utilities in `lib/` for data transformation
- **Limit what you process** - If showing 10 rows, only process 10 rows
- **Only memoize array transformations** - Not trivial math like `getMaxTotal(bids, asks)`
- **Use simple patterns** - `map` with closure for accumulation, not `reduce`

```tsx
// Good - process only what's needed, memoize array transformation
const VISIBLE_ROWS = 10;
const bids = useMemo(() => processLevels(orderbook?.levels[0], VISIBLE_ROWS), [orderbook?.levels]);
const asks = useMemo(() => processLevels(orderbook?.levels[1], VISIBLE_ROWS), [orderbook?.levels]);

// Good - trivial calculations don't need memoization
const maxTotal = getMaxTotal(bids, asks);
const spreadInfo = getSpreadInfo(bids, asks);

// Bad - over-memoizing simple operations
const maxTotal = useMemo(() => getMaxTotal(bids, asks), [bids, asks]);
```

### Types
- **Use literal types for constrained values** - Not `number`, use `2 | 3 | 4 | 5`
- **Type raw API data** - Create types like `RawBookLevel` for SDK responses
- **Export types from lib/** - Keep type definitions with their utilities

```tsx
// Good - literal types for API constraints
type PriceGroupOption = {
  nSigFigs: 2 | 3 | 4 | 5;
  mantissa?: 2 | 5;
  label: string;
};

// Bad - loose typing
type PriceGroupOption = {
  nSigFigs: number;
  mantissa?: number;
  label: string;
};
```

### Status Handling
- **Keep conditionals explicit** - Don't over-abstract error/loading states
- **Simple ternary chain** - `status === "error" ? <Error /> : isEmpty ? <Empty /> : <Content />`
- **Show meaningful messages** - Use `error?.message` when available

```tsx
// Good - explicit and readable
{status === "error" ? (
  <Placeholder>{error?.message ?? t`Failed to load`}</Placeholder>
) : data.length === 0 ? (
  <Placeholder>{t`Waiting for data...`}</Placeholder>
) : (
  <Content data={data} />
)}

// Bad - hiding logic in abstractions
<SubscriptionWrapper status={status} error={error} data={data}>
  {(d) => <Content data={d} />}
</SubscriptionWrapper>
```

### Component Structure Pattern

```tsx
import { cn } from "@/lib/cn";

interface Props {
  coin: string;
  className?: string;
}

export function SubscriptionComponent({ coin, className }: Props) {
  // 1. Local UI state only
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  // 2. External state/context
  const { data: market } = useSelectedResolvedMarket();

  // 3. Subscription hook
  const { data, status, error } = useSubSomething({ coin });

  // 4. Data transformation (memoize only array transforms)
  const processed = useMemo(() => processData(data, LIMIT), [data]);

  // 5. Derived values (no memoization needed)
  const derivedValue = calculateSomething(processed);

  // 6. Simple handlers
  const handleClick = () => setSomething(value);

  // 7. Render with explicit status handling
  return (
    <div className={cn("flex flex-col", className)}>
      {status === "error" ? (
        <Placeholder>{error?.message}</Placeholder>
      ) : processed.length === 0 ? (
        <Placeholder>{t`Loading...`}</Placeholder>
      ) : (
        <DataView data={processed} />
      )}
    </div>
  );
}
```

## Examples

```tsx
// Bad - unnecessary comment
// Calculate the mid price
const mid = (bestBid + bestAsk) / 2;

// Good - no comment needed, code is self-explanatory
const mid = (bestBid + bestAsk) / 2;

// Bad - unnecessary intermediate variable
const isFiniteBid = Number.isFinite(bestBid);
const isFiniteAsk = Number.isFinite(bestAsk);
const mid = isFiniteBid && isFiniteAsk ? (bestBid + bestAsk) / 2 : undefined;

// Good - direct expression
const mid = Number.isFinite(bestBid) && Number.isFinite(bestAsk) ? (bestBid + bestAsk) / 2 : undefined;

// Bad - console.log left in code
console.log({ orderbook, status });
const bids = buildOrderBookRows(orderbook?.levels[0]);

// Good - no debug statements
const bids = buildOrderBookRows(orderbook?.levels[0]);
```
