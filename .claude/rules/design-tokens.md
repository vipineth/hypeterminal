## Design Tokens

- **No hardcoded colors** - Never use hex values like `text-[#2b2e48]` or `bg-[#f1f3f4]`. Always use token utilities from `src/styles.css`.
- **No arbitrary font sizes** - Never use `text-[10px]` etc. Use the named scale: `text-5xs` (8px), `text-4xs` (9px), `text-3xs` (10px), `text-2xs` (11px), `text-xs` (12px), `text-nav` (13px), `text-sm` (14px), `text-base`+.

### Foreground (fg) — ink intensity, higher = more prominent
- `text-fg-900` primary text, `text-fg-700` secondary, `text-fg-500` tertiary, `text-fg-400` placeholder, `text-fg-300` disabled
- `fg-950` max contrast, `fg-800`/`fg-600` intermediates, `fg-200`/`fg-100` very faint
- **Small text rule**: 8-10px use fg-800+, 11-13px use fg-700+, 14px+ use fg-600+

### Surface — elevation scale, higher = more elevated
- `bg-surface-200` page background, `bg-surface-500` panels, `bg-surface-800` cards/execution
- `bg-surface-alt` alternating rows, subtle contrast
- Full range: `surface-100` (sunken) through `surface-900` (most elevated)

### Other token groups
- **Market** (`market-*`) - Trading data: PnL, prices, %. Use `market-up-*`, `market-down-*`, `market-neutral`
- **Status** (`status-*`) - System feedback: `status-success`, `status-warning`, `status-error`, `status-info` + `-subtle` variants
- **Action** (`action-primary`, `-hover`, `-active`, `-disabled`)
- **Structural** - `border`, `input`, `ring`, `sel`
- **Full token reference** in `design-tokens.md` at project root.

### Border Radius
- **Always use `rounded-xs`** as the default radius for buttons, inputs, cards, badges, and all interactive elements.
- Only deviate for pills/tags (`rounded-full`) or specific design exceptions.
