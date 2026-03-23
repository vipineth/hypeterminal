# Visual Audit Report

**Date**: 2026-03-23
**Branch**: codex/shadcn-native-rewrite
**Screenshots**: 24 (6 viewports x 2 pages x 2 themes)
**Viewports**: 1920x1080, 1280x900, 1024x768, 768x1024, 390x844, 375x667

---

## Summary

| Severity | Desktop | Tablet | Mobile | Total |
|----------|---------|--------|--------|-------|
| High     | 3       | 3      | 2      | **8** |
| Medium   | 7       | 4      | 4      | **15** |
| Low      | 7       | 5      | 6      | **18** |
| **Total**| **17**  | **12** | **12** | **41** |

---

## High Severity Issues

### VA-003 — Trade sidebar compressed at 1280px
- **Viewport**: 1280x900 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/layout/trade-sidebar.tsx`
- The trade sidebar is noticeably compressed at 1280px. Form fields, inputs, and the Connect Wallet button feel cramped. Precision trading requires comfortable spacing.
- **Fix**: Review `PANEL_LAYOUT.MAIN.sidebar` minimum size constraints. Consider reducing horizontal padding from `px-4` to `px-3` at narrower widths.
- **Auto-fixable**: no

### VA-009 — Chart area too compressed at 1280px
- **Viewport**: 1280x900 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/layout/market-info.tsx`
- Chart area is significantly reduced due to orderbook panel proportions. Candlestick chart becomes harder to read with compressed candles.
- **Fix**: Review `PANEL_LAYOUT.MARKET.chart.minSize` and `PANEL_LAYOUT.MARKET.orderbook.minSize`. Consider reducing orderbook default size at narrower viewports.
- **Auto-fixable**: no

### VA-018 — Buy/Sell button text contrast in dark mode
- **Viewport**: all desktop | **Theme**: dark | **Page**: both
- **Component**: `src/components/trade/tradebox/trade-panel.tsx:465-466`
- Buy/Sell buttons use `text-background` which resolves to near-black in dark mode — dark text on green/red buttons = poor contrast.
- **Fix**: Change `text-background` to `text-white` for both buy and sell button variants.
- **Auto-fixable**: yes

### VA-100 — Nav items cramped at 1024px
- **Viewport**: 1024x768 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/header/top-nav.tsx`
- All nav items (All, Perp, Spot, Builders, Vaults, Portfolio, Staking, Leaderboard) are crammed together at exactly 1024px. Disabled items waste space.
- **Fix**: Hide disabled nav items at `lg` breakpoint, only show them at `xl` (1280px+). Change to `xl:flex hidden`.
- **Auto-fixable**: yes

### VA-101 — Trade sidebar compressed at 1024px
- **Viewport**: 1024x768 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/layout/trade-sidebar.tsx`
- At 1024px, sidebar is ~307px. Order form fields are squeezed. Precision trading inputs need more breathing room.
- **Fix**: Add `minSize` constraint to sidebar panel or reduce internal padding at narrower widths.
- **Auto-fixable**: yes

### VA-104 — No navigation at 768px portrait
- **Viewport**: 768x1024 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/header/top-nav.tsx`
- At 768px width, nav uses `lg:flex` (1024px threshold) so all navigation links are hidden. No way to switch between perp/spot/builders scopes.
- **Fix**: Show scope nav items (All, Perp, Spot, Builders) at `md:flex` (768px). Keep secondary items at `lg:flex`.
- **Auto-fixable**: yes

### VA-105 — Layout severely cramped at 768px portrait
- **Viewport**: 768x1024 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/layout/main-workspace.tsx`
- At 768px desktop layout: orderbook gets ~129px (3 columns barely fit), trade sidebar gets ~230px. Overall layout is functional but poor for actual trading.
- **Fix**: Consider bumping mobile breakpoint to 1024px for tablet portrait, or implement panel stacking for viewports 768-1024px.
- **Auto-fixable**: no

