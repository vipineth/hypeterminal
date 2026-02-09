## Design Tokens

- **No hardcoded colors** - Never use hex values like `text-[#2b2e48]` or `bg-[#f1f3f4]`. Always use token utilities from `src/styles.css`.
- **No arbitrary font sizes** - Never use `text-[10px]` etc. Use the named scale: `text-5xs` (8px), `text-4xs` (9px), `text-3xs` (10px), `text-2xs` (11px), `text-xs` (12px), `text-nav` (13px), `text-sm` (14px), `text-base`+.

### Text — ink intensity, higher number = more prominent
- `text-text-950` primary text (max contrast)
- `text-text-600` secondary text
- `text-text-500` tertiary text
- `text-text-400` placeholder text
- `text-text-10` inverse/white text
- **Small text rule**: 8-10px use `text-text-950`, 11-13px use `text-text-600`+, 14px+ use `text-text-500`+

### Surface — named elevation levels
- `bg-surface-base` page background
- `bg-surface-analysis` panels
- `bg-surface-execution` cards/elevated
- `bg-surface-monitoring-row-a` table row A
- `bg-surface-monitoring-row-b` table row B (alternating)

### Border — structural borders, higher number = stronger
- `border-border-200` default border (set in base layer)
- `border-border-100` subtle border
- `border-border-300` medium border
- `border-border-500` strong border
- `border-border-50` very faint border

### Primary — interactive accent (blue)
- `primary-default` default, `primary-hover` hover, `primary-active` pressed, `primary-muted` disabled/muted
- Works with all prefixes: `bg-primary-default`, `text-primary-default`, `border-primary-default`

### Other token groups
- **Market** — Trading data: PnL, prices, %. `market-up-600` (primary green), `market-up-500` (muted), `market-up-100`/`market-up-50` (subtle bg). Same pattern for `market-down-*`. `market-neutral` for unchanged.
- **Success** — `success-700` text, `success-100` subtle background
- **Warning** — `warning-700` text, `warning-100` subtle background
- **Error** — `error-700` text, `error-100` subtle background
- **Fill** — `fill-900` (black), `fill-300` (muted), `fill-100`/`fill-50` (light)
- **Highlight** — `highlight` (orange accent, #F7931A)
- **Structural** — `sel` (selection highlight)

### Border Radius
- **Always use `rounded-xs`** as the default radius for buttons, inputs, cards, badges, and all interactive elements.
- Only deviate for pills/tags (`rounded-full`) or specific design exceptions.
