# Code Style Rules

## Component Structure

- **Keep components clean** - Move calculations and business logic to `lib/` utilities
- **Organize utils by domain** - Use folders like `lib/trade/`, `lib/chart/`, etc.
- **Minimize useEffect** - Only use when truly needed for side effects, not for derived state
- **No comments in components** - Logic should be self-explanatory; add comments only in lib utilities when needed
- Components should primarily handle: state, hooks, and JSX rendering

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

## hl-react Hooks

- Use subscription hooks (`useSubL2Book`, `useSubTrades`, etc.) for real-time data
- Use info hooks (`useInfoClearinghouseState`, etc.) for one-time fetches
- Use action hooks (`useActionOrder`, `useActionCancel`, etc.) for mutations
- Always destructure only what you need from hook returns

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
