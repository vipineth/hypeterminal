# @hypeterminal/ui Migration PRD

## Goal

Fully replace HyperTerminal's current UI component library and design token system with the @hypeterminal/ui. Every component uses @hypeterminal/ui `sm` size. No preserving the current look — @hypeterminal/ui becomes the single source of truth.

## Source

- **UI package:** `packages/ui/src/` (`@hypeterminal/ui`)
- **UI tokens:** `packages/ui/src/globals.css`
- **Target:** `/Users/ankit/Documents/make/hypeterminal/apps/terminal/src/`

---

## Phase 0: Foundation Setup

### 0.1 — Copy @hypeterminal/ui into the project

Copy `src/components/ui/` from the design system repo into `apps/terminal/packages/ui/src/`.

Files to copy:
- All `.tsx` component files (40 components)
- `index.ts` (barrel exports)
- `config.ts` (DEFAULT_SIZE = "sm")
- `types.ts` (Size, BrandConfig)
- `utils.ts` (cn utility)
- `globals.css` from `src/styles/globals.css` (design tokens)

### 0.2 — Merge token CSS

Replace the current `src/styles.css` with @hypeterminal/ui `globals.css` as the base. Add trading-specific tokens as extensions.

**Tokens to keep from current system (add to @hypeterminal/ui globals.css):**

```css
/* Trading tokens — HyperTerminal extensions */
--market-up: /* current green value */;
--market-down: /* current red value */;
--market-neutral: /* current neutral value */;
--scope-perp: /* current perp accent */;
--scope-spot: /* current spot accent */;
--scope-builders: /* current builders accent */;
```

Wire them into Tailwind in the `@theme inline` block:
```css
--color-market-up: var(--market-up);
--color-market-down: var(--market-down);
--color-market-neutral: var(--market-neutral);
--color-scope-perp: var(--scope-perp);
--color-scope-spot: var(--scope-spot);
--color-scope-builders: var(--scope-builders);
```

**Tokens to delete:** Everything else in current `styles.css` that @hypeterminal/ui replaces (text-950, surface-*, border-*, primary-*, fill-*, etc.)

### 0.3 — Update imports

Add path alias so @hypeterminal/ui components can be imported as `@hypeterminal/ui`:
```typescript
// in tsconfig or vite config
"@hypeterminal/ui": ["./packages/ui/src"]
// or import from "@hypeterminal/ui/index"
```

### 0.4 — Install missing dependencies (if not already present)

- `@base-ui/react` (@hypeterminal/ui uses this, check version matches)
- `class-variance-authority` (already in project)
- `clsx` (already in project)
- `tailwind-merge` (already in project)

---

## Phase 1: Button (50 files)

**Current:** `@/components/ui/button` — variants: contained/outlined/ghost/text/destructive, sizes: none/sm/md/lg/icon, tones: base/accent

**@hypeterminal/ui:** `@hypeterminal/ui` — `Button` + `ButtonIcon`

### Conversion table

| Current | @hypeterminal/ui |
|---------|-------|
| `import { Button } from "@/components/ui/button"` | `import { Button } from "@hypeterminal/ui"` |
| `variant="contained" tone="base"` | `variant="filled" intent="neutral"` |
| `variant="contained" tone="accent"` | `variant="filled" intent="brand"` |
| `variant="outlined" tone="base"` | `variant="outline" intent="neutral"` |
| `variant="outlined" tone="accent"` | `variant="outline" intent="brand"` |
| `variant="ghost" tone="base"` | `variant="ghost" intent="neutral"` |
| `variant="ghost" tone="accent"` | `variant="ghost" intent="brand"` |
| `variant="text" tone="base"` | `variant="link" intent="neutral"` |
| `variant="text" tone="accent"` | `variant="link" intent="brand"` |
| `variant="destructive"` | `variant="filled" intent="error"` |
| `size="icon"` | Use `<ButtonIcon>` component instead |
| `size="sm"` | `size="sm"` (same) |
| `size="md"` | `size="sm"` (use sm everywhere) |
| `size="lg"` | `size="sm"` (use sm everywhere) |
| `size="none"` | Remove — apply custom padding via className if needed |
| `asChild` | Remove — @hypeterminal/ui doesn't use Radix Slot. Wrap with anchor or use `render` prop from Base UI |

### Icon handling

Current pattern (icon inside children):
```tsx
<Button variant="outlined">
  <DownloadIcon className="size-4" />
  Deposit
</Button>
```

@hypeterminal/ui pattern (dedicated props):
```tsx
<Button variant="outline" intent="neutral" iconLeft={<DownloadIcon size={16} />}>
  Deposit
</Button>
```

### Icon-only buttons

Current:
```tsx
<Button variant="ghost" size="icon">
  <GearIcon className="size-4" />
</Button>
```

@hypeterminal/ui:
```tsx
<ButtonIcon variant="ghost" intent="neutral">
  <GearIcon size={16} />
</ButtonIcon>
```

### Files to update

