# UI/UX Guidelines (Hypeterminal)

**Purpose**
- Keep the interface consistent with the existing terminal-style trading UI.
- Use the project’s shadcn components and existing design tokens.
- Do not introduce new colors, fonts, or visual styles unless explicitly requested.

**Design Foundation**
- **Fonts:** UI uses `font-mono` globally (`JetBrains Mono` in `src/styles.css`). Keep it for all trading surfaces.
- **Type scale:** Prefer compact sizes: `text-4xs`, `text-3xs`, `text-2xs`, `text-xs`, `text-sm`.
- **Numbers:** Use `tabular-nums` for any numeric output.
- **Caps:** Use `uppercase tracking-wider` for labels and headers.

**Color Usage (No New Colors)**
- Use semantic tokens and terminal accents only:
  - `text-muted-fg` for secondary labels.
  - `text-positive` for positive/long.
  - `text-negative` for negative/short.
  - `text-info` for active/selected accents.
  - `text-warning` for mark price and highlights.
  - `text-highlight` only if already used in nearby UI.
- Backgrounds: `bg-bg`, `bg-surface/20|30|40`, `bg-bg/50`.
- Do not introduce new colors or gradients.

**Borders and Dividers**
- Default panel borders: `border border-border/40`.
- Section dividers: `border-b border-border/40`, `border-t border-border/40`.
- Lists/tables: `divide-y divide-border/40`.
- Interactive elements: `border-border/60` with hover `hover:border-fg/30` or `hover:border-info/40`.
- Keep border opacity consistent (avoid mixing new alphas).

**Spacing and Density**
- Dense UI: prefer `p-2`, `py-1.5`, `gap-1`, `gap-2`.
- Use `h-6`, `h-7`, `h-8` for compact inputs and buttons.
- Avoid large padding unless the existing section already uses it.

**Components (Use shadcn UI)**
- Use components from `src/components/ui` when possible:
  - `Button`, `Input`, `Tabs`, `DropdownMenu`, `Popover`, `Tooltip`,
    `Table`, `ScrollArea`, `Checkbox`, `Switch`, `Badge`, `Dialog`, `Sheet`.
- Only drop to raw HTML if the design requires a custom control not covered by shadcn.
- Keep component variants consistent with existing usage.

**Buttons**
- For trading actions, use `Button` variants or existing classes:
  - Long: `text-positive` / `bg-positive/20` / `border-positive`.
  - Short: `text-negative` / `bg-negative/20` / `border-negative`.
- Compact sizes: `size="xs"` or `size="2xs"` where available.
- Always include `aria-label` on icon-only buttons.

**Inputs**
- Use `Input` with compact sizing and add styling consistent with order entry:
  - `bg-bg/50 border-border/60 focus:border-info/60 tabular-nums`.
- Keep placeholder text muted (`placeholder:text-muted-fg` comes from `Input`).

**Tabs**
- Use `Tabs`, `TabsList`, `TabsTrigger` with `variant="underline"` for top-level toggles.
- Active state uses `text-info` + underline or background tint.

**Tables and Lists**
- Use `Table` components.
- Header labels: `text-4xs uppercase tracking-wider text-muted-fg/70`.
- Row hover: `hover:bg-accent/30` or `hover:bg-muted/50`.
- Keep rows compact: `py-1.5`.

**Status and Feedback**
- Empty/connecting/loading states use centered `text-3xs text-muted-fg`.
- Errors use `text-negative/80` and optional detail line in `text-4xs text-muted-fg`.

**Motion and Effects**
- Use existing transitions: `transition-colors` or `transition-all`.
- Allowed utility effects: `animate-pulse`, collapse animations.
- Avoid adding new animation styles.

**Iconography**
- Use `@phosphor-icons/react` icons.
- Standard sizes: `size-2.5` to `size-4`.
- Icons should not introduce new colors; follow text color of the label.

**Accessibility**
- Preserve focus-visible rings from components.
- Custom elements should include `tabIndex={0}` and `aria-label`.
- Keep contrast in dark mode by using existing token classes.

**Do / Don’t**
- Do reuse existing UI patterns and classnames from nearby components.
- Do keep density and label styling consistent.
- Do not introduce new color tokens or font families.
- Do not change global styling (scanlines/grid) unless explicitly asked.
