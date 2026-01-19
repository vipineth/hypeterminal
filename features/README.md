# Feature Specs

This folder contains specifications for planned features. Each feature has its own file with requirements, technical details, and implementation notes.

## Feature List

| Feature | Priority | Status | File |
|---------|----------|--------|------|
| TP/SL Orders | High | Planned | [tp-sl.md](./tp-sl.md) |
| Advanced Order Types | High | Planned | [advanced-order-types.md](./advanced-order-types.md) |
| Leverage Management | High | Planned | [leverage-management.md](./leverage-management.md) |
| Spot Swap | High | Planned | [spot-swap.md](./spot-swap.md) |

## Status Legend

- **Planned** - Spec written, not started
- **In Progress** - Active development
- **Review** - Implementation complete, needs testing
- **Done** - Shipped

## Adding a New Feature

1. Copy `_template.md` to a new file (e.g., `my-feature.md`)
2. Fill in all sections
3. Add to the Feature List table above

## Template Structure

See [_template.md](./_template.md) for the full template. Key sections:

| Section | Purpose |
|---------|---------|
| **Meta** | Priority, status, dates |
| **Summary** | 1-2 sentence description |
| **User Stories** | Who needs this and why |
| **Requirements** | Must have vs nice to have |
| **Tasks** | Ordered implementation steps |
| **Technical Spec** | SDK details, hooks, state |
| **Files** | What to modify/create |
| **UI/UX** | Components and user flow |
| **Edge Cases** | Things to handle |
| **Research Notes** | Findings from exploration |
| **Open Questions** | Unresolved decisions |

This structure helps agents quickly understand the feature scope, technical requirements, and implementation path.