1. apps/terminal/src/components/trade/positions/orders-tab.tsx
2. apps/terminal/src/components/trade/components/token-selector-dropdown.tsx
3. apps/terminal/src/components/trade/mobile/mobile-orders-tab.tsx
4. apps/terminal/src/components/trade/mobile/mobile-positions-tab.tsx
5. apps/terminal/src/components/trade/positions/positions-tab.tsx
6. apps/terminal/src/components/trade/orderbook/trades-panel.tsx
7. apps/terminal/src/components/trade/mobile/mobile-account-view.tsx
8. apps/terminal/src/components/trade/tradebox/account-panel.tsx
9. apps/terminal/src/components/trade/tradebox/trade-panel.tsx
10. apps/terminal/src/components/trade/positions/position-limit-close-modal.tsx
11. apps/terminal/src/components/trade/positions/twap-tab.tsx
12. apps/terminal/src/components/trade/positions/history-tab.tsx
13. apps/terminal/src/components/trade/mobile/mobile-twap-tab.tsx
14. apps/terminal/src/components/trade/mobile/mobile-book-view.tsx
15. apps/terminal/src/components/trade/mobile/mobile-history-tab.tsx
16. apps/terminal/src/components/trade/mobile/mobile-orders-history-tab.tsx
17. apps/terminal/src/components/trade/tradebox/deposit-modal.tsx
18. apps/terminal/src/components/trade/positions/transfer-dialog.tsx
19. apps/terminal/src/components/trade/mobile/mobile-balances-tab.tsx
20. apps/terminal/src/components/trade/positions/orders-history-tab.tsx
21. apps/terminal/src/components/trade/positions/balances-tab.tsx
22. apps/terminal/src/components/trade/components/spot-swap-modal.tsx
23. apps/terminal/src/components/trade/positions/send-dialog.tsx
24. apps/terminal/src/components/trade/positions/position-tpsl-modal.tsx
25. apps/terminal/src/components/trade/mobile/mobile-trade-view.tsx
26. apps/terminal/src/components/trade/tradebox/bridge-tab.tsx
27. apps/terminal/src/components/trade/testnet-banner.tsx
28. apps/terminal/src/components/trade/header/top-nav.tsx
29. apps/terminal/src/components/trade/tradebox/trade-form-fields.tsx
30. apps/terminal/src/components/trade/tradebox/order-toast.tsx
31. apps/terminal/src/components/trade/chart/token-selector.tsx
32. apps/terminal/src/components/pages/not-found-page.tsx
33. apps/terminal/src/components/trade/components/wallet-dialog.tsx
34. apps/terminal/src/components/trade/header/favorites-strip.tsx
35. apps/terminal/src/components/trade/header/theme-toggle.tsx
36. apps/terminal/src/components/trade/header/user-menu.tsx
37. apps/terminal/src/components/trade/mobile/mobile-bottom-nav.tsx
38. apps/terminal/src/components/trade/mobile/mobile-header.tsx
39. apps/terminal/src/components/trade/orderbook/orderbook-row.tsx
40. apps/terminal/src/components/trade/positions/position-actions-dropdown.tsx
41. apps/terminal/src/components/trade/tradebox/leverage-control.tsx
42. apps/terminal/src/components/trade/tradebox/margin-mode-dialog.tsx
43. apps/terminal/src/components/trade/components/trading-action-button.tsx
44. apps/terminal/src/components/design/design-system.tsx
45. apps/terminal/src/components/design/consistency-checks.tsx
46. apps/terminal/src/components/design/components-gallery.tsx
47. apps/terminal/src/components/ui/input-group.tsx
48. apps/terminal/src/components/ui/alert-dialog.tsx
49. apps/terminal/src/components/ui/sidebar.tsx
50. apps/terminal/src/components/ui/virtual-table.tsx

---

## Phase 2: Dialog to Modal (10 files)

**Current:** `@/components/ui/dialog` — Radix Dialog with separate Overlay/Portal/Content

**@hypeterminal/ui:** `@hypeterminal/ui` — `Modal`, `ModalTrigger`, `ModalClose`, `ModalPopup`, `ModalHeader`, `ModalTitle`, `ModalDescription`, `ModalContent`, `ModalFooter`

### Conversion table

| Current | @hypeterminal/ui |
|---------|-------|
| `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"` | `import { Modal, ModalTrigger, ModalPopup, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter, ModalClose } from "@hypeterminal/ui"` |
| `<Dialog>` | `<Modal>` |
| `<DialogTrigger>` | `<ModalTrigger>` |
| `<DialogContent>` | `<ModalPopup size="sm">` |
| `<DialogHeader>` | `<ModalHeader>` |
| `<DialogTitle>` | `<ModalTitle>` |
| `<DialogDescription>` | `<ModalDescription>` |
| body content (no wrapper) | `<ModalContent>` (adds px-6 py-4) |
| `<DialogFooter>` | `<ModalFooter>` |
| `<DialogClose>` | `<ModalClose>` |
| `showCloseButton={false}` | `showClose={false}` on ModalPopup |

