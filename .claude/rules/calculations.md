# Calculation Rules

Rules for handling numeric calculations safely and consistently using **big.js** for precision.

## Core Library: `@/lib/trade/numbers.ts`

All numeric operations should use utilities from this module. It wraps **big.js** for arbitrary-precision decimal arithmetic, eliminating floating-point errors and scattered validation checks.

## Parsing Values

### From API Responses (strings)

```tsx
import { parseNumber, toNumber, isPositive } from "@/lib/trade/numbers";

// parseNumber - returns NaN for invalid (use with formatters that handle NaN)
const price = parseNumber(apiResponse.limitPx);
const size = parseNumber(apiResponse.sz);

// toNumber - returns null for invalid (use for explicit null checks)
const maybePrice = toNumber(apiResponse.limitPx);
if (maybePrice !== null) { ... }

// With fallbacks
import { toNumberOr, toNumberOrZero } from "@/lib/trade/numbers";
const leverage = toNumberOr(apiResponse.leverage, 1);
const fee = toNumberOrZero(apiResponse.fee);
```

### For Validation

```tsx
import { isPositive, isNonNegative, isValidPrice, isValidSize } from "@/lib/trade/numbers";

// Type guards that validate and narrow types
if (isPositive(price)) {
  // price is guaranteed: number > 0, finite, not NaN
}

if (isValidPrice(entryPx) && isValidSize(size)) {
  // Both are valid for trading calculations
}

// Works with any input type (string, number, null, undefined)
isPositive("123.45")  // true
isPositive("")        // false
isPositive(null)      // false
isPositive(NaN)       // false
isPositive(Infinity)  // false
```

## Calculations

### Using calc helpers

All calc functions accept `unknown` and return `number | null`:

```tsx
import { calc } from "@/lib/trade/numbers";

// Basic math - returns null if any input is invalid
const sum = calc.add(a, b);
const diff = calc.subtract(a, b);
const product = calc.multiply(price, size);
const quotient = calc.divide(notional, leverage);

// Percentage calculations
const change = calc.percentChange(oldPrice, newPrice);  // Returns % (e.g., 5.25)
const portion = calc.percentOf(filled, total);          // Returns % of total
const amount = calc.percent(value, 10);                 // 10% of value

// Trading-specific
const pnl = calc.pnl(entryPrice, exitPrice, size);
const pnlPct = calc.pnlPercent(entryPrice, exitPrice);
const lev = calc.leverage(notional, margin);
const notional = calc.notional(price, size);
const margin = calc.marginRequired(notional, leverage);
const slip = calc.slippage(expectedPrice, actualPrice);
const withSlip = calc.applySlippage(price, slippageBps, isBuy);
```

### Display with nullish coalescing

```tsx
// For display, provide fallback
const displayPnl = calc.pnl(entry, exit, size) ?? 0;
const displayLev = calc.leverage(notional, margin) ?? 1;

// Or use with formatters (they handle null/NaN)
{formatUSD(calc.pnl(entry, exit, size))}  // Shows "-" if null
```

## Formatting Numbers

### For display (with precision)

```tsx
import { toFixed, toFixedTrimmed, floorToString } from "@/lib/trade/numbers";

// Fixed decimals
toFixed(123.456, 2)        // "123.46"
toFixed("123.456", 2)      // "123.46"

// Trimmed trailing zeros
toFixedTrimmed(123.400, 3) // "123.4"

// Floor to decimals (for order sizes)
floorToString(1.999, 2)    // "1.99"
```

### Using format.ts formatters

```tsx
import { formatUSD, formatPrice, formatPercent, formatToken } from "@/lib/format";

// These handle null/NaN automatically, returning FALLBACK_VALUE_PLACEHOLDER ("-")
formatUSD(null)           // "-"
formatPrice(NaN)          // "-"
formatUSD(calc.pnl(...))  // Works directly with calc results
```

## Rounding

