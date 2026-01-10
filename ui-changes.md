# UI Component Improvements

This document tracks UI improvements needed across the codebase:
- Replace native HTML elements with shadcn components
- Remove redundant classNames that duplicate component defaults
- Convert number inputs from `type="number"` to `type="text"` with `inputMode="decimal"` to hide spin buttons

---

## Order Entry Components

### `src/components/trade/order-entry/leverage-popover.tsx`

**Line 105-118**: Native `<input type="number">` should use `<Input>` component

```tsx
// BEFORE (lines 105-118)
<input
  type="number"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onBlur={handleInputBlur}
  onKeyDown={handleKeyDown}
  className={clsx(
    "w-16 h-7 px-2 text-sm text-center tabular-nums rounded-sm",
    "bg-background border border-border/60",
    "focus:border-terminal-cyan/60 focus:outline-none",
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
  )}
  min={1}
  max={maxLeverage}
/>

// AFTER - use Input with inputMode="decimal" to hide spin buttons
<Input
  type="text"
  inputMode="decimal"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onBlur={handleInputBlur}
  onKeyDown={handleKeyDown}
  inputSize="sm"
  className="w-16 text-center tabular-nums"
/>
```

### `src/components/trade/order-entry/leverage-sheet.tsx`

**Line 102-115**: Same issue - native `<input type="number">`

```tsx
// BEFORE (lines 102-115)
<input
  type="number"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onBlur={handleInputBlur}
  onKeyDown={handleKeyDown}
  className={clsx(
    "w-20 h-10 px-3 text-lg text-center tabular-nums rounded-md",
    "bg-background border border-border/60",
    "focus:border-terminal-cyan/60 focus:outline-none",
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
  )}
  min={1}
  max={maxLeverage}
/>

// AFTER
<Input
  type="text"
  inputMode="decimal"
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  onBlur={handleInputBlur}
  onKeyDown={handleKeyDown}
  inputSize="lg"
  className="w-20 text-center text-lg tabular-nums"
/>
```

### `src/components/trade/order-entry/order-entry-panel.tsx`

**Lines with native buttons**: Multiple `<button>` elements that could use `<Button>`

**Line ~100-110**: Order type tabs could use Button with variant="ghost"
```tsx
// Current pattern - custom styled buttons
<button
  type="button"
  onClick={() => setType("market")}
  className={clsx(...)}
>

// Could use Button component with appropriate variant
```

### `src/components/trade/order-entry/deposit-modal.tsx`

Uses shadcn components well already. No changes needed.

---

## Positions Components

### `src/components/trade/positions/positions-tab.tsx`

**Line ~198**: Close button could use `<Button variant="terminal" size="2xs">`
```tsx
// BEFORE
<button
  type="button"
  className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
>

// AFTER
<Button variant="terminal" size="2xs">
  {t`Close`}
</Button>
```

### `src/components/trade/positions/orders-tab.tsx`

**Line ~170**: Cancel button could use `<Button variant="terminal" size="2xs">`
```tsx
// Same pattern as positions-tab.tsx
```

### `src/components/trade/positions/twap-tab.tsx`

**Line 198-205**: Cancel button could use `<Button variant="terminal" size="2xs">`

**Line 152-159**: Coin button for navigation - keep as button for semantics but consider hover styling
```tsx
// Line 198-205
<button
  type="button"
  className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
>

// Could become:
<Button variant="terminal" size="2xs">
  {t`Cancel`}
</Button>
```

---

## Orderbook Components

### `src/components/trade/orderbook/orderbook-panel.tsx`

**Line 72-79**: Aggregation dropdown trigger could use `<Button variant="ghost" size="2xs">`
```tsx
// BEFORE
<button
  type="button"
  className="px-1.5 py-0.5 text-4xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
>

// AFTER
<Button variant="ghost" size="2xs" className="gap-1">
  {selectedOption?.label ?? priceGroupingOptions[0]?.label ?? "—"}
  <ChevronDown className="size-2.5" />
</Button>
```

**Lines 96-104, 105-113**: Toggle USD display buttons - keep as semantic buttons

### `src/components/trade/orderbook/orderbook-row.tsx`

**Line 42-48**: Price click button - keep as button for semantics (good as-is)

---

## Header Components

### `src/components/trade/header/top-nav.tsx`

