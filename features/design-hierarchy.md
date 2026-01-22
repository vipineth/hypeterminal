# Feature: Design Hierarchy & Visual System

## Meta

| Field    | Value      |
| -------- | ---------- |
| Priority | High       |
| Status   | Planned    |
| Phase    | 2 of 2     |
| Created  | 2026-01-21 |
| Updated  | 2026-01-21 |
| Depends  | color-system.md |

## Summary

Implement visual hierarchy, typography scales, and component patterns that work with our color system to create a cohesive, readable trading terminal. Focus on information density without sacrificing clarity.

## Design Philosophy

### Linear/Vercel Hierarchy Principles

1. **Content over chrome** - UI elements recede, data dominates
2. **Consistent rhythm** - Spacing follows a predictable scale
3. **Typography as structure** - Size and weight create hierarchy, not decoration
4. **Purposeful contrast** - Important elements stand out, secondary fades
5. **Dense but breathable** - High information density with adequate whitespace

### Trading Terminal Requirements

- **Scannable data** - Prices, P&L, positions readable at a glance
- **Clear status** - Instantly distinguish positive/negative states
- **Action visibility** - Buy/sell buttons unmistakably different
- **Error prominence** - Failed orders, disconnections highly visible
- **Quiet defaults** - Static information doesn't compete with dynamic data

---

## Typography System

### Font Stack

```css
--font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace;
```

Monospace throughout for:
- Aligned numeric columns
- Terminal aesthetic
- Consistent character width for dynamic data

### Type Scale

| Token | Size | Line Height | Use Case |
|-------|------|-------------|----------|
| `text-4xs` | 9px (0.5625rem) | 1.55 | Micro labels, timestamps |
| `text-3xs` | 10px (0.625rem) | 1.5 | Secondary data, hints |
| `text-2xs` | 11px (0.6875rem) | 1.45 | Table cells, dense data |
| `text-xs` | 12px (0.75rem) | 1.5 | Default body text |
| `text-sm` | 14px (0.875rem) | 1.43 | Emphasized data, labels |
| `text-base` | 16px (1rem) | 1.5 | Headers, important values |
| `text-lg` | 18px (1.125rem) | 1.4 | Section headers |
| `text-xl` | 20px (1.25rem) | 1.35 | Page titles |

### Weight System

| Weight | Value | Use |
|--------|-------|-----|
| Normal | 400 | Body text, data |
| Medium | 500 | Labels, navigation |
| Semibold | 600 | Prices, key values |
| Bold | 700 | Headers, alerts |

### Readability Guidelines

**Minimum sizes:**
- Interactive labels: 11px minimum
- Price data: 11px minimum, 12px preferred
- Critical alerts: 14px minimum

**Contrast by importance:**

| Importance | Token | Opacity/Color | Example |
|------------|-------|---------------|---------|
| Primary | `--fg` | 100% | Active prices, P&L |
| Secondary | `--muted-fg` | ~60% | Labels, timestamps |
| Tertiary | `--muted-fg` | ~40% | Hints, disabled |

---

## Spacing System

### Base Unit

8px base unit (Tailwind default). Trading terminals need tighter spacing than typical apps.

### Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `space-0.5` | 2px | Icon padding, tight gaps |
| `space-1` | 4px | Inline spacing, text gaps |
| `space-1.5` | 6px | Dense component padding |
| `space-2` | 8px | Default padding |
| `space-3` | 12px | Component gaps |
| `space-4` | 16px | Section padding |
| `space-6` | 24px | Major section breaks |
| `space-8` | 32px | Panel margins |

### Component Density

| Component | Padding | Gap |
|-----------|---------|-----|
| Button (sm) | 4px 8px | - |
| Button (default) | 6px 12px | - |
| Input | 6px 8px | - |
| Table row | 4px 8px | - |
| Card | 12px | 8px |
| Panel | 16px | 12px |

---

## Visual Hierarchy Patterns

### 1. Data Emphasis Levels

```
Level 1 (Maximum)     → Live prices, P&L totals
  - text-sm/base, font-semibold, text-fg
  - Signal colors for +/- states

Level 2 (High)        → Order details, position sizes
  - text-xs/sm, font-medium, text-fg

Level 3 (Normal)      → Labels, descriptions
  - text-xs, font-normal, text-muted-fg

Level 4 (Low)         → Timestamps, hints, metadata
  - text-2xs/3xs, font-normal, text-muted-fg (reduced opacity)
```

### 2. Interactive Element Hierarchy

**Primary Actions** (Buy/Sell, Submit Order):
```css
/* High contrast, prominent */
background: var(--primary);
color: var(--primary-fg);
font-weight: 600;
```

**Secondary Actions** (Cancel, Close):
```css
/* Visible but not competing */
background: var(--secondary);
color: var(--secondary-fg);
font-weight: 500;
```

**Tertiary Actions** (Edit, Options):
```css
/* Ghost/outline style */
background: transparent;
border: 1px solid var(--border);
color: var(--fg);
font-weight: 400;
```

**Destructive Actions** (Delete, Clear All):
```css
/* Warning prominence */
background: var(--danger);
color: var(--danger-fg);
font-weight: 600;
```

### 3. Signal Color Application

| Element | Positive | Negative | Neutral |
|---------|----------|----------|---------|
| P&L text | `text-positive` | `text-negative` | `text-fg` |
| Price change | `text-positive` | `text-negative` | `text-muted-fg` |
| Buy button | `bg-positive` | - | - |
| Sell button | - | `bg-negative` | - |
| Orderbook bid | `text-positive` (subtle) | - | - |
| Orderbook ask | - | `text-negative` (subtle) | - |
| Chart candles | `fill-positive` | `fill-negative` | - |

