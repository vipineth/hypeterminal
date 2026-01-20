# Feature: Color Tokens and Theme Naming

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | In Progress |
| Created | 2026-01-20 |
| Updated | 2026-01-20 |

## Summary

Standardize color tokens for multi-theme Tailwind usage with short names (`bg`/`fg`, `*-fg`) and explicit signal tokens (`positive`, `negative`, `info`, `warning`, `highlight`). Replace legacy token names in styles and components, and document the naming rules.

## User Stories

- As a designer, I want short, consistent color class names so UI tweaks are fast.
- As a developer, I want a clear token map so theming changes are safe and predictable.
- As a maintainer, I want a single script to migrate old token names to new ones.

## Requirements

### Must Have

- [ ] Base theme tokens use short names: `bg`, `fg`, `surface`, `*-fg`.
- [ ] Status tokens use semantic names: `positive`, `negative`, `info`, `warning`, `highlight`.
- [ ] Tailwind classes use the short tokens (e.g., `bg-bg`, `text-fg`, `text-muted-fg`).
- [ ] Chart theming reads the new CSS variables (no legacy `--bg`/`--terminal-*` vars).
- [ ] No unused color tokens remain in `src/styles.css`.
- [ ] A migration script exists to replace legacy token names.
- [ ] UI/UX guidelines are updated to reflect new class names.

### Nice to Have

- [ ] Optional alias support for gradual migration (only if needed).

## Tasks

1. [ ] Audit current token usage in styles and components.
2. [ ] Update `src/styles.css` to the new short token names.
3. [ ] Update Tailwind class names across components to match new tokens.
4. [ ] Update chart theming utilities to read new CSS variables.
5. [ ] Add a migration script for old-to-new token replacement.
6. [ ] Update UI/UX guidelines and add a token glossary.

## Technical Spec

### Naming Convention

- **Base:** `bg`, `fg`, `surface`, `surface-fg`
- **Variants:** `primary`, `primary-fg`, `secondary`, `secondary-fg`, `muted`, `muted-fg`, `accent`, `accent-fg`
- **Danger:** `danger`, `danger-fg`
- **Signals:** `positive`, `negative`, `info`, `warning`, `highlight`
- **No sidebar tokens:** sidebar uses base + accent tokens (`bg`, `fg`, `accent`, `border`, `ring`)

### Token Glossary

| Token | Use | Tailwind Example |
|-------|-----|------------------|
| `bg` | App background | `bg-bg` |
| `fg` | Default text | `text-fg` |
| `surface` | Panels/cards | `bg-surface` |
| `surface-fg` | Text on surface | `text-surface-fg` |
| `muted` | Subtle fills | `bg-muted/40` |
| `muted-fg` | Secondary text | `text-muted-fg` |
| `danger` | Destructive states | `bg-danger` |
| `danger-fg` | Text on danger | `text-danger-fg` |
| `positive` | Gains/long | `text-positive` |
| `negative` | Loss/short | `text-negative` |
| `info` | Active/selected | `text-info` |
| `warning` | Mark price/alerts | `text-warning` |
| `highlight` | Rare emphasis | `text-highlight` |

## Files

### Modify

- `src/styles.css` - token definitions + Tailwind mappings
- `src/components/trade/chart/theme-colors.ts` - chart colors read from new vars
- `src/components/ui/flash.tsx` - flash color vars
- `src/components/trade/components/wallet-dialog.tsx` - remove legacy token usage
- `docs/ui-ux-guidelines.md` - update token references

### Create

- `scripts/replace-color-tokens.sh` - legacy token migration

## Research Notes

- **Token usage spans**: layout backgrounds, cards/surfaces, status badges, order entry states, and chart theming.
- **Chart theme**: TradingView colors are derived from CSS vars in `src/components/trade/chart/theme-colors.ts`.
- **Glow effects**: removed glow utility classes; no glow-specific styles remain.
- **Scanlines/grid**: overlays are used in `trade-terminal-page` and chart panel; they should stay theme-aware.
- **Sidebar**: removed sidebar-specific color tokens; the component now uses base + accent tokens.
- **Legacy token found**: `terminal-yellow` existed only in the wallet dialog; replaced by `warning`.

## Open Questions

- Should we add optional aliases for backward compatibility, or enforce strict use of new tokens only?
