---
globs: ["*.ts", "*.tsx", "*.js", "*.jsx"]
alwaysApply: true
description: Code style rules
---

## Component Structure

- **One component per file** - Small internal helpers OK
- **No index.ts barrel files** - Import directly from files
- **Name props interface `Props`** - Always use `interface Props`, not `type`
- **Prefer function declarations** - `function handleClick()` over arrows
- **Use `cn()` for classes** - From `@/lib/cn` for conditional classes
- **Keep components clean** - Move calculations to `lib/` utilities
- **Organize utils by domain** - `lib/trade/`, `lib/chart/`, etc.
- **Minimize useEffect** - Only for true side effects
- **No comments in components** - Logic should be self-explanatory

## Comments & Console

- No unnecessary comments - code should be self-documenting
- Never leave `console.log` in production code

## Helper Functions

Only create helpers when logic is reused, complex, or significantly improves readability. Don't create helpers for simple one-liners.

## React Hooks

**useEffect**: Only for side effects (subscriptions, DOM, external APIs). Never for derived state.
**useMemo**: For expensive calculations or referential equality. Don't over-memoize.
**useState**: Prefer primitives/indices over complex objects.
**useCallback**: Only when passing to memoized children.

```tsx
// Bad - useEffect for derived state
useEffect(() => { if (!selected && options.length) setSelected(options[0]); }, [options]);

// Good - derive directly
const selected = options[selectedIndex] ?? options[0];
```

## hl-react Subscriptions

- Use `useSubL2Book`, `useSubTrades` for real-time data
- Use `useInfo*` hooks for one-time fetches
- Use `useAction*` hooks for mutations
- Process data in `lib/`, not components
- Only memoize array transformations, not trivial calculations
- Use literal types: `nSigFigs: 2 | 3 | 4 | 5` not `number`


## Format Functions

Pass API values directly to formatters - they accept `string | number | null | undefined`:


## Comment Policy

### Unacceptable Comments
- Comments that repeat what code does
- Commented-out code (delete it)
- Obvious comments ("increment counter")
- Comments instead of good naming

### Principle
Code should be self-documenting. If you need a comment to explain WHAT the code does, consider refactoring to make it clearer.