### VA-200 — Price color uses wrong semantic token on mobile
- **Viewport**: 390x844, 375x667 | **Theme**: light | **Page**: both
- **Component**: `src/components/trade/mobile/mobile-chart-view.tsx:51`
- Main price ($68.04K) uses `text-warning-700` (orange/amber) — semantically incorrect for a market price. Poor contrast on light backgrounds.
- **Fix**: Change `text-warning-700` to `text-text-950` for the mark price display.
- **Auto-fixable**: yes

---

## Medium Severity Issues

### VA-001 — Spread always rendered in red
- **Viewport**: all desktop | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/orderbook/orderbook-panel.tsx:171`
- Spread value always uses `text-market-down-600` (red) regardless of context. Creates persistent negative visual signal.
- **Fix**: Change to `text-text-950` or `text-market-neutral`.
- **Auto-fixable**: yes

### VA-002 — Orderbook headers compete with data values
- **Viewport**: all desktop | **Theme**: light | **Page**: both
- **Component**: `src/components/trade/orderbook/orderbook-panel.tsx:97`
- Column headers (Price, Size, Total) use `text-text-950` at `text-3xs`. Should use `text-text-600` to create hierarchy with data values.
- **Auto-fixable**: yes

### VA-005 — Equity value hardcoded green
- **Viewport**: all desktop | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/tradebox/account-panel.tsx:198-199`
- Equity value hardcoded to `text-market-up-600` regardless of actual value. Should be neutral or reflect actual state.
- **Auto-fixable**: yes

### VA-008 — Favorites strip divider nearly invisible in light mode
- **Viewport**: all desktop | **Theme**: light | **Page**: both
- **Component**: `src/components/trade/layout/main-workspace.tsx:28`
- Divider uses `bg-border-50` (6% mix) — nearly invisible. Change to `bg-border-100`.
- **Auto-fixable**: yes

### VA-010 — Positions tab bar overflow has no scroll indicator
- **Viewport**: 1280x900 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/positions/positions-panel.tsx`
- 7 tabs can overflow at narrower widths. No gradient fade or scroll indicator to signal more tabs exist.
- **Auto-fixable**: no

### VA-012 — Orderbook row hover state fights with depth bar
- **Viewport**: all desktop | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/orderbook/orderbook-row.tsx:29`
- Hover uses semi-transparent `hover:bg-surface-analysis/30` which creates muddy feedback over depth bar colors.
- **Fix**: Change to `hover:bg-accent` for opaque hover feedback.
- **Auto-fixable**: yes

### VA-014 — Order summary border invisible in dark mode
- **Viewport**: all desktop | **Theme**: dark | **Page**: both
- **Component**: `src/components/trade/tradebox/trade-panel.tsx:474`
- `border-border-100/80` is extremely faint in dark mode. Change to `border-border-200`.
- **Auto-fixable**: yes

### VA-016 — Active "All" scope has no accent color
- **Viewport**: all desktop | **Theme**: light | **Page**: `/`
- **Component**: `src/components/trade/header/top-nav.tsx` (getScopeAccentClass)
- "All" scope uses same `border-border-100` as default. Other scopes get colored accents. Change default case to `border-primary-default/40`.
- **Auto-fixable**: yes

### VA-020 — Buy/Sell toggle may use wrong data attribute
- **Viewport**: all desktop | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/tradebox/side-toggle.tsx:24,31`
- Uses `data-active` but design system uses `data-[selected]`. Verify correct attribute for TabsTrigger.
- **Auto-fixable**: no

### VA-102 — Orderbook compressed at tablet landscape
- **Viewport**: 1024x768 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/orderbook/orderbook-panel.tsx`
- At ~170px width, 3-column orderbook is very tight. Consider reducing to 2 columns (price + size) at narrow widths.
- **Auto-fixable**: no

### VA-103 — Dark mode market stats low contrast
- **Viewport**: tablet viewports | **Theme**: dark | **Page**: both
- **Component**: `src/components/trade/market-overview.tsx`
- Market stats at `text-3xs` (10px) have muted contrast in dark mode. Per design tokens, 10px text should use `text-text-950`.
- **Auto-fixable**: yes

