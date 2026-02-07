# HypeTerminal Design Tokens

## Foreground (fg) — Ink Intensity Scale

Higher number = more prominent ink. Used for text, icons, borders drawn ON surfaces.

| Token | Tailwind | Purpose | Light | Dark |
|---|---|---|---|---|
| `fg-950` | `text-fg-950` | Max contrast | `#111827` | `#F4F5F7` |
| `fg-900` | `text-fg-900` | Primary text, headings | `#2B2E48` | `#E6E9EF` |
| `fg-800` | `text-fg-800` | Between primary/secondary | `#3D4255` | `#CDD2DC` |
| `fg-700` | `text-fg-700` | Secondary text, labels | `#5A6370` | `#A9B0BC` |
| `fg-600` | `text-fg-600` | Between secondary/tertiary | `#6B7380` | `#939BAA` |
| `fg-500` | `text-fg-500` | Tertiary text, timestamps | `#727B87` | `#7F8896` |
| `fg-400` | `text-fg-400` | Placeholder text | `#8B939D` | `#6A7280` |
| `fg-300` | `text-fg-300` | Disabled text | `#B3B8BF` | `#4E5563` |
| `fg-200` | `text-fg-200` | Very faint | `#CCD1D7` | `#3A4150` |
| `fg-100` | `text-fg-100` | Barely visible | `#E2E5E9` | `#2A3040` |

### Small Text Rules (Terminal UI, 8-13px)

| Font Size | Minimum fg Level |
|---|---|
| 8-10px (`text-5xs` to `text-3xs`) | `fg-800` |
| 11-12px (`text-2xs` to `text-xs`) | `fg-700` |
| 13px (`text-nav`) | `fg-700` |
| 14px+ (`text-sm`+) | `fg-600` |

---

## Surface — Elevation Scale

Higher number = more elevated layer. Used for backgrounds.

| Token | Tailwind | Purpose | Light | Dark |
|---|---|---|---|---|
| `surface-100` | `bg-surface-100` | Inset/sunken | `#EDF0F1` | `#090A0B` |
| `surface-200` | `bg-surface-200` | Page background (was surface-base) | `#F1F3F4` | `#0D0F11` |
| `surface-300` | `bg-surface-300` | Subtle elevation | `#F5F6F7` | `#111417` |
| `surface-400` | `bg-surface-400` | Between base & panels | `#F9FAFA` | `#15181D` |
| `surface-500` | `bg-surface-500` | Panels (was surface-analysis) | `#FDFDFD` | `#191D23` |
| `surface-600` | `bg-surface-600` | Between panels & elevated | `#FEFEFE` | `#1D2229` |
| `surface-700` | `bg-surface-700` | Near elevated | `#FEFEFE` | `#222730` |
| `surface-800` | `bg-surface-800` | Cards/execution (was surface-execution) | `#FFFFFF` | `#262C36` |
| `surface-900` | `bg-surface-900` | Above elevated | `#FFFFFF` | `#2A313C` |
| `surface-alt` | `bg-surface-alt` | Alternating rows, subtle contrast | `#F9F9FA` | `#262C36` |

---

## Action Colors

| Token | Tailwind | Purpose | Light | Dark |
|---|---|---|---|---|
| `action-primary` | `bg-action-primary` | Primary buttons, links | `#2563EB` | `#4F7DFF` |
| `action-primary-hover` | `bg-action-primary-hover` | Hover state | `#1D4ED8` | `#3B6CF6` |
| `action-primary-active` | `bg-action-primary-active` | Active/pressed state | `#1E40AF` | `#2F5CE0` |
| `action-primary-disabled` | `bg-action-primary-disabled` | Disabled state | `#A5B4FC` | `#2A3A5F` |

---

## Market / Trading Colors

| Token | Tailwind | Purpose | Light | Dark |
|---|---|---|---|---|
| `market-up-primary` | `text-market-up-primary` | Buy/long/gain primary | `#056E05` | `#4CAF6A` |
| `market-up-muted` | `text-market-up-muted` | Buy/long/gain muted | `#4FA14F` | `#2E8B4F` |
| `market-up-subtle` | `bg-market-up-subtle` | Buy/long/gain bg | `#E6F4E6` | `#123524` |
| `market-down-primary` | `text-market-down-primary` | Sell/short/loss primary | `#C8241B` | `#E26D63` |
| `market-down-muted` | `text-market-down-muted` | Sell/short/loss muted | `#E06A63` | `#C94B44` |
| `market-down-subtle` | `bg-market-down-subtle` | Sell/short/loss bg | `#FCE9E8` | `#3A1C1C` |
| `market-neutral` | `text-market-neutral` | Neutral/unchanged | `#8A919A` | `#9AA4B2` |

---

## Status Colors

| Token | Tailwind | Purpose | Light | Dark |
|---|---|---|---|---|
| `status-success` | `text-status-success` | Success | `#1F7A3F` | `#4CAF6A` |
| `status-success-subtle` | `bg-status-success-subtle` | Success bg | `#E4F3EA` | `#123524` |
| `status-warning` | `text-status-warning` | Warning | `#FFAD0D` | `#FFAD0D` |
| `status-warning-subtle` | `bg-status-warning-subtle` | Warning bg | `#FFF3D6` | `#4A3A12` |
| `status-error` | `text-status-error` | Error | `#A63A2B` | `#E26D63` |
| `status-error-subtle` | `bg-status-error-subtle` | Error bg | `#FBEAE7` | `#3A1C1C` |
| `status-info` | `text-status-info` | Info | `#2563EB` | `#4F7DFF` |
| `status-info-subtle` | `bg-status-info-subtle` | Info bg | `#EAF0FF` | `#1B2A4A` |

---

## Structural

| Variable | Purpose | Light | Dark |
|---|---|---|---|
| `--border` | Default border color | `#CFD9E1` | `#2D3748` |
| `--input` | Input background | `#F1F3F4` | `#1A1F28` |
| `--ring` | Focus ring | `#2563EB` | `#4F7DFF` |
| `--sel` | Selection highlight | `rgba(37,99,235,0.15)` | `rgba(79,125,255,0.15)` |

---

## Typography Scale

| Class | Size | Use |
|---|---|---|
| `text-5xs` | 8px | Badges |
| `text-4xs` | 9px | Micro labels |
| `text-3xs` | 10px | Dense tables |
| `text-2xs` | 11px | Secondary data |
| `text-xs` | 12px | Standard small |
| `text-nav` | 13px | Navigation links |
| `text-sm` | 14px | Standard body |
| `text-base` | 16px | Large body |

---

## Migration Reference (Old → New)

| Old Token | New Token |
|---|---|
| `text-text-primary` | `text-fg-900` |
| `text-text-secondary` | `text-fg-700` |
| `text-text-tertiary` | `text-fg-500` |
| `text-text-placeholder` | `text-fg-400` |
| `text-text-disabled` | `text-fg-300` |
| `bg-surface-base` | `bg-surface-200` |
| `bg-surface-analysis` | `bg-surface-500` |
| `bg-surface-execution` | `bg-surface-800` |
| `bg-surface-monitoring-row-a` | `bg-surface-800` |
| `bg-surface-monitoring-row-b` | `bg-surface-alt` |
| `border-text-primary` | `border-fg-900` |
| `var(--text-primary)` | `var(--fg-900)` |
| `var(--text-secondary)` | `var(--fg-700)` |
| `var(--text-tertiary)` | `var(--fg-500)` |
| `var(--surface-base)` | `var(--surface-200)` |
| `var(--surface-analysis)` | `var(--surface-500)` |
| `var(--surface-execution)` | `var(--surface-800)` |
