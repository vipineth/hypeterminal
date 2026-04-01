# Anvil Design System Migration — Full Specification

> Generated 2026-03-30 | Worktree: `anvil-migration` | Branch: `worktree-anvil-migration`

This document is the single source of truth for migrating HyperTerminal from its current UI system to the Anvil design system. Every file that needs changes is listed with exact before/after patterns. Agents should follow this spec verbatim.

---

## Table of Contents

1. [Phase 0: Foundation Setup](#phase-0-foundation-setup)
2. [Section A: Header](#section-a-header)
3. [Section B: Chart & Token Selector](#section-b-chart--token-selector)
4. [Section C: Orderbook](#section-c-orderbook)
5. [Section D: Tradebox (Order Entry)](#section-d-tradebox-order-entry)
6. [Section E: Positions Manager](#section-e-positions-manager)
7. [Section F: Shared Components & Modals](#section-f-shared-components--modals)
8. [Section G: Layout Shell](#section-g-layout-shell)
9. [Section H: Footer](#section-h-footer)
10. [Section I: Mobile](#section-i-mobile)
11. [Section J: Design System Showcase](#section-j-design-system-showcase)
12. [Section K: Kept UI Components (Restyle Only)](#section-k-kept-ui-components-restyle-only)
13. [Phase Final: Global Token Sweep](#phase-final-global-token-sweep)
14. [Phase Cleanup: Delete Old UI](#phase-cleanup-delete-old-ui)

---

## Phase 0: Foundation Setup

### 0.1 — Copy Anvil components into the project

**Source:** `/Users/ankit/Documents/make/practical-ui-design-system/src/components/ui/`
**Target:** `apps/terminal/src/anvil/`

Copy ALL these files:
- `alert.tsx`, `alert-global.tsx`, `autocomplete.tsx`, `avatar.tsx`
- `badge.tsx`, `badge-count.tsx`, `badge-dot.tsx`, `breadcrumbs.tsx`
- `button.tsx`, `button-icons.tsx`, `button-groups.tsx`
- `card.tsx`, `checkboxes.tsx`, `combobox.tsx`
- `divider.tsx`, `drawer.tsx`, `dropdown.tsx`
- `modal.tsx`, `number-input.tsx`, `pagination.tsx`, `progress-indicator.tsx`
- `radio-buttons.tsx`, `search-input.tsx`, `segmented-controls.tsx`, `select.tsx`
- `slider.tsx`, `slot.tsx`
- `table.tsx`, `tabs.tsx`, `tag.tsx`
- `text.tsx`, `text-input.tsx`, `text-link.tsx`, `textarea.tsx`, `textblock.tsx`
- `toggle.tsx`, `tooltip.tsx`
- `index.ts`, `config.ts`, `types.ts`, `utils.ts`
- `globals.css`

### 0.2 — Merge token CSS

Replace `apps/terminal/src/styles.css` with Anvil's `globals.css` as the base, then append these HyperTerminal-specific extensions:

```css
/* === HyperTerminal Trading Extensions === */

/* Market colors — USE ANVIL'S success/error tokens instead of custom market colors.
   Anvil already has green (success-*) and red (error-*) that work for market up/down.
   Only market-neutral needs a custom token. */
--market-neutral: #8A919A;

/* Scope accents */
--scope-perp: #2563EB;
--scope-spot: #0F766E;
--scope-builders: #B45309;

/* Selection highlight */
--sel: rgba(37, 99, 235, 0.15);
```

Dark mode overrides for trading tokens:
```css
.dark {
  --market-neutral: #6B7280;
  --scope-perp: #4F7DFF;
  --scope-spot: #2DD4BF;
  --scope-builders: #F59E0B;
  --sel: rgba(79, 125, 255, 0.15);
}
```

Wire into `@theme inline`:
```css
--color-market-neutral: var(--market-neutral);
--color-scope-perp: var(--scope-perp);
--color-scope-spot: var(--scope-spot);
--color-scope-builders: var(--scope-builders);
--color-sel: var(--sel);
```

**Keep these custom classes** from current styles.css (append to new styles.css):
- `.touch-target` / `.touch-target-lg`
- `.terminal-scanlines`
- `.testnet-bg`
- `.terminal-grid`
- `.depth-bar-ask` / `.depth-bar-bid`
- `.trade-row-buy` / `.trade-row-sell`
- `.active\:scale-98` / `.active\:scale-95`
- All `@keyframes` (pulse-slow, blink, collapse-down/up, countdown)

**Delete** all old color tokens (text-950, surface-*, border-*, primary-*, fill-*, etc.)

### 0.3 — Path alias

In `apps/terminal/tsconfig.json` (or vite config), add:
```json
"@/anvil": ["./src/anvil"],
"@/anvil/*": ["./src/anvil/*"]
```

### 0.4 — Verify dependencies

Ensure these are in `apps/terminal/package.json`:
- `@base-ui/react` >= 1.3.0
- `class-variance-authority` >= 0.7.1
- `clsx` >= 2.1.1
- `tailwind-merge` >= 3.4.0

### 0.5 — Font change

Current: IBM Plex Sans Variable
Anvil: Inter (via `--font-sans: "Inter"`)

Update font import in the HTML head or root layout. Remove IBM Plex Sans Variable. Add Inter from `@fontsource-variable/inter` or CDN.

---

## Universal Rules for All Sections

These rules apply to EVERY file migration:

### Import changes
```
OLD: import { X } from "@/components/ui/button"
NEW: import { X } from "@/anvil"
```

### Size standardization
ALL components use `size="sm"` by default. Remove explicit size props where `sm` is already the default.

### Button migration table
| Old | New |
|-----|-----|
| `variant="contained" tone="base"` | `variant="filled" intent="neutral"` |
| `variant="contained" tone="accent"` | `variant="filled" intent="brand"` |
| `variant="outlined" tone="base"` | `variant="outline" intent="neutral"` |
| `variant="outlined" tone="accent"` | `variant="outline" intent="brand"` |
| `variant="ghost" tone="base"` | `variant="ghost" intent="neutral"` |
| `variant="ghost" tone="accent"` | `variant="ghost" intent="brand"` |
| `variant="text" tone="base"` | `variant="link" intent="neutral"` |
| `variant="text" tone="accent"` | `variant="link" intent="brand"` |
| `variant="destructive"` | `variant="filled" intent="error"` |
| `size="icon"` | Use `<ButtonIcon>` instead |
| `size="none"` | Remove size, use className for custom padding |
| `size="md"` or `size="lg"` | `size="sm"` |
| `asChild` | Remove. Wrap with `<a>` or use `render` prop |
| Icon as child: `<Button><Icon />Text</Button>` | `<Button iconLeft={<Icon size={16} />}>Text</Button>` |

### Dialog → Modal migration table
| Old | New |
|-----|-----|
| `<Dialog>` | `<Modal>` |
| `<DialogTrigger>` | `<ModalTrigger>` |
| `<DialogContent>` | `<ModalPopup size="sm">` |
| `<DialogHeader>` | `<ModalHeader>` |
| `<DialogTitle>` | `<ModalTitle>` |
| `<DialogDescription>` | `<ModalDescription>` |
| Body content (direct) | Wrap in `<ModalContent>` |
| `<DialogFooter>` | `<ModalFooter>` |
| `<DialogClose>` | `<ModalClose>` |
| `showCloseButton={false}` | `showClose={false}` on ModalPopup |
| `<DialogOverlay>` | Remove (ModalPopup includes it) |
| `<DialogPortal>` | Remove (ModalPopup includes it) |

### Tabs migration
**Underline tabs** (navigation, positions panel):
| Old | New |
|-----|-----|
| `<Tabs>` | `<Tabs variant="underline">` |
| `<TabsList variant="underline">` | `<TabsList>` |
| `<TabsTrigger>` | `<TabsTrigger>` |
| `<TabsContent>` | `<TabsContent>` |
| `forceMount` | Not available — use `keepMounted` if Anvil supports it, else conditionally render |

**Pill tabs** (account panel, orderbook, side toggle, deposit modal):
| Old | New |
|-----|-----|
| `<Tabs>` | `<SegmentedControls>` |
| `<TabsList variant="pill">` | (removed — built into SegmentedControls) |
| `<TabsTrigger value="x">` | `<SegmentedControlItem value="x">` |
| `<TabsContent value="x">` | Manual: `{tab === "x" && <Content />}` |

### DropdownMenu → Dropdown migration
```tsx
// OLD (compound)
<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>Menu</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem onClick={handleCopy}><CopyIcon /> Copy</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onClick={handleDisconnect}>Disconnect</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// NEW (declarative)
<Dropdown
  trigger={<Button variant="outline" intent="neutral">Menu</Button>}
  groups={[
    { label: "Actions", items: [
      { label: "Copy", icon: <CopyIcon size={16} />, onSelect: handleCopy },
    ]},
    { items: [
      { label: "Disconnect", danger: true, onSelect: handleDisconnect },
    ]},
  ]}
/>
```

### Select migration
```tsx
// OLD (compound)
<Select value={v} onValueChange={setV}>
  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="a">A</SelectItem>
    <SelectItem value="b">B</SelectItem>
  </SelectContent>
</Select>

// NEW (declarative)
<Select
  value={v}
  onValueChange={setV}
  placeholder="Choose..."
  options={[
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ]}
/>
```

### Input → TextInput migration
| Old | New |
|-----|-----|
| `<Input inputSize="sm" />` | `<TextInput size="sm" />` |
| `<Input inputSize="default" />` | `<TextInput size="sm" />` |
| Manual `<Label>` + `<Input>` | `<TextInput label="..." />` |
| Manual error display | `<TextInput error="..." />` |
| Icon next to input | `<TextInput iconLeft={...} iconRight={...} />` |

### NumberInput migration
| Old | New |
|-----|-----|
| `<NumberInput inputSize="sm" allowDecimals min={0} max={100} step={0.01}>` | `<NumberInput size="sm" min={0} max={100} step={0.01}>` |
| `allowDecimals={false}` | `step={1}` |
| `maxAllowedDecimals={2}` | `step={0.01}` |
| `maxLabel` + `onMaxClick` | Extend Anvil NumberInput or use wrapper with absolute-positioned button |

### Badge migration
| Old | New |
|-----|-----|
| `variant="default"` | `tone="brand"` |
| `variant="secondary"` | `tone="neutral"` |
| `variant="destructive"` | `tone="error"` |
| `variant="outline"` | `tone="neutral"` |
| `variant="neutral"` | `tone="neutral"` |
| `variant="long"` | `tone="success"` |
| `variant="short"` | `tone="error"` |
| `size="xs"` or `size="sm"` | `size="sm"` |

### Switch → Toggle migration
| Old | New |
|-----|-----|
| `<Switch checked={x} onCheckedChange={setX} />` | `<Toggle checked={x} onCheckedChange={setX} size="sm" />` |
| Manual label | `<Toggle label="..." />` |

### Checkbox migration
| Old | New |
|-----|-----|
| `<Checkbox checked={x} onCheckedChange={setX} />` | `<Checkbox checked={x} onCheckedChange={setX} size="sm" />` |
| Manual label next to checkbox | `<Checkbox label="..." />` |

### Tooltip migration
```tsx
// OLD (4 components)
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>Tip text</TooltipContent>
  </Tooltip>
</TooltipProvider>

// NEW (1 component)
<Tooltip content="Tip text">
  <button>Hover me</button>
</Tooltip>
```

### Sheet → Drawer migration
| Old | New |
|-----|-----|
| `<Sheet>` | `<Drawer side="right">` |
| `<SheetTrigger>` | `<DrawerTrigger>` |
| `<SheetContent side="right">` | `<DrawerContent>` |
| `<SheetHeader>` | `<DrawerHeader>` |
| `<SheetTitle>` | `<DrawerTitle>` |
| `<SheetFooter>` | `<DrawerFooter>` |

### Separator → Divider
| Old | New |
|-----|-----|
| `<Separator />` | `<Divider />` |
| `orientation="horizontal"` | `orientation="horizontal"` (same) |

### InfoRow rebuild
Replace `<InfoRow>` / `<InfoRowGroup>` from `@/components/ui/info-row` with inline Anvil-token styled elements:
```tsx
// NEW InfoRow (rebuild with Anvil tokens)
function InfoRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <span className="text-text-weak">{label}</span>
      <span className="text-text-strong tabular-nums">{value}</span>
    </div>
  );
}

function InfoRowGroup({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-stroke-weak text-xs tracking-[0.5px]">
      {children}
    </div>
  );
}
```

### Global token replacements (apply in ALL files)

**Text colors:**
| Find | Replace |
|------|---------|
| `text-text-950` | `text-text-strong` |
| `text-text-600` | `text-text-weak` |
| `text-text-500` | `text-text-weak` |
| `text-text-400` | `text-text-disabled` |
| `text-text-10` | `text-text-inverse-strong` |
| `text-primary-default` | `text-text-brand` |
| `text-error-700` | `text-text-error` |
| `text-success-700` | `text-text-success` |
| `text-warning-700` | `text-text-warning` |

**Backgrounds:**
| Find | Replace |
|------|---------|
| `bg-surface-base` | `bg-bg-sunken` |
| `bg-surface-analysis` | `bg-bg-raised` |
| `bg-surface-execution` | `bg-bg-overlay` |
| `bg-surface-monitoring-row-a` | `bg-bg-alternate` |
| `bg-surface-monitoring-row-b` | `bg-bg-base` |
| `bg-primary-default` | `bg-fill-brand-strong` |
| `bg-primary-hover` | `bg-fill-brand-strong hover:opacity-90` |
| `bg-primary-active` | `bg-fill-brand-strong active:opacity-80` |
| `bg-primary-muted` | `bg-fill-brand-weak` |
| `bg-fill-900` | `bg-fill-strong` |
| `bg-fill-300` | `bg-fill-weak` |
| `bg-fill-100` | `bg-fill-weak` |
| `bg-fill-50` | `bg-fill-weaker` |
| `bg-text-950` | `bg-fill-strong` |
| `bg-text-950/5` | `bg-fill-hover` |
| `bg-text-950/10` | `bg-fill-press` |
| `bg-error-700` | `bg-fill-error-strong` |
| `bg-error-100` | `bg-fill-error-weak` |
| `bg-success-700` | `bg-fill-success-strong` |
| `bg-success-100` | `bg-fill-success-weak` |
| `bg-warning-700` | `bg-fill-warning-strong` |
| `bg-warning-100` | `bg-fill-warning-weak` |

**Borders:**
| Find | Replace |
|------|---------|
| `border-border-200` | `border-stroke-weak` |
| `border-border-100` | `border-stroke-weak` |
| `border-border-300` | `border-stroke-strong` |
| `border-border-500` | `border-stroke-strong` |
| `border-border-50` | `border-stroke-weak` |
| `border-border` | `border-stroke-weak` |
| `border-primary-default` | `border-stroke-brand-strong` |
| `border-error-700` | `border-stroke-error-strong` |

**Shadows:**
| Find | Replace |
|------|---------|
| `shadow-xs` | `shadow-raised` |
| `shadow-sm` | `shadow-raised` |
| `shadow-md` | `shadow-raised` |
| `shadow-lg` | `shadow-overlay` |
| `shadow-xl` | `shadow-overlay` |
| `shadow-2xl` | `shadow-overlay` |

**Border radius:**
| Find | Replace |
|------|---------|
| `rounded-xs` | `rounded-8` |
| `rounded-sm` | `rounded-8` |
| `rounded-md` | `rounded-12` |
| `rounded-lg` | `rounded-12` |
| `rounded-xl` | `rounded-16` |

**Focus states:**
| Find | Replace |
|------|---------|
| `focus-visible:ring-2 focus-visible:ring-primary-default/50` | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus` |
| `focus-visible:ring-2 focus-visible:ring-ring/50` | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus` |
| `ring-primary-default` | `outline-stroke-focus` |

**Typography (Anvil has larger base sizes):**
| Find | Replace |
|------|---------|
| `text-5xs` | `text-xs` |
| `text-4xs` | `text-xs` |
| `text-3xs` | `text-xs` |
| `text-2xs` | `text-xs` |
| `text-nav` | `text-xs` |

Note: Anvil `text-xs` = 14px, `text-sm` = 16px. Current system `text-xs` = 12px. This is intentional — Anvil's typography is larger.

**Icon colors:**
| Find | Replace |
|------|---------|
| Icon with `text-text-600` | `text-icon-neutral` |
| Icon with `text-text-400` | `text-icon-disabled` |
| Icon with `text-primary-default` | `text-icon-brand` |

---

## Section A: Header

### A1. `apps/terminal/src/components/trade/header/top-nav.tsx`

**UI imports to replace:**
- `Button` from `@/components/ui/button` → `Button` from `@/anvil`

**Changes:**
1. Update Button import to `@/anvil`
2. Map button variants per universal table
3. Replace all design tokens:
   - `text-text-950` → `text-text-strong`
   - `text-text-600` → `text-text-weak`
   - `text-text-500` → `text-text-weak`
   - `text-primary-default` → `text-text-brand`
   - `bg-surface-execution` → `bg-bg-overlay`
   - `border-border-200` → `border-stroke-weak`
   - `border-border-100` → `border-stroke-weak`
   - `border-border-300` → `border-stroke-strong`
   - `border-border-500` → `border-stroke-strong`
4. Replace `rounded-xs` → `rounded-8`
5. Replace shadow tokens
6. Keep scope accent classes (`scope-perp`, `scope-spot`, `scope-builders`) unchanged — they're trading extensions

### A2. `apps/terminal/src/components/trade/header/favorites-strip.tsx`

**UI imports to replace:**
- `Button` from `@/components/ui/button` → `Button` from `@/anvil`

**Changes:**
1. Update import
2. Map `variant="text"` → `variant="link"`
3. Replace tokens: `text-text-950` → `text-text-strong`, `text-text-600` → `text-text-weak`, `bg-surface-execution` → `bg-bg-overlay`, `border-border-100` → `border-stroke-weak`, `border-border-300` → `border-stroke-strong`
4. Replace border radius tokens

### A3. `apps/terminal/src/components/trade/header/theme-toggle.tsx`

**UI imports to replace:**
- `Button` from `@/components/ui/button` → `ButtonIcon` from `@/anvil`

**Changes:**
1. This is an icon-only button → use `ButtonIcon`
2. `variant="ghost"` stays `variant="ghost"`, add `intent="neutral"`
3. Replace `text-warning-700` → `text-text-warning`
4. Replace `text-primary-default` → `text-text-brand`

### A4. `apps/terminal/src/components/trade/header/user-menu.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger` → `Dropdown` from `@/anvil`

**Changes:**
1. Replace compound DropdownMenu with declarative `<Dropdown>` (see universal pattern)
2. `asChild` on trigger → use `trigger` prop instead
3. `variant="destructive"` on menu item → `danger: true` in items array
4. Replace `text-3xs` → `text-xs`
5. Replace all token classes

---

## Section B: Chart & Token Selector

### B1. `apps/terminal/src/components/trade/chart/chart-panel.tsx`

**UI imports to replace:**
- `Skeleton` from `@/components/ui/skeleton` → Keep (no Anvil equivalent)

**Changes:**
1. Keep Skeleton import unchanged (it's in the "keep" list)
2. Replace tokens: `bg-surface-analysis` → `bg-bg-raised`, `border-border-200` → `border-stroke-weak`

### B2. `apps/terminal/src/components/trade/chart/kline-chart.tsx`

**UI imports to replace:**
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` → `Dropdown` from `@/anvil`

**Changes:**
1. Convert compound DropdownMenu to declarative `<Dropdown>`
2. `asChild` on trigger → `trigger` prop
3. Replace tokens: `text-text-950` → `text-text-strong`, `text-text-500` → `text-text-weak`, `border-border-200` → `border-stroke-weak`, `bg-surface-analysis` → `bg-bg-raised`

### B3. `apps/terminal/src/components/trade/chart/token-selector.tsx`

**UI imports to replace:**
- `Badge` → `Badge` from `@/anvil`
- `Button` → `Button` from `@/anvil`
- `Drawer, DrawerContent, DrawerTrigger` → `Drawer, DrawerContent, DrawerTrigger` from `@/anvil`
- `Input` → `SearchInput` from `@/anvil` (this is a search box)
- `Popover, PopoverContent, PopoverTrigger` → Keep (no Anvil Popover — use `@base-ui/react` Popover styled with Anvil tokens)

**Changes:**
1. Import changes per above
2. Badge: `variant="long"` → `tone="success"`, `variant="short"` → `tone="error"`, `size="xs"` → `size="sm"`
3. Button variant mappings per universal table
4. Input used for search → use Anvil `SearchInput` with `onClear` prop
5. Popover: Anvil doesn't have Popover. Import from `@base-ui/react` and style with Anvil tokens (`bg-bg-overlay`, `border-stroke-weak`, `shadow-overlay`, `rounded-12`)
6. Drawer subcomponents map 1:1 to Anvil Drawer
7. Replace all token classes throughout
8. `forceMount` on Popover — check if Base UI Popover supports `keepMounted`

### B4. `apps/terminal/src/components/trade/chart/stat-block.tsx`

**UI imports to replace:** None

**Changes:**
1. Token-only sweep: `text-text-600` → `text-text-weak`, `text-text-950` → `text-text-strong`
2. Typography size updates

---

## Section C: Orderbook

### C1. `apps/terminal/src/components/trade/orderbook/orderbook-panel.tsx`

**UI imports to replace:**
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger` → `Dropdown` from `@/anvil`
- `Tabs, TabsContent, TabsList, TabsTrigger` → `SegmentedControls, SegmentedControlItem` from `@/anvil` (pill variant)

**Changes:**
1. Convert DropdownMenu → declarative `Dropdown`
2. Pill tabs → `SegmentedControls` + manual content switching
3. Replace tokens: `bg-surface-analysis` → `bg-bg-raised`, `border-border-200` → `border-stroke-weak`
4. Keep `depth-bar-ask`, `depth-bar-bid` custom classes — update their internal color vars to use `--market-up` / `--market-down`

### C2. `apps/terminal/src/components/trade/orderbook/orderbook-row.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`

**Changes:**
1. Update import, map variants
2. Replace tokens: `text-text-950` → `text-text-strong`, `hover:bg-surface-analysis` → `hover:bg-fill-hover`
3. Keep `text-market-up-600` → `text-text-success`, `text-market-down-600` → `text-text-error`
4. Keep memo() wrapper unchanged

### C3. `apps/terminal/src/components/trade/orderbook/trades-panel.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`

**Changes:**
1. Update import, map variants
2. Replace tokens: `text-text-950` → `text-text-strong`, `text-text-600` → `text-text-weak`, `border-border-200` → `border-stroke-weak`
3. Market colors: `text-market-up-600` → `text-text-success`, `text-market-down-600` → `text-text-error`
4. Keep `trade-row-buy`, `trade-row-sell` CSS classes

---

## Section D: Tradebox (Order Entry)

### D1. `apps/terminal/src/components/trade/tradebox/trade-panel.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`

**Changes:**
1. Update import
2. Main submit button: `variant="contained" tone="accent" size="lg"` → `variant="filled" intent="brand" size="sm"`
3. Replace tokens: `bg-surface-execution` → `bg-bg-overlay`, `border-border-200` → `border-stroke-weak`, `text-primary-default` → `text-text-brand`
4. Replace loading spinner text color tokens

### D2. `apps/terminal/src/components/trade/tradebox/trade-header.tsx`

**UI imports to replace:**
- `Tabs, TabsList, TabsTrigger` → `Tabs, TabsList, TabsTrigger` from `@/anvil` (underline variant)

**Changes:**
1. Update imports to `@/anvil`
2. `<TabsList variant="underline">` → `<TabsList>` (underline is default in Anvil Tabs)
3. Remove custom bottom border span animation (Anvil handles indicator internally)
4. Replace tokens: `text-text-950` → `text-text-strong`, `text-text-600` → `text-text-weak`

### D3. `apps/terminal/src/components/trade/tradebox/trade-form-fields.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Checkbox` → `Checkbox` from `@/anvil`
- `NumberInput` → `NumberInput` from `@/anvil`
- `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` → `Select` from `@/anvil`
- `Slider` → `Slider` from `@/anvil`

**Changes:**
1. All imports from `@/anvil`
2. Button: `variant="text"` → `variant="link"`
3. Checkbox: add `label` prop, remove manual label element
4. NumberInput: map `allowDecimals`/`maxAllowedDecimals` to `step` prop. Handle `maxLabel`/`onMaxClick` with wrapper or extend
5. Select: convert compound → declarative `options` array
6. Slider: use `label` and `showValue` props if displaying value. Map `marks` if present.
7. Replace ALL token classes per global table
8. Market colors: keep `text-market-up-600` → `text-text-success`, `text-market-down-600` → `text-text-error`

### D4. `apps/terminal/src/components/trade/tradebox/side-toggle.tsx`

**UI imports to replace:**
- `Tabs, TabsList, TabsTrigger` → `SegmentedControls, SegmentedControlItem` from `@/anvil`

**Changes:**
1. Pill tabs → SegmentedControls
2. BUY/SELL are pill items → `<SegmentedControlItem>`
3. Market colors on active state: need custom className for `data-[checked]:text-market-up` (buy) and `data-[checked]:text-market-down` (sell)
4. Remove Framer Motion animation (Anvil handles indicator animation internally)

### D5. `apps/terminal/src/components/trade/tradebox/account-panel.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `InfoRow, InfoRowGroup` → Rebuilt inline (see universal pattern)
- `Tabs, TabsContent, TabsContentGroup, TabsList, TabsTrigger` → Split: pill tabs → `SegmentedControls`; if underline tabs present → `Tabs` from `@/anvil`

**Changes:**
1. Determine which tabs are pill vs underline
2. Replace InfoRow/InfoRowGroup with Anvil-token styled inline component
3. Button variant mappings
4. Replace `forceMount` on TabsContent → check Anvil `keepMounted`
5. Replace all token classes

### D6. `apps/terminal/src/components/trade/tradebox/deposit-modal.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Dialog, DialogContent, DialogHeader, DialogTitle` → `Modal, ModalPopup, ModalHeader, ModalTitle, ModalContent` from `@/anvil`
- `InfoRow` → Rebuilt inline
- `NumberInput` → `NumberInput` from `@/anvil`
- `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` → `Select` from `@/anvil`
- `Tabs, TabsContent, TabsList, TabsTrigger` → `SegmentedControls` (pill) from `@/anvil`

**Changes:**
1. Dialog → Modal conversion per universal pattern
2. Pill tabs → SegmentedControls + manual content switching
3. Select → declarative
4. NumberInput → Anvil NumberInput
5. InfoRow → rebuilt
6. `showCloseButton` → `showClose` on ModalPopup
7. Replace ALL tokens

### D7. `apps/terminal/src/components/trade/tradebox/leverage-control.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `NumberInput` → `NumberInput` from `@/anvil`
- `Popover, PopoverContent, PopoverTrigger` → Base UI Popover styled with Anvil tokens
- `Sheet, SheetContent` → `Drawer, DrawerContent` from `@/anvil`

**Changes:**
1. Sheet → Drawer conversion per universal table
2. Popover → Base UI `@base-ui/react` Popover with Anvil styling
3. NumberInput → Anvil NumberInput
4. Replace tokens: `text-text-600` → `text-text-weak`, `text-text-950` → `text-text-strong`, `text-market-down-100` → `text-fill-error-weak`, `border-market-down-600` → `border-stroke-error-strong`

### D8. `apps/terminal/src/components/trade/tradebox/leverage-slider.tsx`

**UI imports to replace:**
- `Slider` → `Slider` from `@/anvil`

**Changes:**
1. Update import
2. Use Anvil Slider API (label, showValue props if needed)
3. Map marks/steps

### D9. `apps/terminal/src/components/trade/tradebox/margin-mode-dialog.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle` → Modal equivalents from `@/anvil`

**Changes:**
1. Full Dialog → Modal conversion
2. Button variant mappings
3. Replace `border-primary-default` → `border-stroke-brand-strong`
4. Replace `bg-primary-default` → `bg-fill-brand-strong`
5. Replace tokens throughout
6. Warning styling: `text-warning-700` → `text-text-warning`

### D10. `apps/terminal/src/components/trade/tradebox/order-summary.tsx`

**UI imports to replace:**
- `InfoRow, InfoRowGroup` → Rebuilt inline

**Changes:**
1. Replace InfoRow/InfoRowGroup with inline Anvil-token styled version
2. Replace tokens: `text-market-down-600` → `text-text-error`, `text-text-600` → `text-text-weak`

### D11. `apps/terminal/src/components/trade/tradebox/order-toast.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`

**Changes:**
1. Update import
2. `variant="text"` → `variant="link"`
3. Replace tokens: `bg-surface-execution` → `bg-bg-overlay`, `bg-surface-analysis` → `bg-bg-raised`, `border-border-200` → `border-stroke-weak`, `text-primary-default` → `text-text-brand`
4. Market colors: `text-market-up-600` → `text-text-success`, `text-market-down-600` → `text-text-error`
5. Keep `animate-countdown` (custom animation)
6. Keep `terminal-scanlines` class

### D12. `apps/terminal/src/components/trade/tradebox/price-input-with-percent.tsx`

**UI imports to replace:**
- `Input` → `TextInput` from `@/anvil`

**Changes:**
1. `<Input inputSize="sm">` → `<TextInput size="sm">`
2. Replace tokens: `border-border-200` → `border-stroke-weak`, `border-market-down-600` → `border-stroke-error-strong`, `bg-surface-base` → `bg-bg-sunken`
3. Market colors on PnL display

### D13. `apps/terminal/src/components/trade/tradebox/tp-sl-section.tsx`

**UI imports to replace:**
- `Input` → `TextInput` from `@/anvil`

**Changes:**
1. `<Input>` → `<TextInput>`
2. Replace tokens: `border-border-200` → `border-stroke-weak`, `bg-surface-analysis` → `bg-bg-raised`
3. Market colors: `text-market-down-600` → `text-text-error`, `text-market-up-600` → `text-text-success`
4. Warning: `text-warning-700` → `text-text-warning`

### D14. `apps/terminal/src/components/trade/tradebox/bridge-tab.tsx`

**UI imports to replace:**
- `Badge` → `Badge` from `@/anvil`
- `Button` → `Button` from `@/anvil`
- `Collapsible, CollapsibleContent, CollapsibleTrigger` → Base UI `@base-ui/react/collapsible` styled with Anvil tokens
- `InfoRow, InfoRowGroup` → Rebuilt inline
- `Separator` → `Divider` from `@/anvil`

**Changes:**
1. Badge: variant mappings per universal table
2. Button: variant mappings
3. Collapsible: rewrite to Base UI Collapsible (`Collapsible.Root`, `Collapsible.Trigger`, `Collapsible.Panel`) styled with Anvil tokens
4. InfoRow → rebuilt
5. `<Separator />` → `<Divider />`
6. Replace ALL tokens

### D15. `apps/terminal/src/components/trade/tradebox/advanced-order-dropdown.tsx`

**UI imports to replace:**
- `DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger` → `Dropdown` from `@/anvil`

**Changes:**
1. Full compound → declarative conversion
2. Labels and separators → `groups` with `label` field
3. Replace tokens

---

## Section E: Positions Manager

### E1. `apps/terminal/src/components/trade/positions/positions-panel.tsx`

**UI imports to replace:**
- `Tabs, TabsContent, TabsList, TabsTrigger` → `Tabs` from `@/anvil` (underline variant)

**Changes:**
1. Underline tabs stay as `Tabs`
2. Replace tokens

### E2. `apps/terminal/src/components/trade/positions/positions-tab.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Card` → `Card` from `@/anvil`
- `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` → same names from `@/anvil`
- `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` → `Tooltip` from `@/anvil`

**Changes:**
1. Card: add `variant="outlined"`
2. Table: import path change, mostly drop-in
3. Tooltip: collapse to single `<Tooltip content="...">` wrapper
4. Replace ALL tokens
5. Market colors for PnL

### E3. `apps/terminal/src/components/trade/positions/orders-tab.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Card` → `Card` from `@/anvil`
- `Checkbox` → `Checkbox` from `@/anvil`
- `Table, TableBody, TableCell, TableHead, TableHeader, TableRow` → from `@/anvil`

**Changes:**
1. All imports from `@/anvil`
2. Checkbox: use `size="sm"`
3. Card: `variant="outlined"`
4. Replace tokens

### E4. `apps/terminal/src/components/trade/positions/orders-history-tab.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Card` → `Card` from `@/anvil`
- `Table` components → from `@/anvil`

**Changes:**
1. Import updates
2. Token sweep

### E5. `apps/terminal/src/components/trade/positions/history-tab.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Card` → `Card` from `@/anvil`
- `Table` components → from `@/anvil`

**Changes:**
1. Import updates
2. Token sweep

### E6. `apps/terminal/src/components/trade/positions/balances-tab.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Card` → `Card` from `@/anvil`
- `Checkbox` → `Checkbox` from `@/anvil`
- `Table` components → from `@/anvil`

**Changes:**
1. All imports from `@/anvil`
2. Checkbox with label
3. Token sweep

### E7. `apps/terminal/src/components/trade/positions/funding-tab.tsx`

**UI imports to replace:**
- `Card` → `Card` from `@/anvil`
- `Table` components → from `@/anvil`

**Changes:**
1. Import updates
2. Token sweep

### E8. `apps/terminal/src/components/trade/positions/twap-tab.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Card` → `Card` from `@/anvil`
- `Table` components → from `@/anvil`

**Changes:**
1. Import updates
2. Keep `TimeTicker` import unchanged
3. Token sweep

### E9. `apps/terminal/src/components/trade/positions/position-actions-dropdown.tsx`

**UI imports to replace:**
- `DropdownMenu` components → `Dropdown` from `@/anvil`

**Changes:**
1. Full compound → declarative Dropdown conversion
2. `variant="destructive"` items → `danger: true`
3. Token sweep

### E10. `apps/terminal/src/components/trade/positions/position-limit-close-modal.tsx`

**UI imports to replace:**
- `Badge` → `Badge` from `@/anvil`
- `Button` → `Button` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `InfoRow` → Rebuilt inline
- `NumberInput` → `NumberInput` from `@/anvil`

**Changes:**
1. Dialog → Modal conversion
2. Badge variant mapping
3. NumberInput: `maxLabel`/`onMaxClick` handling
4. InfoRow → rebuilt
5. Token sweep

### E11. `apps/terminal/src/components/trade/positions/position-tpsl-modal.tsx`

**UI imports to replace:**
- `Badge` → `Badge` from `@/anvil`
- `Button` → `Button` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `InfoRow, InfoRowGroup` → Rebuilt inline

**Changes:**
1. Dialog → Modal conversion
2. Badge variant mapping
3. InfoRow → rebuilt
4. Token sweep

### E12. `apps/terminal/src/components/trade/positions/send-dialog.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `Input` → `TextInput` from `@/anvil`
- `NumberInput` → `NumberInput` from `@/anvil`
- `Select` components → `Select` from `@/anvil`

**Changes:**
1. Dialog → Modal
2. Input → TextInput
3. NumberInput → Anvil NumberInput
4. Select → declarative
5. Token sweep

### E13. `apps/terminal/src/components/trade/positions/transfer-dialog.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `NumberInput` → `NumberInput` from `@/anvil`

**Changes:**
1. Dialog → Modal
2. NumberInput → Anvil NumberInput
3. Token sweep

---

## Section F: Shared Components & Modals

### F1. `apps/terminal/src/components/trade/components/global-settings-dialog.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Checkbox` → `Checkbox` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `NumberInput` → `NumberInput` from `@/anvil`
- `Select` components → `Select` from `@/anvil`
- `Slider` → `Slider` from `@/anvil`
- `Switch` → `Toggle` from `@/anvil`

**Changes:**
1. Full Dialog → Modal
2. Switch → Toggle with `label` prop
3. Checkbox with `label` prop
4. Select → declarative
5. Slider → Anvil Slider
6. Token sweep

### F2. `apps/terminal/src/components/trade/components/global-modals.tsx`

**UI imports to replace:** Likely none (just orchestrates other modals)

**Changes:**
1. Token sweep only (if any direct styling)

### F3. `apps/terminal/src/components/trade/components/wallet-dialog.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `Input` → `TextInput` from `@/anvil`

**Changes:**
1. Dialog → Modal
2. Input → TextInput
3. Button variant mapping
4. Token sweep

### F4. `apps/terminal/src/components/trade/components/spot-swap-modal.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `Dialog` components → `Modal` components from `@/anvil`
- `NumberInput` → `NumberInput` from `@/anvil`

**Changes:**
1. Dialog → Modal
2. NumberInput → Anvil NumberInput
3. Token sweep

### F5. `apps/terminal/src/components/trade/components/token-selector-dropdown.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`
- `DropdownMenu` components → `Dropdown` from `@/anvil`

**Changes:**
1. Compound → declarative Dropdown
2. Button variant mapping
3. Token sweep

### F6. `apps/terminal/src/components/trade/components/trading-action-button.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`

**Changes:**
1. Import update
2. This is the main BUY/SELL button wrapper → Map to `variant="filled" intent="brand"` or custom intent
3. Market colors for buy (green) / sell (red) states — may need custom className overrides
4. Token sweep

### F7. `apps/terminal/src/components/trade/components/command-menu.tsx`

**UI imports to replace:**
- `Dialog` components → Check if used internally (cmdk uses its own dialog). May need to keep `@/components/ui/command.tsx` as-is, just update tokens.

**Changes:**
1. Likely token-sweep only since cmdk has its own dialog mechanism
2. Update `@/components/ui/command.tsx` internal styling to use Anvil tokens

### F8. `apps/terminal/src/components/trade/components/asset-display.tsx`

**UI imports to replace:**
- `Avatar` → `Avatar` from `@/anvil`

**Changes:**
1. `<Avatar>` → `<Avatar size="sm" src="..." alt="..." />`
2. Token sweep

### F9. `apps/terminal/src/components/trade/testnet-banner.tsx`

**UI imports to replace:**
- `Button` → `Button` from `@/anvil`

**Changes:**
1. Update import
2. Token sweep
3. Keep `.testnet-bg` custom class

---

## Section G: Layout Shell

### G1. `apps/terminal/src/components/trade/layout/main-workspace.tsx`

**UI imports to replace:** None expected (uses react-resizable-panels)

**Changes:**
1. Token sweep only: `bg-surface-base` → `bg-bg-sunken`
2. Keep resizable panel imports unchanged

### G2. `apps/terminal/src/components/trade/layout/analysis-section.tsx`

**UI imports to replace:** None expected

**Changes:**
1. Token sweep

### G3. `apps/terminal/src/components/trade/layout/market-info.tsx`

**UI imports to replace:** None expected

**Changes:**
1. Token sweep

### G4. `apps/terminal/src/components/trade/layout/trade-sidebar.tsx`

**UI imports to replace:** None expected

**Changes:**
1. Token sweep

### G5. `apps/terminal/src/components/trade/trade-terminal-page.tsx`

**UI imports to replace:** None expected

**Changes:**
1. Token sweep

### G6. `apps/terminal/src/components/trade/market-overview.tsx`

**UI imports to replace:** Likely Button or none

**Changes:**
1. Token sweep
2. Market colors update

---

## Section H: Footer

### H1. `apps/terminal/src/components/trade/footer/footer-bar.tsx`

**UI imports to replace:** Possibly Button

**Changes:**
1. Import updates if needed
2. Token sweep: `bg-surface-execution` → `bg-bg-overlay`, `border-border-200` → `border-stroke-weak`, `text-text-600` → `text-text-weak`

---

## Section I: Mobile

### I1. `apps/terminal/src/components/trade/mobile/mobile-terminal.tsx`

**Changes:** Token sweep only

### I2. `apps/terminal/src/components/trade/mobile/mobile-header.tsx`

**UI imports:** `Button`
**Changes:** Button → Anvil Button, token sweep

### I3. `apps/terminal/src/components/trade/mobile/mobile-bottom-nav.tsx`

**UI imports:** `Button`
**Changes:** Button → Anvil ButtonIcon (icon-only nav items), token sweep

### I4. `apps/terminal/src/components/trade/mobile/mobile-chart-view.tsx`

**Changes:** Token sweep, possibly chart container styling

### I5. `apps/terminal/src/components/trade/mobile/mobile-book-view.tsx`

**UI imports:** `Button`, `DropdownMenu` components
**Changes:**
1. DropdownMenu → Dropdown
2. Button → Anvil Button
3. Token sweep

### I6. `apps/terminal/src/components/trade/mobile/mobile-trade-view.tsx`

**UI imports:** `Button`, `Input`, `Slider`, `Tabs` components
**Changes:**
1. Input → TextInput
2. Slider → Anvil Slider
3. Tabs → check variant (underline → Tabs, pill → SegmentedControls)
4. Token sweep

### I7. `apps/terminal/src/components/trade/mobile/mobile-positions-view.tsx`

**UI imports:** `Tabs` components
**Changes:** Underline Tabs → Anvil Tabs, token sweep

### I8. `apps/terminal/src/components/trade/mobile/mobile-account-view.tsx`

**UI imports:** `Badge`, `Button`
**Changes:** Badge/Button variant mappings, token sweep

### I9. `apps/terminal/src/components/trade/mobile/mobile-balances-tab.tsx`

**UI imports:** `Button`, `Checkbox`
**Changes:** Checkbox with label prop, token sweep

### I10. `apps/terminal/src/components/trade/mobile/mobile-positions-tab.tsx`

**UI imports:** `Button`
**Changes:** Button variant mapping, token sweep

### I11. `apps/terminal/src/components/trade/mobile/mobile-orders-tab.tsx`

**UI imports:** `Button`
**Changes:** Button variant mapping, token sweep

### I12. `apps/terminal/src/components/trade/mobile/mobile-orders-history-tab.tsx`

**UI imports:** `Button`
**Changes:** Button variant mapping, token sweep

### I13. `apps/terminal/src/components/trade/mobile/mobile-history-tab.tsx`

**UI imports:** `Button`
**Changes:** Button variant mapping, token sweep

### I14. `apps/terminal/src/components/trade/mobile/mobile-funding-tab.tsx`

**Changes:** Token sweep only

### I15. `apps/terminal/src/components/trade/mobile/mobile-twap-tab.tsx`

**UI imports:** `Button`
**Changes:** Button variant mapping, keep TimeTicker, token sweep

### I16. `apps/terminal/src/components/trade/mobile/mobile-card-skeleton.tsx`

**Changes:** Token sweep only (uses Skeleton which is kept)

### I17. `apps/terminal/src/components/trade/mobile/offline-banner.tsx`

**Changes:** Token sweep only

---

## Section J: Design System Showcase

### J1. `apps/terminal/src/components/design/design-system.tsx`

**UI imports:** Many — `Tabs`, `Button`, etc.
**Changes:**
1. Rewrite to use Anvil components
2. Or delete and rely on Anvil's own showcase
3. Pill tabs → SegmentedControls

### J2. `apps/terminal/src/components/design/components-gallery.tsx`

**UI imports:** ALL ui components for showcase
**Changes:**
1. Complete rewrite using Anvil components
2. Or delete

### J3. `apps/terminal/src/components/design/consistency-checks.tsx`

**UI imports:** Various for checking
**Changes:**
1. Complete rewrite using Anvil components
2. Or delete

### J4. `apps/terminal/src/components/design/tokens-viewer.tsx`

**Changes:** Rewrite to display Anvil tokens instead of old ones

---

## Section K: Kept UI Components (Restyle Only)

These files stay in `@/components/ui/` but need token updates:

### K1. `apps/terminal/src/components/ui/skeleton.tsx`
- Token sweep only

### K2. `apps/terminal/src/components/ui/spinner.tsx`
- Token sweep only

### K3. `apps/terminal/src/components/ui/command.tsx`
- cmdk-based — keep structure, update Dialog usage internally to use Anvil tokens
- Replace `DialogOverlay` → Anvil backdrop styling
- Token sweep

### K4. `apps/terminal/src/components/ui/sidebar.tsx`
- Complex app-specific layout — keep, restyle with Anvil tokens
- Replace any Button/Sheet/Tooltip/Input imports to `@/anvil`
- Token sweep

### K5. `apps/terminal/src/components/ui/resizable.tsx`
- react-resizable-panels wrapper — keep as-is, token sweep only

### K6. `apps/terminal/src/components/ui/virtual-table.tsx`
- Performance component — keep, update table styling to Anvil Table tokens
- Token sweep

### K7. `apps/terminal/src/components/ui/flash.tsx`
- Price flash animation — keep, update color vars from old to new

### K8. `apps/terminal/src/components/ui/chart.tsx`
- Recharts integration — keep, token sweep

### K9. `apps/terminal/src/components/ui/sonner.tsx`
- Toast notifications — keep, restyle with Anvil tokens

### K10. `apps/terminal/src/components/ui/time-ticker.tsx`
- Pure logic, no UI — keep unchanged

### K11. `apps/terminal/src/components/ui/scroll-area.tsx`
- Replace Radix internals with Base UI ScrollArea, style with Anvil tokens

---

## Phase Final: Global Token Sweep

After all component migrations, run a project-wide find-and-replace for any remaining old tokens. Use the token mapping tables in "Universal Rules" section above.

**Search scope:** `apps/terminal/src/**/*.tsx`

**Order of operations:**
1. Text colors (`text-text-950` etc.)
2. Background colors (`bg-surface-*`, `bg-primary-*`, `bg-fill-*` etc.)
3. Border colors (`border-border-*`, `border-primary-*`)
4. Shadows (`shadow-xs` through `shadow-2xl`)
5. Border radius (`rounded-xs/sm/md/lg/xl`)
6. Focus states (`ring-*` → `outline-*`)
7. Typography sizes (`text-5xs` through `text-nav`)
8. Market color suffixes (`market-up-600` → Anvil `success` tokens, `market-down-600` → Anvil `error` tokens)
9. Status colors (`error-700`, `success-700`, `warning-700`)
10. Icon colors

---

## Phase Cleanup: Delete Old UI

After all migrations verified, delete these files from `apps/terminal/src/components/ui/`:

```
DELETE:
- alert.tsx
- alert-dialog.tsx
- avatar.tsx
- badge.tsx
- button.tsx
- button-group.tsx
- card.tsx
- checkbox.tsx
- collapsible.tsx
- context-menu.tsx
- dialog.tsx
- drawer.tsx
- dropdown-menu.tsx
- empty.tsx
- field.tsx
- info-row.tsx
- input.tsx
- input-group.tsx
- item.tsx
- label.tsx
- number-input.tsx
- popover.tsx
- progress.tsx
- radio-group.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- slider.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toggle.tsx
- toggle-group.tsx
- tooltip.tsx
```

**KEEP (no Anvil equivalent):**
- chart.tsx
- command.tsx
- flash.tsx
- resizable.tsx
- scroll-area.tsx
- sidebar.tsx
- skeleton.tsx
- sonner.tsx
- spinner.tsx
- time-ticker.tsx
- virtual-table.tsx

---

## Execution Order (Recommended)

The sections can be parallelized as follows:

**Wave 1 (Foundation — must go first):**
- Phase 0: Foundation Setup

**Wave 2 (Independent sections — all in parallel):**
- Section A: Header (4 files)
- Section C: Orderbook (3 files)
- Section H: Footer (1 file)
- Section G: Layout Shell (6 files, token sweep only)

**Wave 3 (Moderate complexity — in parallel):**
- Section B: Chart & Token Selector (4 files)
- Section D: Tradebox (15 files)
- Section E: Positions Manager (13 files)

**Wave 4 (Shared components — after Wave 3 since they may be imported):**
- Section F: Shared Components & Modals (9 files)
- Section I: Mobile (17 files)

**Wave 5 (Cleanup):**
- Section J: Design System Showcase (4 files)
- Section K: Kept UI Components (11 files)
- Phase Final: Global Token Sweep
- Phase Cleanup: Delete Old UI

---

## Total File Count

| Section | Files |
|---------|-------|
| Phase 0: Foundation | 4 (copy, CSS, config, deps) |
| Section A: Header | 4 |
| Section B: Chart | 4 |
| Section C: Orderbook | 3 |
| Section D: Tradebox | 15 |
| Section E: Positions | 13 |
| Section F: Shared/Modals | 9 |
| Section G: Layout | 6 |
| Section H: Footer | 1 |
| Section I: Mobile | 17 |
| Section J: Design Showcase | 4 |
| Section K: Kept UI | 11 |
| Global Sweep | project-wide |
| Cleanup Delete | 35 files deleted |
| **Total unique files to modify** | **~91** |

---

## Verification Checklist (After Each Section)

- [ ] `pnpm build` — no TypeScript errors
- [ ] `pnpm dev` — visual check that components render
- [ ] Dark mode toggle — verify colors switch correctly
- [ ] Check interactive states: hover, active, focus-visible, disabled
- [ ] Check mobile layout if applicable
- [ ] No remaining imports from `@/components/ui/` for deleted components
- [ ] No remaining old token classes in modified files
