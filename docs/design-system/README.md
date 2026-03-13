# Hypeterminal Design System

This branch adopts `shadcn` as the only primitive component system and uses Practical UI only as the source for color values.

## Rules

- Keep generated files in `src/components/ui` stock. Do not add app-specific props, aliases, or variant names there.
- Use shadcn semantic tokens only: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, and `chart-*`.
- Use Practical UI only to supply the values for those semantic tokens.
- Build recurring product patterns outside `src/components/ui`.
- Do not add new raw hex values or new legacy token families in feature code.

## Accent Policy

- `primary` is the strong brand/action color and comes from Practical UI `Fill/Brand strong`.
- `accent` is a subtle interaction surface and comes from Practical UI `Fill/Hover`.
- Use `accent` for hover, row selection, soft highlights, and secondary active states.
- Do not use `accent` as the main CTA color.

## Current Branch Status

- Native shadcn baseline bootstrapped from `pnpm dlx shadcn@latest init --preset a1iQl8 --base base --template start`.
- Generated shadcn primitives installed and kept intact.
- Global theme rewritten to shadcn semantic variables in `src/styles.css`.
- Production build passes.
- Existing Vitest suite passes.
- Feature migration is still in progress; see `migration-matrix.md` for the remaining legacy prop and token debt.