### Key differences

1. **No separate DialogOverlay/DialogPortal** — `ModalPopup` bundles overlay + portal + animation + close button
2. **Body wrapper** — @hypeterminal/ui adds `ModalContent` for the body area between header and footer. Current Dialog has no explicit body wrapper — content goes directly inside DialogContent.
3. **Controlled open state** — Both support `open` + `onOpenChange`. Pattern stays the same.
4. **Size** — `ModalPopup` accepts `size="sm" | "md" | "lg"`. Use `sm` for everything initially.

### Structural change example

Current:
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Send Funds</DialogTitle>
      <DialogDescription>Transfer to another address</DialogDescription>
    </DialogHeader>
    {/* body content directly here */}
    <form>...</form>
    <DialogFooter>
      <Button>Cancel</Button>
      <Button>Send</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

@hypeterminal/ui:
```tsx
<Modal open={open} onOpenChange={setOpen}>
  <ModalPopup size="sm">
    <ModalHeader>
      <ModalTitle>Send Funds</ModalTitle>
      <ModalDescription>Transfer to another address</ModalDescription>
    </ModalHeader>
    <ModalContent>
      <form>...</form>
    </ModalContent>
    <ModalFooter>
      <Button variant="ghost" intent="neutral">Cancel</Button>
      <Button variant="filled" intent="brand">Send</Button>
    </ModalFooter>
  </ModalPopup>
</Modal>
```

### Files to update

1. apps/terminal/src/components/trade/positions/position-limit-close-modal.tsx
2. apps/terminal/src/components/trade/tradebox/deposit-modal.tsx
3. apps/terminal/src/components/trade/positions/transfer-dialog.tsx
4. apps/terminal/src/components/trade/components/spot-swap-modal.tsx
5. apps/terminal/src/components/trade/positions/send-dialog.tsx
6. apps/terminal/src/components/trade/positions/position-tpsl-modal.tsx
7. apps/terminal/src/components/trade/components/global-settings-dialog.tsx
8. apps/terminal/src/components/trade/components/wallet-dialog.tsx
9. apps/terminal/src/components/trade/tradebox/margin-mode-dialog.tsx
10. apps/terminal/src/components/ui/command.tsx (uses Dialog internally)

---

## Phase 3: Tabs (10 files)

**Current:** `@/components/ui/tabs` — variants: pill/underline, with Framer Motion animated indicator

**@hypeterminal/ui:** `@hypeterminal/ui` — `Tabs` (underline style) + `SegmentedControls` (pill/toggle style)

### Decision per usage

| File | Current variant | @hypeterminal/ui component |
|------|----------------|-----------------|
| account-panel.tsx | pill | `SegmentedControls` |
| positions-panel.tsx | underline | `Tabs` |
| mobile-positions-view.tsx | underline | `Tabs` |
| deposit-modal.tsx | pill | `SegmentedControls` |
| mobile-trade-view.tsx | underline | `Tabs` |
| orderbook-panel.tsx | pill | `SegmentedControls` |
| side-toggle.tsx | pill (Buy/Sell) | `SegmentedControls` |
| trade-header.tsx | underline | `Tabs` |
| design-system.tsx | pill | `SegmentedControls` |
| components-gallery.tsx | underline | `Tabs` |

### Conversion — Underline Tabs

| Current | @hypeterminal/ui |
|---------|-------|
| `<Tabs>` | `<Tabs>` |
| `<TabsList variant="underline">` | `<TabsList>` |
| `<TabsTrigger value="x">` | `<TabsTrigger value="x">` |
| `<TabsContent value="x">` | `<TabsContent value="x">` |
| `forceMount` | Not available — content unmounts when inactive |

### Conversion — Pill Tabs to SegmentedControls

| Current | @hypeterminal/ui |
|---------|-------|
| `<Tabs>` | `<SegmentedControls>` |
| `<TabsList variant="pill">` | (removed — styling is built into SegmentedControls) |
| `<TabsTrigger value="x">` | `<SegmentedControlItem value="x">` |
| `<TabsContent value="x">` | (manual: render content conditionally based on value) |

Note: `SegmentedControls` does NOT have a content panel — it's purely a control. Content switching must be handled manually:
```tsx
const [tab, setTab] = useState("deposit");

<SegmentedControls value={tab} onValueChange={setTab}>
  <SegmentedControlItem value="deposit">Deposit</SegmentedControlItem>
  <SegmentedControlItem value="withdraw">Withdraw</SegmentedControlItem>
</SegmentedControls>

{tab === "deposit" && <DepositForm />}
{tab === "withdraw" && <WithdrawForm />}
```

### Files to update