### 4. Surface Elevation

| Level | Background | Use |
|-------|------------|-----|
| 0 (Base) | `--bg` | Page background |
| 1 (Surface) | `--surface` | Cards, panels |
| 2 (Elevated) | `--accent` | Popovers, dropdowns |
| 3 (Overlay) | `--muted` | Modals, dialogs |

---

## Component Patterns

### Orderbook Row

```tsx
<div className="flex justify-between px-2 py-0.5 text-2xs">
  <span className="text-muted-fg w-16">12,450</span>      {/* Qty - Level 3 */}
  <span className="text-negative font-medium">45,230.50</span> {/* Price - Level 1 */}
  <span className="text-muted-fg w-16 text-right">8.2%</span>  {/* % - Level 4 */}
</div>
```

### Trade Row

```tsx
<div className="flex items-center gap-2 px-2 py-1 text-xs">
  <span className="text-3xs text-muted-fg">14:32:15</span>    {/* Time - Level 4 */}
  <span className="text-positive font-medium">45,231.00</span> {/* Price - Level 1 */}
  <span className="text-fg">0.125</span>                       {/* Size - Level 2 */}
</div>
```

### Position Card

```tsx
<div className="bg-surface p-3 rounded-md border border-border">
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm font-semibold">BTC-PERP</span>   {/* Symbol - Level 1 */}
    <span className="text-xs px-1.5 py-0.5 bg-positive/10 text-positive rounded">
      LONG                                                     {/* Badge - Accent */}
    </span>
  </div>
  <div className="grid grid-cols-2 gap-2 text-xs">
    <div>
      <span className="text-muted-fg block">Size</span>       {/* Label - Level 3 */}
      <span className="font-medium">1.250 BTC</span>          {/* Value - Level 2 */}
    </div>
    <div>
      <span className="text-muted-fg block">PnL</span>
      <span className="text-positive font-semibold">+$1,234.56</span> {/* P&L - Level 1 */}
    </div>
  </div>
</div>
```

### Input Field

```tsx
<div className="space-y-1">
  <label className="text-xs font-medium text-muted-fg">Price</label>
  <input
    className="w-full px-2 py-1.5 text-sm bg-input border border-border rounded
               focus:border-ring focus:ring-1 focus:ring-ring/20
               placeholder:text-muted-fg/50"
    placeholder="0.00"
  />
</div>
```

---

## Contrast Verification Checklist

| Combination | Required | Status |
|-------------|----------|--------|
| `--fg` on `--bg` | 7:1 | [ ] |
| `--muted-fg` on `--bg` | 4.5:1 | [ ] |
| `--primary-fg` on `--primary` | 4.5:1 | [ ] |
| `--positive` on `--bg` | 4.5:1 | [ ] |
| `--negative` on `--bg` | 4.5:1 | [ ] |
| `--warning` on `--bg` | 4.5:1 | [ ] |
| `--fg` on `--surface` | 7:1 | [ ] |
| `--muted-fg` on `--surface` | 4.5:1 | [ ] |

---

## Implementation Tasks

### Components to Update

- [ ] `button.tsx` - Apply action hierarchy (primary/secondary/destructive)
- [ ] `input.tsx` - Consistent focus states, sizing
- [ ] `badge.tsx` - Signal color variants
- [ ] `tabs.tsx` - Active/inactive contrast
- [ ] `table.tsx` - Row density, hover states
- [ ] `card.tsx` - Surface elevation
- [ ] `dialog.tsx` - Overlay styling

### Trade Components

- [ ] Orderbook - Bid/ask color coding, depth bars
- [ ] Trade history - Flash animations, timestamps
- [ ] Position list - P&L prominence, badges
- [ ] Order entry - Buy/sell button distinction
- [ ] Chart - Candle colors, grid lines

### Testing

- [ ] WebAIM Contrast Checker for all combinations
- [ ] Color blindness simulation (Sim Daltonism or Chrome DevTools)
- [ ] Light/dark mode toggle verification
- [ ] 200% zoom accessibility test

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/styles.css` | Color tokens, custom properties |
| `src/components/ui/button.tsx` | Action variants |
| `src/components/ui/badge.tsx` | Signal variants |
| `src/components/trade/orderbook/*.tsx` | Bid/ask styling |
| `src/components/trade/trades-table.tsx` | Flash animations |
| `src/components/trade/positions/*.tsx` | P&L emphasis |

---

## Anti-Patterns to Avoid

1. **Color as only differentiator** - Always pair with icons/labels
2. **Saturated colors for large areas** - Use signal colors sparingly
3. **Pure black/white** - Causes eye strain, use near-black/off-white
4. **Inconsistent spacing** - Stick to the spacing scale
5. **Over-decoration** - Borders, shadows, gradients should be functional
6. **Competing emphasis** - Not everything can be Level 1

---

## Success Criteria

1. All text passes WCAG AA contrast requirements
2. Color blind users can distinguish buy/sell, profit/loss
3. Users report reduced eye strain in extended sessions
4. Information hierarchy is immediately clear on any screen
5. Dark/light modes feel cohesive, not just inverted

---

## Research Sources

- [10 Dark Mode UI Best Practices](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/) - Design Studio
- [Dark Mode UI in the Spotlight](https://www.netguru.com/blog/tips-dark-mode-ui) - Netguru
- [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) - W3C
- [5 Tips for Colorblind-Friendly Visualizations](https://www.tableau.com/blog/examining-data-viz-rules-dont-use-red-green-together) - Tableau
- [Data Visualization for Colorblind Readers](https://www.datylon.com/blog/data-visualization-for-colorblind-readers) - Datylon
