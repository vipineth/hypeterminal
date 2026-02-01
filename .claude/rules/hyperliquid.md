## Hyperliquid Data Principle

**Stay close to the API. Keep strings. Keep it simple.**

### Rules

1. **Keep strings** - API returns strings with exact decimals, pass them through
2. **Use big.js inline** - `Big(size).times(price).toString()` directly where needed
3. **No wrapper types** - use SDK types directly
4. **Use Big.cmp() for sorting/comparison** - keeps precision without converting to number
5. **Inline simple logic** - don't create functions to access fields

### Helpers

Keep calculations out of components:
- Place in `src/domain/market/` for market-related calculations
- Accept values directly: `get24hChange(prevDayPx, markPx)`
- Use `Numeric` type (`string | number | null | undefined`)

### Flow

Strings flow from API to display unchanged. Use big.js only when math is needed, then back to string.

### Check

Before adding code, ask: Does the SDK already do this? Can I just pass the string through?