**Lines 51-61**: Nav item buttons could use `<Button variant="ghost" size="sm">`
```tsx
// BEFORE
<button
  type="button"
  className={clsx(
    "px-2.5 py-1.5 transition-colors",
    idx === 0 ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
  )}
>

// AFTER - consider Button
<Button
  variant="ghost"
  size="sm"
  className={clsx(idx === 0 && "text-terminal-cyan")}
>
```

**Line 94-101**: Notifications button could use `<Button variant="ghost" size="icon-sm">`
```tsx
// BEFORE
<button
  type="button"
  className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
>
  <Bell className="size-3.5" />
</button>

// AFTER
<Button variant="ghost" size="icon-sm" aria-label={t`Notifications`}>
  <Bell className="size-3.5" />
</Button>
```

**Line 103-111**: Settings button - same pattern as notifications

### `src/components/trade/header/theme-toggle.tsx`

**Line 32-46**: Theme toggle button could use `<Button variant="ghost" size="icon-sm">`
```tsx
// BEFORE
<button
  type="button"
  className={clsx(
    "size-7 flex items-center justify-center transition-colors",
    isDark
      ? "text-terminal-amber hover:text-terminal-amber/80"
      : "text-terminal-purple hover:text-terminal-purple/80",
  )}
>

// AFTER
<Button
  variant="ghost"
  size="icon-sm"
  className={clsx(
    isDark ? "text-terminal-amber" : "text-terminal-purple"
  )}
>
```

### `src/components/trade/header/favorites-strip.tsx`

**Lines 93-118**: FavoriteChip - keep as button, good semantic usage

---

## Chart Components

### `src/components/trade/chart/token-selector.tsx`

**Lines 88-105**: Category filter buttons could use `<Button variant="ghost" size="2xs">`
```tsx
// BEFORE
<button
  key={cat.value}
  type="button"
  onClick={() => handleCategorySelect(cat.value)}
  className={clsx(
    "px-2 py-1 text-3xs uppercase tracking-wider transition-colors inline-flex items-center gap-1",
    category === cat.value
      ? "text-terminal-cyan bg-terminal-cyan/10"
      : "text-muted-foreground hover:text-foreground",
  )}
>

// AFTER - consider Button with custom styling
<Button
  variant="ghost"
  size="2xs"
  className={clsx(
    "uppercase tracking-wider",
    category === cat.value && "text-terminal-cyan bg-terminal-cyan/10"
  )}
  onClick={() => handleCategorySelect(cat.value)}
>
```

**Lines 124-144**: Sort header buttons - keep as buttons, semantic for table headers

---

## Mobile Components

### `src/components/trade/mobile/mobile-trade-view.tsx`

**Lines 339-369**: Buy/Sell toggle buttons are appropriately styled for mobile touch targets

**Lines 374-393**: Order type tabs - appropriately styled

**Lines 414-426**: Size mode toggle could use Button
```tsx
// Current is fine for mobile touch targets
```

**Lines 455-469**: Percent buttons could use Button variant
```tsx
// BEFORE
<button
  key={p}
  type="button"
  onClick={() => handlePercentClick(p)}
  className={clsx(
    "py-2.5 text-sm font-medium border border-border/60 rounded-md",
    "hover:border-terminal-cyan/40 hover:text-terminal-cyan",
    "transition-colors disabled:opacity-50",
    "min-h-[44px]",
  )}
  disabled={isFormDisabled || maxSize <= 0}
>

// Could use Button variant="outline" with custom styling
```

**Lines 532-551**: Submit button - keep custom for specific styling needs

### `src/components/trade/mobile/mobile-header.tsx`

**Lines 40-51**: Notifications button could use `<Button variant="ghost" size="icon-sm">`

**Lines 53-65**: Settings button - same pattern

### `src/components/trade/mobile/mobile-bottom-nav.tsx`

Keep as native buttons - semantic nav elements with complex styling

### `src/components/trade/mobile/mobile-positions-view.tsx`

**Lines 93-121**: Tab buttons are appropriately styled for mobile

### `src/components/trade/mobile/mobile-account-view.tsx`

**Lines 73-84**: Connect wallet button - appropriately styled
**Lines 106-113**: Copy address button could use `<Button variant="ghost" size="icon-xs">`
**Lines 120-130**: Disconnect button could use `<Button variant="ghost" size="icon-sm">`
**Lines 183-210**: Deposit/Withdraw buttons - keep custom for specific styling

---

## Dialog Components

### `src/components/trade/components/global-settings-dialog.tsx`