1. apps/terminal/src/components/trade/tradebox/account-panel.tsx
2. apps/terminal/src/components/trade/positions/positions-panel.tsx
3. apps/terminal/src/components/trade/mobile/mobile-positions-view.tsx
4. apps/terminal/src/components/trade/tradebox/deposit-modal.tsx
5. apps/terminal/src/components/trade/mobile/mobile-trade-view.tsx
6. apps/terminal/src/components/trade/orderbook/orderbook-panel.tsx
7. apps/terminal/src/components/trade/tradebox/side-toggle.tsx
8. apps/terminal/src/components/trade/tradebox/trade-header.tsx
9. apps/terminal/src/components/design/design-system.tsx
10. apps/terminal/src/components/design/components-gallery.tsx

---

## Phase 4: DropdownMenu to Dropdown (7 files)

**Current:** `@/components/ui/dropdown-menu` — Radix compound components (DropdownMenu, Trigger, Content, Item, Separator, etc.)

**@hypeterminal/ui:** `@hypeterminal/ui` — Single `Dropdown` component with declarative `items`/`groups` props

### Conversion pattern

Current (compound/imperative):
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuItem onClick={handleCopy}>
      <CopyIcon /> Copy Address
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onClick={handleDisconnect}>
      Disconnect
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

@hypeterminal/ui (declarative):
```tsx
<Dropdown
  trigger={<Button variant="outline" intent="neutral">Menu</Button>}
  groups={[
    {
      label: "Actions",
      items: [
        { label: "Copy Address", icon: <CopyIcon size={16} />, onSelect: handleCopy },
      ],
    },
    {
      items: [
        { label: "Disconnect", danger: true, onSelect: handleDisconnect },
      ],
    },
  ]}
/>
```

Or without groups:
```tsx
<Dropdown
  trigger={<Button>Menu</Button>}
  items={[
    { label: "Copy Address", icon: <CopyIcon size={16} />, onSelect: handleCopy },
    { label: "Disconnect", danger: true, onSelect: handleDisconnect },
  ]}
/>
```

### Key differences

1. **Flat API** — No more composing 5-6 sub-components. Pass data as props.
2. **No asChild** — `trigger` prop accepts a ReactNode directly.
3. **No CheckboxItem/RadioItem** — @hypeterminal/ui Dropdown is action-only. If a dropdown needs checkboxes or radio selection, either extend @hypeterminal/ui or handle differently.
4. **Separator** — Handled automatically between `groups`.
5. **danger** replaces `variant="destructive"`.

### Special case: DropdownMenuCheckboxItem

Current `orderbook-panel.tsx` and `mobile-book-view.tsx` may use checkbox items in dropdowns. @hypeterminal/ui Dropdown doesn't support this. Options:
- Convert to a `Select` or `Popover` with checkboxes
- Extend @hypeterminal/ui Dropdown to support a `checked` state on items

### Files to update

1. apps/terminal/src/components/trade/components/token-selector-dropdown.tsx
2. apps/terminal/src/components/trade/chart/kline-chart.tsx
3. apps/terminal/src/components/trade/mobile/mobile-book-view.tsx
4. apps/terminal/src/components/trade/orderbook/orderbook-panel.tsx
5. apps/terminal/src/components/trade/header/user-menu.tsx
6. apps/terminal/src/components/trade/positions/position-actions-dropdown.tsx
7. apps/terminal/src/components/trade/tradebox/advanced-order-dropdown.tsx

---

## Phase 5: Select (4 files)

**Current:** `@/components/ui/select` — Radix compound components (Select, SelectTrigger, SelectContent, SelectItem, etc.)

**@hypeterminal/ui:** `@hypeterminal/ui` — Single `Select` component with declarative `options` prop

### Conversion pattern

Current:
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="usdc">USDC</SelectItem>
    <SelectItem value="usdt">USDT</SelectItem>
  </SelectContent>
</Select>
```

@hypeterminal/ui:
```tsx
<Select
  value={value}
  onValueChange={setValue}
  placeholder="Choose..."
  options={[
    { value: "usdc", label: "USDC" },
    { value: "usdt", label: "USDT" },
  ]}
/>
```

With groups:
```tsx
<Select
  options={[
    { label: "Stablecoins", options: [
      { value: "usdc", label: "USDC" },
      { value: "usdt", label: "USDT" },
    ]},
    { label: "Native", options: [
      { value: "eth", label: "ETH" },
    ]},
  ]}
/>
```

### Additional props available

- `label` — field label above the select
- `helperText` — hint text below
- `errorMessage` — error state
- `required`, `disabled`
- `size="sm"` (use sm everywhere)

### Files to update

1. apps/terminal/src/components/trade/tradebox/deposit-modal.tsx
2. apps/terminal/src/components/trade/positions/send-dialog.tsx
3. apps/terminal/src/components/trade/components/global-settings-dialog.tsx
4. apps/terminal/src/components/trade/tradebox/trade-form-fields.tsx

---

## Phase 6: Input to TextInput (10 files)

**Current:** `@/components/ui/input` — bare input element with inputSize prop, manual label/error wrapping

**@hypeterminal/ui:** `@hypeterminal/ui` — `TextInput` with built-in Field.Root, label, hint, error, icons

### Conversion pattern

Current:
```tsx
<div>
  <Label>Email</Label>
  <Input inputSize="sm" placeholder="user@example.com" />
  {error && <span className="text-error-700">{error}</span>}
