# Mobile UI Improvements Plan

## Research: What Makes Mobile Trading UIs Great

### Robinhood / Coinbase / Bybit Patterns
- **Prominent portfolio value** — equity displayed large at top of account view
- **Direction-coded everything** — green for long/up, red for short/down, no ambiguous colors
- **Touch-friendly targets** — 44px minimum hit area for all interactive elements
- **Quick-% buttons** — 25%, 50%, 75%, MAX shortcuts below size slider in order forms
- **Clean position cards** — Lead with asset name + direction badge + P&L; secondary details below
- **Spread displayed neutrally** — not in a warning/amber color
- **Bottom nav label + icon** — both shown, active state uses brand color + top line indicator
- **Progressive disclosure** — don't show everything at once; use expandable cards

### Current State (Screenshots Captured)
- 5-tab bottom nav: Chart / Book / Trade / Positions / Account ✅
- Position cards with 3x2 metric grid (Size, Entry, Mark / Margin, Liq, Funding)
- Account view with equity card + 2-col stat grid + Deposit/Withdraw CTAs
- Book view with spread shown in `text-text-warning` (amber)
- Mid price in book view shown in `text-text-warning` (amber) regardless of direction
- Trade view: slider without quick-% buttons
- Position direction (LONG/SHORT) not visually distinct from card header

---

## Improvement Plan

### [x] Step 1 — Fix semantic color tokens in Book view
**Files**: `mobile-book-view.tsx`
- Mid price: change from hardcoded `text-text-warning` → directional via `midDirection` state
  - `up` → `text-text-success`, `down` → `text-text-error`, `flat` → `text-text-strong`
- Spread value: change from `text-text-warning` → `text-text-strong`
- These are semantic misuses (warning ≠ neutral mid price)

### [x] Step 2 — Add quick-% buttons to Trade view
**Files**: `mobile-trade-view.tsx`
- Add 4 pill buttons below the slider: `25%`, `50%`, `75%`, `100%`
- Use same `applySizeFromPercent` function already used by slider
- Style as compact ghost buttons consistent with design system
- Disable when form is disabled

### [x] Step 3 — Add LONG/SHORT direction badge to position cards
**Files**: `mobile-positions-tab.tsx`
- Add a small direction badge (LONG in green, SHORT in red) next to asset name in card header
- Remove the border color workaround (green border for long, red for short) — replace with explicit badge
- Makes scan reading much faster: no need to infer direction from border

### [x] Step 4 — Improve account equity card visual
**Files**: `mobile-account-view.tsx`
- Add a subtle background gradient to the equity card (brand-weak → transparent)
- Make equity label `text-2xs uppercase tracking-wider` for clearer visual hierarchy
- Show position count (active positions badge) in the equity section

### [x] Step 5 — Add position side label to chart/trade view header
**Files**: `mobile-chart-view.tsx`, `mobile-trade-view.tsx`
- Show a subtle indicator when user has an open position in the current market
- E.g. a small LONG/SHORT badge next to the token selector

### [x] Step 6 — Polish empty states across tabs
**Files**: `mobile-orders-tab.tsx`, `mobile-positions-tab.tsx`
- Orders: Added icon (ListIcon) + centered layout + descriptive text
- Positions: Added icon (ChartLineIcon) + centered layout + descriptive text
- Order cards: consistent direction badge (same as position cards) + neutral border

### [ ] Step 7 — Improve Book view spread display
**Files**: `mobile-book-view.tsx`
- Show spread in basis points (bps) in addition to absolute and %
- Add a visual "tightness" indicator (colored dot: green = tight < 0.05%, yellow = medium, red = wide)

---

## Round 2 — Design Consistency Pass (2026-04-12)

### [x] Step 8 — Chart header: remove position badge + fix price hierarchy
**Files**: `mobile-chart-view.tsx`
- Remove the Long/Short position badge shown left of the market name — no value here
- Stack price + 24h change vertically (price on top, change below) instead of side-by-side
- Reduce price font size from `text-lg` → `text-sm font-semibold` to match element weight on desktop

### [x] Step 9 — Book header: make both controls ghost-style (no border)
**Files**: `mobile-book-view.tsx`
- The base/quote toggle Button uses `variant="outline"` while the grouping Dropdown is borderless
- Change Button to `variant="ghost"` so both controls look visually consistent (text + icon, no border)

### [x] Step 10 — Trade form: ghost-style size unit toggle + tighter spacing
**Files**: `mobile-trade-view.tsx`
- The size unit toggle (USDC/ETH) uses `variant="outline"` — change to `variant="ghost"` to match desktop
- Reduce `space-y-4` → `space-y-3` in the form container for tighter spacing
- Reduce header mark price from `text-lg` → `text-sm font-semibold`

### [x] Step 11 — Positions & Orders cards: match account view style
**Files**: `mobile-positions-tab.tsx`, `mobile-orders-tab.tsx`
- Metric grid: remove `gap-px bg-stroke-weak/20` mosaic trick — use explicit row/column dividers instead
- Match label size to account view standard: `text-2xs` (from `text-xs`)
- Replace raw `<button>` elements for TP/SL and Limit Close with `Button` component (`variant="outline" size="xs"`)

---

## Consistency Checklist (HyperTerminal UI Library)
- All buttons use `variant`, `intent`, `size` from `@hypeterminal/ui`
- Colors from design tokens only (no hex, no arbitrary values)
- Icons from `@phosphor-icons/react` with `Icon` suffix
- Touch targets ≥ 44px (`min-h-[44px]` or existing button sizes)
- Tab indicators use `text-text-brand` + top line `bg-fill-brand-strong`
