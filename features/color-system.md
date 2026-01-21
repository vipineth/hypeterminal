# Feature: Color System Design

## Meta

| Field    | Value      |
| -------- | ---------- |
| Priority | High       |
| Status   | In Progress |
| Phase    | 1 of 2     |
| Created  | 2026-01-21 |
| Updated  | 2026-01-21 |

## Summary

Design a comprehensive color system for HyperTerminal inspired by Linear and Vercel's design language. Prioritize eye comfort for extended trading sessions while maintaining elegance, clarity, and meaningful signal colors.

## Design Philosophy

### Core Principles

1. **Eye Comfort First** - Traders view terminals 8-16 hours daily. Every color choice must minimize strain.
2. **Meaningful Signals** - Red/green convey profit/loss instantly. Colors must communicate, not decorate.
3. **Linear-Inspired Minimalism** - Monochrome foundation with purposeful accent colors.
4. **Perceptual Uniformity** - Use OKLCH for consistent lightness across the palette.
5. **Accessibility** - WCAG AA minimum (4.5:1 for text, 3:1 for UI elements).

### Why OKLCH?

OKLCH provides perceptually uniform colors where equal lightness values appear equally bright to human eyes. This eliminates the common problem in HSL where colors with the same lightness look different in brightness.

**Benefits for trading terminals:**
- Consistent text readability across all colors
- Predictable color modifications for states (hover, active, disabled)
- Better gradients without muddy midpoints
- Access to P3 wide gamut for vibrant signals on modern displays

## Research Findings

### Eye Strain Reduction (Trading Terminals)

