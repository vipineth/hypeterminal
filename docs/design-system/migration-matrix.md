# Migration Matrix

Snapshot taken on March 11, 2026 from the rewrite worktree after the native shadcn baseline landed.

## Legacy Prop Mapping

| Legacy usage | Native target |
| --- | --- |
| `Button variant="contained"` | `Button variant="default"` |
| `Button variant="outlined"` | `Button variant="outline"` |
| `Button variant="text"` | `Button variant="ghost"` or `Button variant="link"` |
| `Button tone="accent"` | use `variant`, semantic utility classes, or wrapper composition |
| `Button size="md"` | `default`, `sm`, `lg`, or explicit layout class |
| `TabsList variant="underline"` | `TabsList variant="line"` |
| `TabsContentGroup` | plain layout container in feature code |

## Legacy Token Mapping

| Legacy token family | Native target |
| --- | --- |
| `text-text-*` | `text-foreground`, `text-muted-foreground`, or semantic utility class |
| `surface-*` | `bg-background`, `bg-card`, `bg-muted`, `bg-popover` |
| `border-border-*` | `border-border` plus opacity utility if needed |
| `primary-default` | `primary` |
| `market-up-*` / `market-down-*` | feature-level semantic classes or chart/status wrappers |

## Remaining Debt Snapshot

- `variant="text"`: `53`
- `variant="outlined"`: `13`
- `variant="contained"`: `5`
- `tone=`: `2`
- `size="md"`: `5`
- `text-text-*` usages: `321`
- `surface-*` usages: `144`
- `border-border-*` usages: `118`
- `primary-default` usages: `129`
- `market-up/down-*` usages: `181`

## Expected Migration Order

1. Low-risk screens: not found, settings, wallet, send/transfer, global dialogs.
2. Shell and navigation: top nav, footer, mobile nav, layout containers.
3. Data surfaces: balances, orders, history, funding, badges, tables.
4. Dense trading UI: trade panel, order entry, leverage, TP/SL, orderbook.