**Line 155-165**: Slippage input uses `<Input type="number">` - should use `type="text" inputMode="decimal"`
```tsx
// BEFORE
<Input
  ref={inputRef}
  type="number"
  value={slippageInputValue}
  onChange={handleSlippageInputChange}
  onBlur={handleSlippageInputBlur}
  min={MARKET_ORDER_SLIPPAGE_MIN_BPS}
  max={MARKET_ORDER_SLIPPAGE_MAX_BPS}
  inputSize="sm"
  className="w-16 text-right tabular-nums"
/>

// AFTER - remove type="number" to hide spin buttons
<Input
  ref={inputRef}
  type="text"
  inputMode="decimal"
  value={slippageInputValue}
  onChange={handleSlippageInputChange}
  onBlur={handleSlippageInputBlur}
  inputSize="sm"
  className="w-16 text-right tabular-nums"
/>
```

### `src/components/trade/components/wallet-dialog.tsx`

**Lines 83-109, 126-152**: Wallet connector buttons - appropriately styled with custom hover states

**Lines 184-203**: Help toggle button - could use Button but current styling is appropriate

---

## Summary of High Priority Changes

### 1. Input Type Changes (High Priority) ✅ COMPLETED
Created custom `NumberInput` component (`src/components/ui/number-input.tsx`) that:
- Uses `type="text"` to hide browser spin buttons
- Uses `inputMode="numeric"` or `inputMode="decimal"` for mobile keyboards
- Filters keystrokes to only allow digits (and optionally decimal/minus)
- Validates pasted content
- Supports `allowDecimals` and `allowNegative` props

Updated files to use `NumberInput`:
- [x] `leverage-popover.tsx` - leverage input (integers only)
- [x] `leverage-sheet.tsx` - leverage input (integers only)
- [x] `global-settings-dialog.tsx` - slippage input (integers only)

### 2. Replace Native Inputs with Input Component (High Priority) ✅ COMPLETED
- [x] `leverage-popover.tsx:105-118` - use `<NumberInput>` component
- [x] `leverage-sheet.tsx:102-115` - use `<NumberInput>` component

### 3. Replace Native Buttons with Button Component (Medium Priority) ✅ COMPLETED
Icon buttons in headers:
- [x] `top-nav.tsx:94-101` - notifications button → `<Button variant="ghost" size="icon-sm">`
- [x] `top-nav.tsx:103-111` - settings button → `<Button variant="ghost" size="icon-sm">`
- [x] `theme-toggle.tsx:32-46` - theme toggle → `<Button variant="ghost" size="icon-sm">`
- [x] `mobile-header.tsx:40-51` - notifications → `<Button variant="ghost" size="icon-lg">` (larger for mobile touch)
- [x] `mobile-header.tsx:53-65` - settings → `<Button variant="ghost" size="icon-lg">` (larger for mobile touch)

Action buttons in tables:
- [SKIP] `positions-tab.tsx` - Close and TP/SL buttons - Keep as native buttons (Button component's `font-medium` and fixed `h-5` height don't match the small `text-4xs py-0.5` styling)
- [SKIP] `orders-tab.tsx` - Cancel buttons - Keep as native buttons (same reason)
- [SKIP] `twap-tab.tsx` - Cancel button - Keep as native buttons (same reason)

Dropdown triggers:
- [ ] `orderbook-panel.tsx:72-79` - aggregation selector → `<Button variant="ghost" size="2xs">`

### 4. Remove Redundant Classes (Low Priority)
When using Button or Input, remove classes that duplicate component defaults:
- `transition-colors` (included in Button)
- `rounded-md` / `rounded-sm` (included in components)
- `disabled:opacity-50` (included in components)

---

## Notes

1. **Keep semantic buttons** where the button has navigation or table interaction semantics
2. **Mobile components** often need larger touch targets - be careful when changing mobile buttons
3. **Number inputs** should use `type="text" inputMode="decimal"` to:
   - Show numeric keyboard on mobile
   - Hide browser spin buttons
   - Allow custom validation

## Implementation Order

1. **Phase 1**: Fix input type issues (3 files) ✅ COMPLETED
2. **Phase 2**: Replace native inputs with Input component (2 files) ✅ COMPLETED (done with Phase 1)
3. **Phase 3**: Replace icon buttons in headers (5 locations) ✅ COMPLETED
4. **Phase 4**: Replace action buttons in tables (3 files) ⏭️ SKIPPED - Button component defaults (`font-medium`, fixed height) don't match small table action button styling
5. **Phase 5**: Review and remove redundant classes