</div>
```

@hypeterminal/ui:
```tsx
<TextInput
  label="Email"
  placeholder="user@example.com"
  error={error}
  size="sm"
/>
```

### Prop mapping

| Current | @hypeterminal/ui |
|---------|-------|
| `inputSize="sm"` | `size="sm"` |
| `inputSize="default"` | `size="sm"` |
| `inputSize="lg"` | `size="sm"` (sm everywhere) |
| Manual `<Label>` | `label="..."` prop |
| Manual error display | `error="..."` prop |
| Manual icon placement | `iconLeft={...}` / `iconRight={...}` |

### NumberInput (8 files)

@hypeterminal/ui already has `NumberInput` wrapping Base UI NumberField. Current HyperTerminal `number-input.tsx` does manual regex validation, arrow key stepping, and synthetic events — all of which Base UI NumberField handles natively.

| Current | @hypeterminal/ui |
|---------|-------|
| `<NumberInput inputSize="sm" allowDecimals min={0} max={100} step={0.01}>` | `<NumberInput size="sm" min={0} max={100} step={0.01}>` |
| `allowDecimals={false}` | `step={1}` (integer steps) |
| `maxAllowedDecimals={2}` | `step={0.01}` |
| `maxLabel` + `onMaxClick` | TBD — may need to extend @hypeterminal/ui NumberInput or use className override |

NumberInput files:
1. apps/terminal/src/components/trade/tradebox/trade-form-fields.tsx
2. apps/terminal/src/components/trade/tradebox/leverage-control.tsx
3. apps/terminal/src/components/trade/tradebox/deposit-modal.tsx
4. apps/terminal/src/components/trade/positions/transfer-dialog.tsx
5. apps/terminal/src/components/trade/positions/send-dialog.tsx
6. apps/terminal/src/components/trade/positions/position-limit-close-modal.tsx
7. apps/terminal/src/components/trade/components/spot-swap-modal.tsx
8. apps/terminal/src/components/trade/components/global-settings-dialog.tsx

### TextInput files to update

1. apps/terminal/src/components/trade/positions/send-dialog.tsx
2. apps/terminal/src/components/trade/mobile/mobile-trade-view.tsx
3. apps/terminal/src/components/trade/tradebox/tp-sl-section.tsx
4. apps/terminal/src/components/trade/tradebox/price-input-with-percent.tsx
5. apps/terminal/src/components/trade/chart/token-selector.tsx
6. apps/terminal/src/components/trade/components/wallet-dialog.tsx
7. apps/terminal/src/components/ui/input-group.tsx
8. apps/terminal/src/components/design/consistency-checks.tsx
9. apps/terminal/src/components/design/components-gallery.tsx
10. apps/terminal/src/components/ui/sidebar.tsx

---

## Phase 7: Badge (7 files)

**Current:** `@/components/ui/badge` — variants: default/secondary/destructive/outline/long/short/neutral, sizes: default/sm/xs

**@hypeterminal/ui:** `@hypeterminal/ui` — `Badge` with tones: error/warning/success/information/neutral/brand

### Conversion table

| Current | @hypeterminal/ui |
|---------|-------|
| `variant="default"` | `tone="brand"` |
| `variant="secondary"` | `tone="neutral"` |
| `variant="destructive"` | `tone="error"` |
| `variant="outline"` | `tone="neutral"` (@hypeterminal/ui badges always have fill+border) |
| `variant="neutral"` | `tone="neutral"` |
| `variant="long"` | `tone="success"` + custom className for market-up color |
| `variant="short"` | `tone="error"` + custom className for market-down color |
| `size="xs"` | `size="sm"` (@hypeterminal/ui minimum) |
| `size="sm"` | `size="sm"` |

### Trading badges (long/short)

These need market colors. Two options:
1. Add `tone="long"` and `tone="short"` to @hypeterminal/ui Badge (preferred — keeps it clean)
2. Use `tone="success"` / `tone="error"` and accept the semantic color difference

Recommendation: Extend @hypeterminal/ui Badge with trading tones after initial migration.

### Files to update

1. apps/terminal/src/components/trade/mobile/mobile-account-view.tsx
2. apps/terminal/src/components/trade/positions/position-limit-close-modal.tsx
3. apps/terminal/src/components/trade/positions/position-tpsl-modal.tsx
4. apps/terminal/src/components/trade/tradebox/bridge-tab.tsx
5. apps/terminal/src/components/trade/chart/token-selector.tsx
6. apps/terminal/src/components/design/consistency-checks.tsx
7. apps/terminal/src/components/design/components-gallery.tsx

---

## Phase 8: Card + Table (14 files)

### Card (7 files)

**Current:** `@/components/ui/card` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction

**@hypeterminal/ui:** `@hypeterminal/ui` — Same compound structure with added `variant` prop

| Current | @hypeterminal/ui |
|---------|-------|
| `<Card>` | `<Card variant="outlined">` |
| `<CardHeader>` | `<CardHeader>` |
| `<CardTitle>` | `<CardTitle>` |
| `<CardDescription>` | `<CardDescription>` |
| `<CardContent>` | `<CardContent>` |
| `<CardFooter>` | `<CardFooter>` |
| `<CardAction>` | Not in @hypeterminal/ui — use className positioning |

Card files (all in positions/):
1. orders-tab.tsx
2. positions-tab.tsx
3. twap-tab.tsx
4. history-tab.tsx
5. orders-history-tab.tsx
6. balances-tab.tsx
7. funding-tab.tsx

### Table (7 files)

**Current:** `@/components/ui/table` — Table, TableHeader, TableBody, TableRow, TableHead, TableCell

**@hypeterminal/ui:** `@hypeterminal/ui` — Same structure with added `variant="striped"` option

| Current | @hypeterminal/ui |
|---------|-------|
| `<Table>` | `<Table>` |
| `<TableHeader>` | `<TableHeader>` |
| `<TableBody>` | `<TableBody>` |
| `<TableRow>` | `<TableRow>` |
| `<TableHead>` | `<TableHead>` |
| `<TableCell>` | `<TableCell>` |

Mostly a drop-in replacement. Import path changes, minor class adjustments.

Table files (same positions/ directory):
1. orders-tab.tsx
2. positions-tab.tsx
3. twap-tab.tsx
4. history-tab.tsx
5. orders-history-tab.tsx
6. balances-tab.tsx
7. funding-tab.tsx

---

## Phase 9: Switch, Checkbox, Slider (13 files)

### Switch to Toggle (3 files)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Switch>` (Radix) | `<Toggle size="sm">` |
| `<Switch>` + manual label | `<Toggle label="...">` |

