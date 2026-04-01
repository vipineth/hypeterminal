# HypeTerminal Design Files

## Design System

All mockups should follow the **HyperTerminal Design System** (`@hypeterminal/ui`).
Reference: `packages/ui/src/`

- Use semantic color tokens (bg-base, bg-raised, bg-overlay, text-strong, text-weak, etc.)
- Use `@hypeterminal/ui` components: Button, ButtonIcon, Tooltip, Tabs, NumberInput, etc.
- Typography: Inter for UI, JetBrains Mono for data/numbers
- Icons: Phosphor Icons (used in the codebase) or Lucide (available in Pencil)
- Corner radius: 4px (sm) throughout
- No hardcoded colors — use design token variables defined in the .pen files

## Codebase Reference

The trading terminal codebase lives at `/Users/ankit/Documents/make/hypeterminal/`.
Key files for trade UI reference:
- `apps/terminal/src/components/trade/tradebox/` — trade panel components
- `apps/terminal/src/config/constants.ts` — trading constants (leverage steps, limits)
- `apps/terminal/src/lib/trade/` — trading logic and types
- `apps/terminal/src/hooks/trade/` — trading hooks

## Key Trading Constants

- Leverage range: 1x to per-market max (default 50x, hard max 200x)
- Leverage steps: [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200]
- Margin modes: Cross (shared collateral) / Isolated (per-position)
- Cannot switch to Isolated with open position
- Order types: Market, Limit, Stop
- Min order value: $10 USD
