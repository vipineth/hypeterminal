## Style & UI Guide

### Border Colors

| State | Token | Notes |
|-------|-------|-------|
| Default | `border-border` | Structural neutral border |
| Subtle default | `border-border/60` | Lighter variant for inputs, small buttons |
| Hover emphasis | `hover:border-fg-400` | Neutral hover — slightly stronger than structural |
| Focus | `focus:border-ring` or `focus:border-status-info/60` | Inputs use `focus:border-status-info/60` |
| Focus-within | `focus-within:border-fg-400` | Wrapper containers |
| Active tab/selected | `border-fg-900` | Matches active text weight |
| Disabled | `border-fg-300` | Faded structural |
| Error | `border-market-down-primary` or `border-status-error` | Semantic error |
| Semantic | `border-status-*`, `border-market-*`, `border-action-*` | Use matching semantic token |

- Never use opacity-based fg borders for hover (e.g. `hover:border-fg-900/30`). Use solid `hover:border-fg-400` instead.
- Never use `border-fg-500` for default borders. Use `border-border` or `border-border/60`.
