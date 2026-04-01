# UI Polish Plan — Post-@hypeterminal/ui Migration

## Completed (this session)
- [x] Committed UI migration (175 files, radix -> @base-ui/react)
- [x] Added minSize constraints to sidebar (18%) and analysis (50%) panels
- [x] Fixed orderbook header column overlap (removed double-wrapped Dropdown trigger, reduced gap, added min-w-0)
- [x] Fixed modal backdrop opacity (45% -> 67% in light mode, added z-50)
- [x] Fixed trade panel header row overflow (gap-2, min-w-0, shrink-0 on buttons)
- [x] Fixed AdvancedOrderDropdown min-width overflow
- [x] Fixed account panel overflow-hidden
- [x] Reduced orderbook text to text-2xs for density

## Phase 1: Layout Integrity (remaining)
These are things that are still slightly off and would be caught by pixel-level inspection:

1. **Orderbook column header truncation at narrow widths** — At 20% panel width, "Size(USDC)" truncates to "Size(U...". Consider abbreviating to just "Size" / "Total" at narrow widths, or using a responsive approach.

2. **Two Button APIs coexist** — `@/components/ui/button.tsx` (radix-based, uses `variant/size/tone`) and `@hypeterminal/ui/button.tsx` (base-ui, uses `variant/intent/size`). Components import from both inconsistently. Need to converge on one API.

3. **Dialog systems coexist** — `@/components/ui/dialog.tsx` (radix) and `@hypeterminal/ui/modal.tsx` (base-ui). Some dialogs use one, some the other. Need to converge.

## Phase 2: Visual Hierarchy & Typography
4. **Stat block hierarchy** — Market info bar stats (price, 24h change, OI, volume, funding) should have clear label/value weight differentiation: labels in text-text-weak, values in text-text-strong with appropriate font-medium.

5. **Font size consistency audit** — Ensure all data tables use tabular-nums, all small labels use text-2xs or text-xs consistently, and the small text rule (8-10px use text-text-950, 11-13px use text-text-600+) is followed.

6. **Panel border consistency** — Some panels use `border-stroke-weak/40`, others `border-stroke-weak/60`, others just `border-stroke-weak`. Standardize.

## Phase 3: Component Polish
7. **Segmented controls styling** — The Order Book / Trades toggle and Perps/Spot toggle should have consistent height, padding, and active state styling.

8. **Input fields** — Verify all number inputs (size, price, leverage) have consistent height, border radius, and focus states using the @hypeterminal/ui design tokens.

9. **Toast/notification styling** — Verify order toasts use @hypeterminal/ui AlertGlobal component with proper tone colors.

10. **Mobile responsive** — All mobile components were also migrated; need visual audit on mobile viewport.