### VA-107 — Positions panel height at tablet landscape
- **Viewport**: 1024x768 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/positions/positions-panel.tsx`
- At 768px viewport height, positions panel has limited vertical room. Tab bar + content must fit in ~250-300px.
- **Auto-fixable**: no

### VA-201 — Tab label truncated on mobile with no scroll cue
- **Viewport**: 375x667 | **Theme**: both | **Page**: both
- **Component**: MobilePositionsView tab bar
- "Trade History" tab clipped to "Trade Histo..." with no gradient/scroll affordance.
- **Fix**: Add right-edge gradient mask or shorten mobile tab labels.
- **Auto-fixable**: yes

### VA-204 — Fixed chart height not responsive on mobile
- **Viewport**: 390x844, 375x667 | **Theme**: both | **Page**: both
- **Component**: `src/components/trade/mobile/mobile-chart-view.tsx`
- Chart uses fixed `h-[300px]`. Too tall for 667px screens, too short for 844px screens.
- **Fix**: Replace with `h-[40dvh] min-h-[220px] max-h-[350px]`.
- **Auto-fixable**: yes

### VA-209 — MA indicator labels overlap on mobile
- **Viewport**: 375x667 | **Theme**: both | **Page**: both
- **Component**: MobileChartView (KlineChart config)
- Moving average labels overlap each other and volume bars at 375px width.
- **Auto-fixable**: no

---

## Low Severity Issues

### VA-004 — Balance value hardcoded green
- **Component**: `src/components/trade/tradebox/account-panel.tsx:127`
- Balance always `text-market-up-600`. Should be conditional.
- **Auto-fixable**: yes

### VA-006 — Footer keyboard badge uses wrong radius
- **Component**: `src/components/trade/footer/footer-bar.tsx:56`
- Uses `rounded-md`, should be `rounded-sm` per design system.
- **Auto-fixable**: yes

### VA-007 — Nav links use wrong radius
- **Component**: `src/components/trade/header/top-nav.tsx:77,91`
- Uses `rounded-md`, should be `rounded-sm`.
- **Auto-fixable**: yes

### VA-011 — Trade sidebar slightly translucent in dark mode
- **Component**: `src/components/trade/layout/trade-sidebar.tsx:10`
- `bg-card/95` creates translucency during resize. Change to `bg-card`.
- **Auto-fixable**: yes

### VA-013 — Aggregation dropdown has no hover feedback
- **Component**: `src/components/trade/orderbook/orderbook-panel.tsx:104`
- Uses `hover:bg-transparent`. Change to `hover:bg-accent`.
- **Auto-fixable**: yes

### VA-015 — Leverage bar border too subtle
- **Component**: `src/components/trade/tradebox/trade-panel.tsx:398`
- `border-border-100/80` too faint. Change to `border-border-100`.
- **Auto-fixable**: yes

### VA-017 — Favorites chip remove button clashing background
- **Component**: `src/components/trade/header/favorites-strip.tsx:98`
- `bg-surface-execution` clashes with chip border. Change to `bg-card`.
- **Auto-fixable**: yes

### VA-019 — Main resize handle invisible at rest
- **Component**: `src/components/trade/layout/main-workspace.tsx:40-41`
- `bg-transparent` makes resize handle undiscoverable. Change to `bg-border-50`.
- **Auto-fixable**: yes

### VA-108 — Tablet resize handle invisible (same as VA-019)
- Duplicate of VA-019 at tablet viewports.

### VA-109 — Footer blends into background in dark mode
- **Component**: `src/components/trade/footer/footer-bar.tsx`
- Footer border `border-border-100` too subtle in dark mode. Change to `border-border-200`.
- **Auto-fixable**: yes

### VA-111 — Footer uses old market color token names
- **Component**: `src/components/trade/footer/footer-bar.tsx`
- Uses `text-market-up-600` / `text-market-down-600`. Should use `text-market-up` / `text-market-down` per new token naming.
- **Auto-fixable**: yes

### VA-202 — Hidden mobile tabs with no discovery cue
- **Component**: MobilePositionsView tab bar
- 7 tabs but only ~5 visible. "Order History" and "Funding History" completely hidden.
- **Fix**: Add CSS gradient mask on scroll overflow.
- **Auto-fixable**: yes

### VA-203 — Chart OHLCV header overlaps Y-axis labels on mobile
- **Component**: MobileChartView (KlineChart config)
- Date/OHLCV row overlaps with price axis labels on narrow viewports.
- **Auto-fixable**: no

### VA-205 — Mobile header crowded with 4 right-side elements
- **Component**: `src/components/trade/mobile/mobile-header.tsx`
- Connect Wallet + Bell + Theme Toggle + Gear all crammed together.
- **Auto-fixable**: no

### VA-206 — Mobile stat pills low contrast in dark mode
- **Component**: MobileChartView stat row
- `bg-surface-execution/20` too subtle in dark mode. Change to `/40`.
- **Auto-fixable**: yes

### VA-207 — Mobile empty state feels sparse
- **Component**: MobilePositionsView empty state
- Centered in large whitespace. Could be positioned above-center with a CTA button.
- **Auto-fixable**: yes

### VA-208 — Mobile active tab indicator too thin
- **Component**: MobilePositionsView TabsTrigger
- Active underline is very thin and light. Hard to distinguish on mobile.
- **Auto-fixable**: no

### VA-210 — Chart Y-axis labels use library defaults, not design tokens
- **Component**: MobileChartView (KlineChart)
- Y-axis labels are light gray, not using app's text tokens.
- **Auto-fixable**: no

### VA-211 — Mobile time interval buttons small for touch
- **Component**: MobileChartView toolbar
- Touch targets appear < 44px height.
- **Auto-fixable**: no

---

## Top Priority Fixes (Recommended Order)

1. **VA-018** — Buy/Sell button text contrast (dark mode safety issue)
2. **VA-104** — No navigation at 768px portrait (functional blocker)
3. **VA-200** — Mobile price color wrong semantic token
4. **VA-100** — Nav cramped at 1024px
5. **VA-105** — Layout severely cramped at 768px portrait
6. **VA-003/VA-009** — Panel compression at 1280px
7. **VA-201/VA-202** — Mobile tab scroll affordance
8. **VA-204** — Mobile chart height responsive

## Auto-fixable Quick Wins (Token/Class Swaps)

These are mechanical fixes that can be applied safely:

| Issue | File | Change |
|-------|------|--------|
| VA-001 | orderbook-panel.tsx:171 | `text-market-down-600` → `text-text-950` |
| VA-002 | orderbook-panel.tsx:97 | `text-text-950` → `text-text-600` (headers) |
| VA-006 | footer-bar.tsx:56 | `rounded-md` → `rounded-sm` |
| VA-007 | top-nav.tsx:77,91 | `rounded-md` → `rounded-sm` |
| VA-008 | main-workspace.tsx:28 | `bg-border-50` → `bg-border-100` |
| VA-011 | trade-sidebar.tsx:10 | `bg-card/95` → `bg-card` |
| VA-012 | orderbook-row.tsx:29 | `hover:bg-surface-analysis/30` → `hover:bg-accent` |
| VA-013 | orderbook-panel.tsx:104 | `hover:bg-transparent` → `hover:bg-accent` |
| VA-014 | trade-panel.tsx:474 | `border-border-100/80` → `border-border-200` |
| VA-015 | trade-panel.tsx:398 | `border-border-100/80` → `border-border-100` |
| VA-017 | favorites-strip.tsx:98 | `bg-surface-execution` → `bg-card` |
| VA-019 | main-workspace.tsx:40-41 | `bg-transparent` → `bg-border-50` |
| VA-109 | footer-bar.tsx | `border-border-100` → `border-border-200` |

---

*Generated by visual audit loop using agent-browser + Claude multimodal analysis*
*Screenshots stored at `/tmp/audit/{light,dark}/{viewport}/{page}.png`*