```tsx
import { floor, ceil, clamp, clampInt } from "@/lib/trade/numbers";

// Floor/ceil to decimals
floor(1.999, 2)     // 1.99
ceil(1.001, 2)      // 1.01

// Clamp to range
clamp(value, 0, 100)     // Ensures 0 <= value <= 100
clampInt(value, 1, 10)   // Rounds and clamps to integer range
```

## Processing API Data

### In useMemo transformations

```tsx
import { parseNumber, isPositive, calc } from "@/lib/trade/numbers";

const tableRows = useMemo(() => {
  return positions.map((p) => {
    // Parse once at the top
    const size = parseNumber(p.szi);
    const entryPx = parseNumber(p.entryPx);
    const markPx = parseNumber(assetCtxs?.[index]?.markPx);

    // Use calc for derived values
    const pnl = calc.pnl(entryPx, markPx, size);
    const notional = calc.notional(markPx, Math.abs(size));

    return {
      size,
      entryPx,
      markPx,
      pnl,
      notional,
      // Use isPositive for action guards
      canClose: isPositive(size) && isPositive(markPx),
    };
  });
}, [positions, assetCtxs]);
```

### Conditional rendering

```tsx
// Use validation helpers - clean and type-safe
{isPositive(tpPrice) && (
  <span>{formatPrice(tpPrice)}</span>
)}

{isNonNegative(pnl) ? (
  <span className="text-green">{formatUSD(pnl)}</span>
) : (
  <span className="text-red">{formatUSD(pnl)}</span>
)}
```

## Anti-Patterns

```tsx
// ❌ Bad - parseFloat without validation
const price = parseFloat(input);

// ✅ Good - use parseNumber or toNumber
const price = parseNumber(input);

// ❌ Bad - scattered isFinite checks
if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
  return a / b;
}

// ✅ Good - use calc helpers
const result = calc.divide(a, b);

// ❌ Bad - truthy checks for numbers (0 is valid!)
if (price) { ... }

// ✅ Good - explicit validation
if (isPositive(price)) { ... }
if (price !== null) { ... }

// ❌ Bad - manual NaN checks
if (isNaN(value) || !Number.isFinite(value)) { ... }

// ✅ Good - use toNumber which returns null for invalid
const num = toNumber(value);
if (num !== null) { ... }

// ❌ Bad - floating point arithmetic
const total = 0.1 + 0.2;  // 0.30000000000000004

// ✅ Good - use calc helpers (uses big.js internally)
const total = calc.add(0.1, 0.2);  // 0.3

// ❌ Bad - manual percentage calculation
const pct = ((exit - entry) / entry) * 100;

// ✅ Good - use calc.percentChange
const pct = calc.percentChange(entry, exit);
```

## Direct big.js Usage

For complex calculations not covered by calc helpers:

```tsx
import { toBig, toBigOrZero } from "@/lib/trade/numbers";

const entryBig = toBig(entryPrice);
const exitBig = toBig(exitPrice);
const sizeBig = toBig(size);

if (entryBig && exitBig && sizeBig) {
  const pnl = exitBig.minus(entryBig).times(sizeBig);
  const roe = exitBig.minus(entryBig).div(entryBig);

  return {
    pnl: pnl.toNumber(),
    pnlDisplay: pnl.toFixed(2),
    roeDisplay: roe.times(100).toFixed(2) + "%",
  };
}
```

## Summary

| Task | Use |
|------|-----|
| Parse API string to number | `parseNumber()`, `toNumber()` |
| Check if positive/valid | `isPositive()`, `isValidPrice()` |
| Basic math | `calc.add()`, `calc.multiply()`, etc. |
| Trading calculations | `calc.pnl()`, `calc.leverage()`, etc. |
| Format for display | `formatUSD()`, `formatPrice()`, `toFixed()` |
| Floor to decimals | `floor()`, `floorToString()` |
| Clamp to range | `clamp()`, `clampInt()` |
| Direct big.js | `toBig()` for complex chains |
