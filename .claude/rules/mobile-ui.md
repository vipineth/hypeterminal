## Mobile UI Rules

Mobile views live in `apps/terminal/src/components/trade/mobile/`. They mirror the desktop in element sizing and design tokens — only layout/spacing adapts.

### Typography Scale (Mobile)

Follow the same scale as desktop — do NOT inflate font sizes for "mobile readability":

| Role | Token |
|------|-------|
| Metric labels (Size, Entry, Mark…) | `text-2xs text-text-weak` |
| Metric values | `text-xs tabular-nums font-medium` |
| Section labels / uppercase headers | `text-2xs font-medium uppercase` |
| Card header asset name | `text-sm font-semibold` |
| Mark price in header | `text-sm font-semibold tabular-nums` |
| 24h change | `text-xs tabular-nums` |
| Body / descriptions | `text-sm` |

### Header Price Display

- Header mark price: `text-sm font-semibold` (not `text-lg`)
- Stack price + change **vertically** (price above, change below, right-aligned) — do not place them side by side
- Do NOT show Long/Short position badges in chart/trade headers — the position is visible in the Positions tab

### Controls — Ghost vs Outline

Token/unit toggles vary by context:

- **Next to a large input** (e.g. size input in trade form): use `variant="outline"` so the control reads as a bordered selector matching the input's visual weight:
  ```tsx
  <Button variant="outline" intent="neutral" size="sm" iconRight={<CaretDownIcon />}>
    {token}
  </Button>
  ```
- **Standalone / next to a Dropdown trigger**: use `variant="ghost"` to match the Dropdown's minimal style.

`variant="outline"` is also used for primary CTAs (Withdraw, Deposit, Close position).

### Metric Grid in Cards (Positions / Orders)

Do NOT use the `gap-px bg-stroke-weak/20` mosaic trick for metric grids. Instead use explicit row and column dividers:

```tsx
<div className="border-t border-stroke-weak/40">
  <div className="grid grid-cols-3 divide-x divide-stroke-weak/40">
    <MetricCell label="Size" value="..." />
    <MetricCell label="Entry" value="..." />
    <MetricCell label="Mark" value="..." />
  </div>
  <div className="grid grid-cols-3 divide-x divide-stroke-weak/40 border-t border-stroke-weak/40">
    <MetricCell label="Margin" value="..." />
    <MetricCell label="Liq" value="..." />
    <MetricCell label="Funding" value="..." />
  </div>
</div>
```

MetricCell standard:
```tsx
<div className="px-3 py-2">
  <div className="text-2xs text-text-weak mb-0.5">{label}</div>
  <div className="text-xs tabular-nums font-medium">{value}</div>
  {sub && <div className="text-2xs text-text-weak tabular-nums mt-0.5">{sub}</div>}
</div>
```

### Card Action Buttons

Action buttons in position/order cards use `size="xs"` (not raw `<button>` elements):

```tsx
<Button variant="outline" intent="neutral" size="xs">Limit Close</Button>
<Button variant="outline" intent="error"   size="xs">Close</Button>
```

### Reference — Account View

`mobile-account-view.tsx` is the visual reference for card style. Match its:
- Card: `rounded-xs border border-stroke-weak/40 bg-bg-raised`
- Stat label: `text-2xs text-text-weak`
- Stat value: `text-base font-semibold tabular-nums` (for primary metrics only; secondary metrics use `text-xs`)

### Button Size Standard (Mobile)

Use one consistent size per context — never add `min-h-[*]` or `h-[*]` overrides to Button components; they fight the design system.

| Context | Size |
|---------|------|
| Primary form action (Buy/Sell, trade submit) | `size="lg" className="w-full"` |
| Standalone section CTA (Connect Wallet, empty states) | `size="sm"` |
| Account actions (Withdraw, Deposit, Bridge) | `size="md"` in 3-col grid |
| Card action buttons (Cancel, Close, Transfer) | `size="sm"` |
| Card action buttons in position cards (TP/SL, Limit Close, Close) | `size="xs" className="flex-1 justify-center"` |
| Ghost market switcher in card headers | `size="sm"` |
| Inline toggle controls (unit switcher) | `size="sm" variant="ghost"` |

Never use `min-h-[36px]` or `min-h-[44px]` as class overrides on Button — the component's size prop already handles height correctly.