Files:
1. global-settings-dialog.tsx
2. consistency-checks.tsx
3. components-gallery.tsx

### Checkbox (6 files)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Checkbox>` (Radix) | `<Checkbox size="sm">` |
| Manual label next to checkbox | `<Checkbox label="..." description="...">` |

Files:
1. orders-tab.tsx
2. mobile-balances-tab.tsx
3. balances-tab.tsx
4. consistency-checks.tsx
5. components-gallery.tsx
6. trade-form-fields.tsx

### Slider (4 files)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Slider>` (Radix) | `<Slider>` |
| Manual label/value display | `<Slider label="..." showValue>` |

Files:
1. mobile-trade-view.tsx
2. global-settings-dialog.tsx
3. trade-form-fields.tsx
4. leverage-slider.tsx

---

## Phase 10: Tooltip, Sheet/Drawer, Separator (5 files)

### Tooltip (2 files)

Current (4 components):
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>Tip text</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

@hypeterminal/ui (1 component):
```tsx
<Tooltip content="Tip text">
  <button>Hover me</button>
</Tooltip>
```

Files:
1. positions-tab.tsx
2. sidebar.tsx

### Sheet to Drawer (2 files)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Sheet>` | `<Drawer side="right">` |
| `<SheetTrigger>` | `<DrawerTrigger>` |
| `<SheetContent side="right">` | `<DrawerContent>` |
| `<SheetHeader>` | `<DrawerHeader>` |
| `<SheetTitle>` | `<DrawerTitle>` |
| `<SheetFooter>` | `<DrawerFooter>` |

Files:
1. leverage-control.tsx
2. sidebar.tsx

### Separator to Divider (1 file)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Separator>` | `<Divider>` |
| `orientation="horizontal"` | `orientation="horizontal"` (same) |

File: bridge-tab.tsx

---

## Phase 10b: Missing Components (found during audit)

### Textarea → @hypeterminal/ui Textarea (1 file)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Textarea>` | `<Textarea size="sm">` |
| Manual label/error | `<Textarea label="..." errorMessage="...">` (built-in) |

File: apps/terminal/src/components/ui/input-group.tsx (internal import)

### Avatar (1 file)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Avatar>` (Radix) | `<Avatar size="sm">` |
| Image + fallback | `<Avatar src="..." alt="..." initials="..." status="online">` |

File: apps/terminal/src/components/trade/components/asset-display.tsx

### Alert (1 file)

| Current | @hypeterminal/ui |
|---------|-------|
| `<Alert>` + `<AlertTitle>` + `<AlertDescription>` | `<Alert tone="..." title="..." description="...">` |

File: apps/terminal/src/components/design/components-gallery.tsx

### Drawer (existing, not Sheet) (1 file)

Current `drawer.tsx` (vaul-based) already imported in token-selector.tsx. Replace with @hypeterminal/ui Drawer.

File: apps/terminal/src/components/trade/chart/token-selector.tsx

### Collapsible (1 file — rewrite to Base UI)

Currently wraps Radix Collapsible. Base UI has `@base-ui/react/collapsible` with the same Root/Trigger/Content pattern. Rewrite to use Base UI, style with @hypeterminal/ui tokens. Drop-in replacement.

