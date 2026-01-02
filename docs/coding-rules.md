# Coding Rules

These rules keep the codebase consistent, modular, and scalable. Follow existing patterns first; when in doubt, add the smallest change that fits the current structure.

## Sources of truth
- `docs/architecture.md` for architecture and domain-specific constraints.
- `docs/ui-ux-guidelines.md` for UI/UX rules.
- `docs/order-entry-spec.md` for feature-specific requirements when present.

## Documentation hygiene
- Keep all docs, rules, and guidelines in `docs/` (no root-level docs).
- Use short, descriptive filenames (kebab-case).
- Update internal links whenever files move or are renamed.

## Project layout (current)
```
src/
  components/      # App/feature UI components
    ui/            # shadcn/ui primitives (keep generic)
    trade/         # Trade terminal feature
  hooks/           # React hooks (with domain subfolders)
  stores/          # Zustand stores
  lib/             # Pure domain logic and utilities (no React)
  config/          # Third-party config and env wiring
  constants/       # Shared constants
  providers/       # React context providers
  routes/          # TanStack Router file-based routes
  types/           # Shared type definitions and ambient d.ts
  styles.css       # Global styles (Tailwind-first)
```

## Naming conventions
- **Files/Folders:** kebab-case (e.g., `order-entry-panel.tsx`, `use-market-prefs-store.ts`).
- **React components:** PascalCase (e.g., `OrderEntryPanel`).
- **Hooks:** `useX` naming, file `use-x.ts`.
- **Zustand stores:** `use-*-store.ts` with a `useXStore` export.
- **Constants:** `UPPER_SNAKE_CASE` for exported constants.
- **Routes:** keep route filenames in `src/routes/` only; `routeTree.gen.ts` is auto-generated.
- **Exports:** prefer named exports for components and hooks.
- **Variables:** short but specific; avoid generic names (`data`, `item`, `value`) unless scoped.
- **Booleans:** `is/has/can/should` prefixes.
- **Arrays:** plural names; single items are singular.
- **Units:** include units in names (e.g., `timeoutMs`, `priceUsd`, `sizePct`).
- **Functions:** verb + noun; `get` for sync reads, `fetch` for async, `build`/`create` for pure constructors.
- **Handlers:** `onX` for props, `handleX` for internal functions.
- **Components:** describe purpose, not shape; avoid generic `Card`, `Panel`, `Wrapper` unless scoped.
- **Colors/CSS vars:** semantic tokens only (e.g., `--color-surface`, `--color-accent`), avoid raw color names.

## Component structure and breakdown
- Keep components focused on a single responsibility.
- Split a component when it grows past ~200 lines, mixes concerns (data + view + mutations), or becomes hard to read.
- Prefer **container + presentational** separation:
  - Container: data loading, store access, side effects.
  - Presentational: UI and props only.
- Co-locate small, feature-specific subcomponents inside the feature folder.
- Promote a component to shared only after it is reused in 2+ places.

### Recommended feature pattern
```
src/components/<feature>/
  <feature>-panel.tsx      # main container
  components/              # presentational pieces
  hooks/                   # feature-specific hooks
  lib/                     # feature-only helpers
  index.ts                 # public exports
```

## Hooks
- Place hooks in `src/hooks/` and group by domain (`src/hooks/hyperliquid/`, `src/hooks/markets/`).
- Hooks can import from `lib`, `stores`, `config`, and `constants` but should not import from `components`.
- Keep hook APIs small and return only what the UI needs.

## Stores (Zustand)
- Keep all stores in `src/stores/`.
- Use the `actions` object pattern for mutations.
- Use `createSelectors` where appropriate for memoized selectors.
- Validate persisted data (Zod) and guard `localStorage` usage in SSR.

## lib/ (pure logic)
- Keep `src/lib/` free of React/DOM dependencies.
- Domain-specific logic lives in subfolders (e.g., `src/lib/hyperliquid/`).
- Prefer small, focused modules over a growing `utils.ts`.

## Routes
- Route files in `src/routes/` should be thin: load data and render feature components.
- Use loaders for data fetching when it matches the route boundary.
- Never edit `src/routeTree.gen.ts` (auto-generated).

## SEO
Every route should define SEO metadata using the `buildPageHead` helper from `src/lib/seo.ts`.

### Required for each route
- **`title`**: concise page title (suffixed with site name automatically).
- **`description`**: 120–155 characters summarizing the page content.
- **`path`**: canonical URL path (e.g., `"/trade"`).

Note: Site name is "HypeTerminal" (Hype = Hyperliquid ticker).

### Optional
- **`keywords`**: page-specific keywords (base keywords are included by default).
- **`noIndex`**: set `true` for internal/dev pages (e.g., `/components`).
- **`ogImage`**: custom Open Graph image URL.

### Example
```ts
export const Route = createFileRoute("/trade")({
  head: () =>
    buildPageHead({
      title: "Trade",
      description: "Trade perpetuals on Hyperliquid with real-time charts.",
      path: "/trade",
      keywords: ["perpetuals", "orderbook"],
    }),
  component: TradePage,
});
```

### SEO checklist
- Descriptions should be unique per page and avoid keyword stuffing.
- Use `noIndex: true` for pages that shouldn't appear in search results.
- Keep titles under 60 characters (before site name suffix).
- Ensure canonical URLs match the deployed route structure.
- Update `SEO_DEFAULTS` in `src/lib/seo.ts` when site-wide values change.

## Config, constants, providers
- `src/config/` for external integrations (wagmi, API clients, env wiring).
- `src/constants/` for static values used across features.
- `src/providers/` for React context providers; wire them in the root.

## Types
- Keep types close to usage when possible.
- Use `src/types/` for shared or ambient types.
- Prefer `type` for unions and `interface` for object shapes when extension is needed.

## Styling
- Tailwind is the default; keep global CSS in `src/styles.css` only when necessary.
- `src/components/ui/` is for shadcn primitives only; do not add business logic there.

## Comments
- Avoid comments in UI/JSX unless they clarify a non-obvious behavior.
- Prefer self-explanatory code and meaningful names over inline commentary.

## Imports and dependency boundaries
- Use the `@/` alias for `src/*` to avoid deep relative paths.
- Avoid circular dependencies; keep directionality:
  - `routes` -> `components` -> `hooks` -> `lib`/`stores`/`config`
  - `lib` and `stores` should not import from `components`
- Limit barrel exports to a single `index.ts` per feature folder to prevent cycles.

## Tests and quality
- Prefer co-located tests (`*.test.ts` or `*.test.tsx`) next to the file under test.
- Run `pnpm check` before merging changes.

## Git commits
- Use Conventional Commits: `type(scope): subject` or `type: subject`.
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `revert`.
- Subject is imperative, <= 72 chars, no trailing period.
- Keep commits focused; avoid mixed, unrelated changes.
- Use body bullets only when context or rationale is needed.
- Avoid `wip` and vague subjects (e.g., "update", "changes").

Examples:
- `fix: prevent duplicate order submission`
- `refactor(trade): split order entry panel`