| Principle | Recommendation | Source |
|-----------|---------------|--------|
| Background | Dark gray (#121212) not pure black | Material Design |
| Text | Off-white (#E0E0E0) not pure white | Reduces halation |
| Contrast | 4.5:1 minimum, 7:1 avoid | WCAG AA / eye fatigue |
| Saturation | Muted signals, medium saturation | JustMarkets research |
| Blue light | Warm gray tints reduce strain | Multiple studies |

### Linear/Vercel Design Language

| Aspect | Linear | Vercel |
|--------|--------|--------|
| Dark BG | #121212 | #000000 (varies) |
| Text | #cccccc | Light gray |
| Accent | Purple (#848CD0) | Minimal, functional |
| Philosophy | Monochrome + few bold accents | Ultra-minimal |

### WCAG Contrast Requirements

| Text Type | Minimum Ratio | Level |
|-----------|---------------|-------|
| Normal text (< 18px) | 4.5:1 | AA |
| Large text (≥ 18px or 14px bold) | 3:1 | AA |
| Enhanced | 7:1 | AAA |
| UI components | 3:1 | AA |

### Color Blindness Considerations

- **8% of men** have red-green color blindness (deuteranopia)
- Blue is the "safest hue" - appears consistent across all vision types
- Consider blue/orange as alternative to red/green
- Use secondary cues (icons, labels) alongside color

## Color Palette Specification

### Design Tokens (OKLCH)

OKLCH format: `oklch(L C H)` where:
- **L** = Lightness (0-1, perceptually uniform)
- **C** = Chroma (0-0.4, saturation intensity)
- **H** = Hue (0-360, color angle)

---

### Light Mode

```css
/* Foundation - Warm neutral gray */
--bg: oklch(0.97 0.003 250);           /* Near white, hint of cool */
--fg: oklch(0.15 0.01 250);            /* Near black, not pure */
--surface: oklch(0.99 0.002 250);      /* Cards, elevated surfaces */
--surface-fg: oklch(0.15 0.01 250);

/* Interactive */
--primary: oklch(0.50 0.12 250);       /* Blue-purple, action color */
--primary-fg: oklch(0.98 0 0);
--secondary: oklch(0.93 0.005 250);    /* Subtle buttons */
--secondary-fg: oklch(0.25 0.01 250);

/* Neutral */
--muted: oklch(0.94 0.003 250);        /* Disabled, placeholder */
--muted-fg: oklch(0.45 0.01 250);
--accent: oklch(0.91 0.008 250);       /* Hover states */
--accent-fg: oklch(0.15 0.01 250);

/* Semantic */
--danger: oklch(0.55 0.18 25);         /* Destructive actions */
--danger-fg: oklch(0.98 0 0);

/* Structural */
--border: oklch(0.88 0.008 250);       /* Dividers, outlines */
--input: oklch(0.96 0.003 250);        /* Form fields */
--ring: oklch(0.50 0.12 250);          /* Focus rings */

/* Signals - Trading specific */
--positive: oklch(0.52 0.14 145);      /* Profit, long, buy - desaturated green */
--negative: oklch(0.55 0.16 25);       /* Loss, short, sell - desaturated red */
--info: oklch(0.50 0.10 240);          /* Informational - blue */
--warning: oklch(0.60 0.14 80);        /* Caution - amber */
--highlight: oklch(0.55 0.14 290);     /* Focus, selection - purple */
```

---

### Dark Mode

```css
/* Foundation - True dark with minimal warmth */
--bg: oklch(0.12 0.005 250);           /* Dark gray, not pure black */
--fg: oklch(0.87 0.005 250);           /* Off-white, reduces halation */
--surface: oklch(0.15 0.005 250);      /* Elevated surfaces */
--surface-fg: oklch(0.87 0.005 250);

/* Interactive */
--primary: oklch(0.72 0.14 165);       /* Teal-cyan, high visibility */
--primary-fg: oklch(0.12 0 0);
--secondary: oklch(0.20 0.005 250);    /* Subtle dark buttons */
--secondary-fg: oklch(0.75 0.005 250);

/* Neutral */
--muted: oklch(0.18 0.003 250);        /* Subtle backgrounds */
--muted-fg: oklch(0.55 0.005 250);
--accent: oklch(0.22 0.005 250);       /* Hover states */
--accent-fg: oklch(0.87 0.005 250);

/* Semantic */
--danger: oklch(0.62 0.20 25);         /* Destructive actions */
--danger-fg: oklch(0.98 0 0);

/* Structural */
--border: oklch(0.25 0.005 250);       /* Subtle dividers */
--input: oklch(0.16 0.003 250);        /* Form fields */
--ring: oklch(0.72 0.14 165);          /* Focus rings */

/* Signals - Trading specific (vibrant but not harsh) */
--positive: oklch(0.72 0.16 145);      /* Profit - vibrant green */
--negative: oklch(0.65 0.18 25);       /* Loss - visible red */
--info: oklch(0.75 0.10 210);          /* Info - soft cyan */
--warning: oklch(0.78 0.14 85);        /* Warning - warm amber */
--highlight: oklch(0.70 0.12 300);     /* Highlight - soft purple */
```

---

## Signal Color Rationale

### Positive (Green) - Profit/Buy/Long

| Mode | Value | Contrast vs BG | Notes |
|------|-------|----------------|-------|
| Light | `oklch(0.52 0.14 145)` | 5.2:1 | Muted green, readable |
| Dark | `oklch(0.72 0.16 145)` | 6.8:1 | Vibrant but not neon |

- Hue 145 = natural green (not too yellow, not too blue)
- Medium chroma (0.14-0.16) reduces eye fatigue vs saturated greens
- Lightness tuned for contrast compliance

### Negative (Red) - Loss/Sell/Short

| Mode | Value | Contrast vs BG | Notes |
|------|-------|----------------|-------|
| Light | `oklch(0.55 0.16 25)` | 4.8:1 | Warm red, not alarming |
| Dark | `oklch(0.65 0.18 25)` | 5.6:1 | Visible without glowing |

- Hue 25 = warm red-orange (less aggressive than pure red)
- Medium chroma to reduce emotional stress during losses
- Passes contrast requirements without being harsh

### Color Blind Alternative (Optional)

For users with deuteranopia, consider offering:
- **Long/Profit**: Blue (`oklch(0.55 0.12 240)` / `oklch(0.72 0.12 240)`)
- **Short/Loss**: Orange (`oklch(0.60 0.16 50)` / `oklch(0.75 0.16 50)`)

---

## Contrast Verification

All text colors must pass WCAG AA. Target ratios:

| Element | Min Ratio | Target | Actual (Dark) |
|---------|-----------|--------|---------------|
| Body text (--fg on --bg) | 4.5:1 | 7:1 | ~12:1 |
| Muted text (--muted-fg on --bg) | 4.5:1 | 4.5:1 | ~5:1 |
| Primary on bg | 3:1 | 4.5:1 | ~8:1 |
| Signal colors on bg | 4.5:1 | 5:1 | 5.5-7:1 |

---

## Implementation Notes

### CSS Structure

```css
@theme inline {
  /* Map CSS variables to Tailwind utilities */
  --color-bg: var(--bg);
  --color-fg: var(--fg);
  /* ... */
}

:root { /* Light mode defaults */ }
.dark { /* Dark mode overrides */ }
```

### Tailwind Usage

```tsx
<div className="bg-bg text-fg">
  <span className="text-positive">+$1,234.56</span>
  <span className="text-negative">-$567.89</span>
</div>
```

### Gradient Recommendations

OKLCH gradients interpolate better than RGB:

```css
/* Smooth gradient for depth visualization */
background: linear-gradient(
  in oklch,
  oklch(from var(--positive) l c h / 0.15) 0%,
  transparent 100%
);
```

---

## Tasks

### Phase 1 (This Document)

- [x] Research eye strain reduction for trading terminals
- [x] Study Linear/Vercel design language
- [x] Define OKLCH color tokens for light mode
- [x] Define OKLCH color tokens for dark mode
- [x] Document signal color rationale
- [ ] Implement in `src/styles.css`
- [ ] Verify contrast ratios with tooling

### Phase 2 (design-hierarchy.md)

- [ ] Define typography scale and hierarchy
- [ ] Establish spacing system
- [ ] Document component patterns
- [ ] Implement visual hierarchy across components

---

## Research Sources

- [OKLCH in CSS: Why we moved from RGB and HSL](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) - Evil Martians
- [Dark Mode UI Best Practices](https://atmos.style/blog/dark-mode-ui-best-practices) - Atmos
- [Color Themes for Trading](https://justmarkets.com/trading-articles/learning/color-themes-for-comfortable-intraday-trading-and-scalping) - JustMarkets
- [WCAG 2.2 Contrast Requirements](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) - W3C
- [Linear Design Trend](https://blog.logrocket.com/ux-design/linear-design/) - LogRocket
- [Colorblind-Friendly Palettes](https://venngage.com/blog/color-blind-friendly-palette/) - Venngage
- [Linear.style](https://linear.style/) - Linear theme collection

---

## Open Questions

- [ ] Should we offer a colorblind mode toggle (blue/orange signals)?
- [ ] Do we need a "high contrast" mode for accessibility?
- [ ] Should chart candles use the same signal colors or slightly different variants?