File: apps/terminal/src/components/trade/tradebox/bridge-tab.tsx

### InfoRow (6 files — rebuild with @hypeterminal/ui tokens)

Simple `flex justify-between` with label + value. No @hypeterminal/ui equivalent needed — rebuild as a tiny utility using @hypeterminal/ui tokens (`text-text-weak` for label, `text-text-strong` for value, `border-stroke-weak` for dividers). Delete old component after restyling.

Files:
1. apps/terminal/src/components/trade/tradebox/order-summary.tsx
2. apps/terminal/src/components/trade/tradebox/deposit-modal.tsx
3. apps/terminal/src/components/trade/tradebox/bridge-tab.tsx
4. apps/terminal/src/components/trade/tradebox/account-panel.tsx
5. apps/terminal/src/components/trade/positions/position-tpsl-modal.tsx
6. apps/terminal/src/components/trade/positions/position-limit-close-modal.tsx

### Empty (0 imports — likely dead code, verify before deleting)

Empty state component. If used, replace with @hypeterminal/ui `TextBlock` (icon + heading + description) wrapped in a dashed border container. @hypeterminal/ui `Slot` component is also designed for placeholder states.

### Item (0 imports — likely dead code, verify before deleting)

Complex list item compound component. If used, rebuild with @hypeterminal/ui `Card variant="outlined" orientation="horizontal"` or inline layout with @hypeterminal/ui tokens.

### TimeTicker (2 files — keep as-is)

Pure logic component (requestAnimationFrame timer). Returns raw text, zero UI. No design system relevance. Keep in place, no changes needed.

Files:
1. apps/terminal/src/components/trade/positions/twap-tab.tsx
2. apps/terminal/src/components/trade/mobile/mobile-twap-tab.tsx

### Flash (0 imports — keep, update tokens)

Price flash animation. Pure behavior. Keep as-is but update CSS variables from `--positive`/`--negative` to `--market-up`/`--market-down` during token sweep.

---

## Phase 11: Global Token Find-and-Replace

After all component migrations, sweep every file for remaining old token classes.

### Text colors

| Find | Replace |
|------|---------|
| `text-text-950` | `text-text-strong` |
| `text-text-600` | `text-text-weak` |
| `text-text-500` | `text-text-weak` |
| `text-text-400` | `text-text-disabled` |
| `text-text-10` | `text-text-inverse-strong` |
| `text-primary-default` | `text-text-brand` |
| `text-primary-hover` | `text-text-brand` |

### Backgrounds

| Find | Replace |
|------|---------|
| `bg-surface-base` | `bg-bg-base` |
| `bg-surface-analysis` | `bg-bg-raised` |
| `bg-surface-execution` | `bg-bg-overlay` |
| `bg-surface-monitoring-row-a` | `bg-bg-alternate` |
| `bg-surface-monitoring-row-b` | `bg-bg-base` |
| `bg-primary-default` | `bg-fill-brand-strong` |
| `bg-primary-hover` | `bg-fill-brand-strong` (use opacity for hover) |
| `bg-primary-active` | `bg-fill-brand-strong` (use opacity for active) |
| `bg-primary-muted` | `bg-fill-brand-weak` |
| `bg-fill-900` | `bg-fill-strong` |
| `bg-fill-300` | `bg-fill-weak` |
| `bg-fill-100` | `bg-fill-weak` |
| `bg-fill-50` | `bg-fill-weaker` |
| `bg-text-950` | `bg-fill-strong` |
| `bg-text-950/5` | `bg-fill-hover` |
| `bg-text-950/10` | `bg-fill-press` |
| `bg-error-700` | `bg-fill-error-strong` |
| `bg-success-700` | `bg-fill-success-strong` |
| `bg-warning-700` | `bg-fill-warning-strong` |

### Borders

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

### Shadows

| Find | Replace |
|------|---------|
| `shadow-xs` | `shadow-raised` |
| `shadow-sm` | `shadow-raised` |
| `shadow-md` | `shadow-raised` |
| `shadow-lg` | `shadow-overlay` |
| `shadow-xl` | `shadow-overlay` |
| `shadow-2xl` | `shadow-overlay` |

### Border radius

| Find | Replace |
|------|---------|
| `rounded-xs` | `rounded-8` |
| `rounded-sm` | `rounded-8` |
| `rounded-md` | `rounded-12` |
| `rounded-lg` | `rounded-12` |
| `rounded-xl` | `rounded-12` |

### Focus states

| Find | Replace |
|------|---------|
| `focus-visible:ring-2 focus-visible:ring-primary-default/50` | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus` |
| `focus-visible:ring-2 focus-visible:ring-ring/50` | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus` |

### Typography sizes

