---
name: figma
description: Convert Figma designs to code using project design tokens instead of raw hex colors
user_invocable: true
---

Convert Figma designs into production-ready React components using the project's design token system. Replaces all raw hex colors with semantic Tailwind token classes.

## Process

### 1. Load Design Tokens

Read `design-tokens.md` (project root) to build a hex-to-token lookup map. Each hex value maps to a token name and its context (light or dark theme):

```
#0D0F11 → surface-base (dark)
#F1F3F4 → surface-base (light)
#2B2E48 → text-primary (light)
#E6E9EF → text-primary (dark)
#626B75 → text-secondary (light)
#A9B0BC → text-secondary (dark)
#2563EB → action-primary (light)
#4F7DFF → action-primary (dark)
...
```

Also read `src/styles.css` for the full CSS variable definitions including any tokens not in the doc.

### 2. Extract Figma Data

For each Figma URL provided, extract `fileKey` and `nodeId` from the URL format:
- `https://figma.com/design/:fileKey/:fileName?node-id=:nodeId`
- Convert `node-id=1-2` to `nodeId=1:2`

Then call these MCP tools in parallel:
- `get_screenshot` — visual reference of the design
- `get_design_context` — generated code with raw hex values
- `get_variable_defs` — Figma variable names and their resolved hex values

### 3. Build Color Audit Table

For every hex color found in the design context output, produce a table:

| Hex | Token | Tailwind Class | Theme | Usage |
|-----|-------|---------------|-------|-------|
| `#0D0F11` | `surface-base` | `bg-surface-base` | dark | background |
| `#E6E9EF` | `text-primary` | `text-text-primary` | dark | heading text |
| `#FF00FF` | **UNKNOWN** | — | — | accent border |

Cross-reference Figma variable names from `get_variable_defs` with token names to improve matching accuracy.

### 4. Generate Component Code

Convert the Figma output into a React component following project conventions:

**Token replacement rules:**
- Fill/background hex → `bg-{token}` (e.g., `bg-surface-base`, `bg-action-primary`)
- Text color hex → `text-{token}` (e.g., `text-text-primary`, `text-market-up-primary`)
- Border color hex → `border-{token}` (e.g., `border-border`, `border-action-primary`)
- Ring/focus hex → `ring-{token}`
- For text tokens, the Tailwind class is `text-text-{name}` (double "text" is correct)

**Font size replacement rules (no arbitrary sizes):**
- 8px → `text-5xs`
- 9px → `text-4xs`
- 10px → `text-3xs`
- 11px → `text-2xs`
- 12px → `text-xs`
- 13px → `text-nav`
- 14px → `text-sm`
- 16px → `text-base`

**Code style (from `.claude/rules/code-style.md`):**
- Use `cn()` from `@/lib/cn` for conditional classes
- Use `interface Props` for prop types
- Prefer function declarations over arrows
- Icons from `@phosphor-icons/react` with `Icon` suffix
- No comments, no console.log
- React 19 — no manual useMemo/useCallback for performance

**Token rules (from `.claude/rules/design-tokens.md`):**
- Never use hardcoded hex like `text-[#2b2e48]` or `bg-[#f1f3f4]`
- Never use arbitrary font sizes like `text-[10px]`
- Use `market-*` tokens for trading data (PnL, prices, percentages)
- Use `status-*` tokens for system feedback (errors, warnings, success)
- `bg-surface` doesn't exist — use `bg-surface-base`, `bg-surface-execution`, etc.

### 5. Report Mismatches

After generating code, list any hex values that could not be mapped to a known token:

```
UNKNOWN COLORS:
- #FF00FF — used as accent border; closest match: action-primary (#2563EB)
- #333333 — used as text color; closest match: text-primary (light: #2B2E48)
```

For each unknown, suggest the closest semantic token based on the color's purpose and value.

## Instructions

1. Read `design-tokens.md` to build the hex → token lookup map
2. For each Figma URL argument:
   a. Parse `fileKey` and `nodeId` from the URL
   b. Call `get_screenshot`, `get_design_context`, and `get_variable_defs` in parallel
   c. Review the screenshot to understand the design intent
   d. Build the color audit table from the design context hexes
   e. Generate the component code with all hex values replaced by token classes
3. Present the color audit table
4. Present the generated component code
5. List any unknown/unmapped colors with suggested closest tokens
6. If multiple URLs were provided, repeat steps 2-5 for each