| Find | Replace |
|------|---------|
| `text-5xs` | `text-xs` (@hypeterminal/ui min is 14px) |
| `text-4xs` | `text-xs` |
| `text-3xs` | `text-xs` |
| `text-2xs` | `text-xs` |
| `text-xs` | `text-xs` (stays same — now means 14px in @hypeterminal/ui) |
| `text-nav` | `text-xs` |
| `text-sm` | `text-sm` (now means 16px in @hypeterminal/ui) |
| `text-base` | `text-base` (now means 20px in @hypeterminal/ui) |

### Semantic status colors

| Find | Replace |
|------|---------|
| `text-error-700` | `text-text-error` |
| `text-success-700` | `text-text-success` |
| `text-warning-700` | `text-text-warning` |
| `bg-error-100` | `bg-fill-error-weak` |
| `bg-success-100` | `bg-fill-success-weak` |
| `bg-warning-100` | `bg-fill-warning-weak` |

### Icon colors

| Find | Replace |
|------|---------|
| Icon with `text-text-600` | `text-icon-neutral` |
| Icon with `text-text-400` | `text-icon-disabled` |
| Icon with `text-primary-default` | `text-icon-brand` |

---

## Phase 12: Cleanup

### Delete old UI components

Remove the entire `src/components/ui/` directory EXCEPT these files that have no @hypeterminal/ui equivalent:

**Keep:**
- `scroll-area.tsx` — replace internals with Base UI ScrollArea, keep the component
- `skeleton.tsx` — no @hypeterminal/ui equivalent
- `spinner.tsx` — no @hypeterminal/ui equivalent
- `command.tsx` — cmdk-based, no @hypeterminal/ui equivalent
- `sidebar.tsx` — app-specific layout
- `resizable.tsx` — react-resizable-panels, layout-specific
- `virtual-table.tsx` — performance optimization, keep
- `flash.tsx` — trading animation, keep
- `chart.tsx` — recharts integration, keep
- `sonner.tsx` — toast notifications, keep
- `time-ticker.tsx` — pure logic, no UI (2 files use it)
- `flash.tsx` — pure behavior, update tokens only

**Delete (replaced by @hypeterminal/ui):**
- button.tsx, button-group.tsx
- dialog.tsx, alert-dialog.tsx
- tabs.tsx
- select.tsx
- dropdown-menu.tsx
- tooltip.tsx
- badge.tsx
- input.tsx, input-group.tsx, number-input.tsx
- toggle.tsx, toggle-group.tsx
- switch.tsx
- checkbox.tsx
- slider.tsx
- card.tsx
- alert.tsx
- separator.tsx
- sheet.tsx, drawer.tsx
- popover.tsx
- radio-group.tsx
- progress.tsx
- field.tsx, label.tsx
- context-menu.tsx
- collapsible.tsx
- table.tsx
- avatar.tsx
- info-row.tsx (rebuild with @hypeterminal/ui tokens, delete old)
- item.tsx (0 imports — verify dead code, delete)
- empty.tsx (0 imports — verify dead code, or replace with TextBlock + Slot)

### Update CLAUDE.md / design-tokens.md

Update project rules to reference @hypeterminal/ui tokens instead of old token names.

### Update design/ showcase

Rewrite `design-system.tsx`, `components-gallery.tsx`, `consistency-checks.tsx` to use @hypeterminal/ui components — or delete them and rely on @hypeterminal/ui own showcase pages.

---

## Components Not in @hypeterminal/ui (Use Base UI Directly)

| Need | Solution |
|------|----------|
| Popover | `@base-ui/react/popover` — style with @hypeterminal/ui tokens |
| ScrollArea | `@base-ui/react/scroll-area` — style with @hypeterminal/ui tokens |
| Progress bar | `@base-ui/react/progress` — style with @hypeterminal/ui tokens |
| Collapsible | `@base-ui/react/collapsible` — style with @hypeterminal/ui tokens |
| Context menu | `@base-ui/react/context-menu` — style with @hypeterminal/ui tokens |
| Toast | `@base-ui/react/toast` or keep sonner |
| Accordion | `@base-ui/react/accordion` — if needed |

---

## Dependencies

### Before migration starts
- [x] ~~@hypeterminal/ui team adds `NumberInput` component~~ — Already exists in @hypeterminal/ui (`number-input.tsx` + showcase)
- [ ] Verify `@base-ui/react` version compatibility between @hypeterminal/ui and HyperTerminal
- [ ] Check if @hypeterminal/ui NumberInput supports `maxLabel` + `onMaxClick` (trading "MAX" button) — if not, extend it

### Can run in parallel
- Phases 1-10 can each be done independently as separate PRs
- Phase 11 (token sweep) should run after all component phases
- Phase 12 (cleanup) runs last

---

## Verification per phase

After each phase:
1. `npm run build` — no TypeScript errors
2. `npm run dev` — visual check that components render
3. Dark mode toggle — verify colors switch correctly (@hypeterminal/ui tokens handle this automatically, no `dark:` prefixes needed for semantic tokens)
4. Check interactive states: hover, active, focus-visible, disabled
5. Check mobile layout if the component appears in mobile views
