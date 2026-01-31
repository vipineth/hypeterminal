# Codebase Review - HyperTerminal

## Overview
Systematic review of `/src/` folder to identify:
- Dead/unused code
- Code improvements
- Refactoring opportunities

## Folders Reviewed
- [x] config
- [x] types
- [x] stores
- [x] hooks
- [x] lib
- [x] domain
- [x] providers
- [x] routes
- [x] components
- [x] locales

---

## Review Progress

---

## 1. config/ Folder

### Files Reviewed
- `hyperliquid.ts` - ✅ Clean, both exports used
- `wagmi.ts` - ⚠️ See issues below
- `contracts.ts` - ⚠️ See issues below
- `constants.ts` - ⚠️ Large file, some potential improvements
- `abi/bridge2.ts` - ✅ Clean

### Issues Found

#### 1.1 Duplicate `ARBITRUM_CHAIN_ID`
**Location:** `contracts.ts:3` and `constants.ts:19`
**Issue:** Same constant defined in two places
**Suggestion:** Keep only in `contracts.ts` (more logical location), update imports in:
- `src/components/trade/mobile/mobile-trade-view.tsx`
- `src/lib/trade/use-button-content.ts`
- `src/lib/hyperliquid/use-deposit.ts`

#### 1.2 Unused `arbitrumSepolia` contracts
**Location:** `contracts.ts:13-15`
**Issue:** Testnet contracts defined but never used in codebase
**Suggestion:** Remove or add feature flag for testnet support

#### 1.3 `createWagmiConfig` not exported/used externally
**Location:** `wagmi.ts:21`
**Issue:** Function is only used internally to create `config`
**Suggestion:** Make it a private function or remove if not needed for testing

#### 1.4 Chart constants re-exported with renamed aliases
**Location:** `components/trade/chart/constants.ts`
**Issue:** Re-exports chart constants from `config/constants.ts` with different names (e.g., `CHART_DEFAULT_SYMBOL` → `DEFAULT_CHART_SYMBOL`)
**Suggestion:** Use consistent naming - either use the original names or move chart-specific constants to `chart/constants.ts` directly

### Improvements

#### 1.5 Consider splitting `constants.ts`
**Issue:** File is 572 lines with mixed concerns (SEO, UI text, chart config, order settings)
**Suggestion:** Split into:
- `config/seo.ts` - SEO constants
- `config/ui-text.ts` - UI_TEXT object
- `config/chart.ts` - Chart-related constants
- `config/trading.ts` - Trading-related constants

---

## 2. types/ Folder

### Files Reviewed
- `hyperliquid.ts` - ⚠️ Potential unused types
- `lingui.d.ts` - ✅ Clean, needed for .po imports
- `charting_library.d.ts` - ✅ Generated file for TradingView

### Issues Found

#### 2.1 Unused `PerpAssetCtxs` type
**Location:** `hyperliquid.ts:8`
**Issue:** `PerpAssetCtxs` (plural) is defined but only referenced within the same file
**Suggestion:** Remove if not needed, or verify if it should be exported

#### 2.2 Unused `PerpAssetCtx` type
**Location:** `hyperliquid.ts:7`
**Issue:** Only referenced in documentation files, not in actual code
**Suggestion:** Verify usage or remove

### Summary
The types folder is relatively clean. The `charting_library.d.ts` is a generated file and should not be modified.

---

## 3. stores/ Folder

### Files Reviewed
- `use-market-store.ts` - ✅ Clean
- `use-order-entry-store.ts` - ⚠️ Unused exports
- `use-global-settings-store.ts` - ✅ Clean
- `use-order-queue-store.ts` - ✅ Clean
- `use-orderbook-actions-store.ts` - ✅ Clean
- `use-global-modal-store.ts` - ⚠️ Unused export
- `validated-storage.ts` - ✅ Clean utility

### Issues Found

#### 3.1 Unused `useGlobalModal` export
**Location:** `use-global-modal-store.ts:56`
**Issue:** `useGlobalModal()` returns the raw modal state but is never imported elsewhere. Components use specific hooks like `useDepositModalOpen`, `useSettingsDialogOpen`, etc.
**Suggestion:** Remove if not needed, or document why it exists

#### 3.2 Unused `getOrderEntryState` function
**Location:** `use-order-entry-store.ts:189`
**Issue:** Exported function to get state outside React, but never used
**Suggestion:** Remove if not needed

#### 3.3 Unused type exports
**Location:** `use-order-entry-store.ts:211`
**Issue:** `FormState` and `PersistedState` types are exported but not imported elsewhere
**Suggestion:** Remove exports or use them

### Summary
Stores folder is well-structured with good patterns (validated storage, separate action objects). Minor cleanup of unused exports recommended.

---

## 4. hooks/ Folder

### Files Reviewed
- `use-mobile.ts` - ⚠️ Multiple unused exports
- `ui/use-copy-to-clipboard.ts` - ✅ Clean
- `ui/use-virtual-table.ts` - ✅ Clean
- `trade/use-persistent-layout.ts` - ✅ Clean
- `trade/use-asset-leverage.ts` - ✅ Clean, well-structured
- `trade/use-account-balances.ts` - ✅ Clean
- `trade/use-order-entry-data.ts` - ✅ Clean

### Issues Found

#### 4.1 Unused `useMobileContext` hook
**Location:** `use-mobile.ts:23`
**Issue:** Comprehensive mobile context hook that is never used in the codebase
**Suggestion:** Remove

#### 4.2 Unused `usePrefersReducedMotion` hook
**Location:** `use-mobile.ts:66`
**Issue:** Hook for detecting reduced motion preference, never used
**Suggestion:** Remove

#### 4.3 Unused `useVirtualKeyboardVisible` hook
**Location:** `use-mobile.ts:98`
**Issue:** Hook for detecting mobile keyboard visibility, never used
**Suggestion:** Remove

### Improvements

#### 4.4 Console.error in `use-copy-to-clipboard.ts`
**Location:** `use-copy-to-clipboard.ts:21`
**Issue:** `console.error` left in production code
**Suggestion:** Remove or use proper error handling

### Summary
Hooks in `src/hooks/` can be removed if unused. Note: Hooks in `src/lib/hyperliquid/hooks/` should be kept regardless of usage.

---

## 5. lib/ Folder

### Files Reviewed (Key utilities)
- `cn.ts` - ✅ Clean
- `errors.ts` - ✅ Clean
- `format.ts` - ✅ Clean, well-designed formatters
- `i18n.ts` - ⚠️ Unused export
- `seo.ts` - ✅ Clean
- `explorer.ts` - ⚠️ Unused exports
- `hyperliquid/explorer.ts` - ⚠️ Unused export
- `circular-buffer/` - ✅ Clean
- `trade/` - ✅ Clean

### Issues Found

#### 5.1 Unused `isLocaleValid` function
**Location:** `i18n.ts:66`
**Issue:** Type guard function is defined but never used
**Suggestion:** Remove if not needed

#### 5.2 Unused `getExplorerAddressUrl` (both files)
**Location:** `lib/explorer.ts:20` and `lib/hyperliquid/explorer.ts:15`
**Issue:** Function to get address explorer URL is never used in either file
**Suggestion:** Remove or integrate if planning to link to addresses

#### 5.3 Unused `getExplorerBlockUrl`
**Location:** `lib/explorer.ts:28`
**Issue:** Function to get block explorer URL is never used
**Suggestion:** Remove if not needed

#### 5.4 Two separate explorer utility files
**Location:** `lib/explorer.ts` and `lib/hyperliquid/explorer.ts`
**Issue:** Two files with similar purpose but for different chains (Arbitrum vs Hyperliquid)
**Suggestion:** Consider consolidating into one file with chain parameter, or clearly document the distinction

### Summary
The lib folder is large but well-organized. Main utilities (format, errors, i18n, cn) are clean and well-used. A few explorer-related functions are unused and could be cleaned up.

**Note:** All hooks in `lib/hyperliquid/hooks/` should be **KEPT** regardless of current usage - these are SDK hooks that may be needed for future features.

---

## 6. domain/ Folder

### Files Reviewed
- `market/index.ts` - ✅ Clean barrel export
- `market/types.ts` - ✅ Clean
- `market/calculations.ts` - ✅ Clean
- `market/display.ts` - ✅ Clean
- `market/tokens.tsx` - ✅ Clean
- `trade/balances.ts` - ✅ Clean
- `trade/orders.ts` - ⚠️ Unused export
- `trade/swap.ts` - ✅ Clean
- `trade/order-entry-calcs.ts` - ✅ Clean
- `trade/order/` - ✅ Clean

### Issues Found

#### 6.1 Unused `extractResponseError` function
**Location:** `domain/trade/orders.ts:233`
**Issue:** Function is defined but only `throwIfResponseError` and `throwIfAnyResponseError` are used
**Suggestion:** Remove `extractResponseError` if not needed externally, or keep as internal helper

### Summary
Domain folder is well-organized with clear separation of concerns. Clean domain logic with good type definitions. Only minor unused export found.

---

## 7. providers/ Folder

### Files Reviewed
- `root.tsx` - ✅ Clean
- `theme.tsx` - ✅ Clean
- `perf-panel.tsx` - ✅ Clean

### Issues Found
None - providers are well-structured and all exports are used.

### Summary
Clean provider setup with proper context patterns.

---

## 8. routes/ Folder

### Files Reviewed
- `__root.tsx` - ✅ Clean
- `index.tsx` - ✅ Clean
- `$.tsx` - ✅ Clean (catch-all for 404)

### Issues Found
None - routes are minimal and clean.

### Summary
Routes folder uses TanStack Router properly with SEO head configuration.

---

## 9. components/ Folder

### Subfolders Reviewed
- `ui/` - ⚠️ Multiple unused components
- `icons/` - ✅ Clean (used via wallet-utils)
- `pages/` - ✅ Clean
- `performance/` - ✅ Clean
- `trade/` - ⚠️ One unused component

### Issues Found - Unused UI Components

The following UI components are never imported anywhere in the codebase:

#### 9.1 `ui/chart.tsx`
**Issue:** Chart component is never used
**Suggestion:** Remove or integrate into charting features

#### 9.2 `ui/context-menu.tsx`
**Issue:** Context menu component is never used
**Suggestion:** Remove or integrate where right-click menus are needed

#### 9.3 `ui/alert-dialog.tsx`
**Issue:** Alert dialog component is never used
**Suggestion:** Remove or use for confirmations

#### 9.4 `ui/alert.tsx`
**Issue:** Alert component is never used
**Suggestion:** Remove or use for notifications/warnings

#### 9.5 `ui/form.tsx`
**Issue:** Form components are never used
**Suggestion:** Remove or integrate into form-heavy sections

#### 9.6 `ui/collapsible.tsx`
**Issue:** Collapsible component is never used
**Suggestion:** Remove or integrate into accordion-style UI

#### 9.7 `ui/toggle-group.tsx`
**Issue:** Only used internally by toggle.tsx, not by other components
**Suggestion:** Consider if external export is needed

#### 9.8 `ui/radio-group.tsx`
**Issue:** Radio group component is never used
**Suggestion:** Remove or integrate where single-selection is needed

#### 9.9 `ui/card.tsx`
**Issue:** Card component is never used
**Suggestion:** Remove or integrate into layout

#### 9.10 `ui/item.tsx`
**Issue:** Item component is never used
**Suggestion:** Remove

#### 9.11 `ui/command.tsx`
**Issue:** Command palette component is never used
**Suggestion:** Remove or integrate for keyboard shortcuts

#### 9.12 `ui/flash.tsx`
**Issue:** Flash animation component is never used
**Suggestion:** Remove or integrate for price change animations

### Issues Found - Unused Trade Components

#### 9.13 `trade/components/token-avatar.tsx`
**Issue:** Token avatar component is never imported
**Suggestion:** Remove or integrate into token displays

### Summary
The components folder has significant dead code in the UI library. 12+ UI components appear to be unused. These are likely shadcn/ui components that were installed but never integrated. Consider removing unused components to reduce bundle size and maintenance overhead.

---

## 10. locales/ Folder

### Files Reviewed
- 6 language folders (en, es, fr, zh, ar, hi) each containing:
  - `messages.js` - Compiled translations
  - `messages.po` - Source translations

### Issues Found
None - locales are properly set up and used via @lingui/core.

### Summary
i18n setup is clean with proper language support.

---

## Summary of All Findings

### Dead Code to Remove

| Location | Item | Type |
|----------|------|------|
| `config/contracts.ts` | `arbitrumSepolia` | Unused testnet config |
| `config/constants.ts` | Duplicate `ARBITRUM_CHAIN_ID` | Duplicate constant |
| `types/hyperliquid.ts` | `PerpAssetCtx`, `PerpAssetCtxs` | Unused types |
| `stores/use-order-entry-store.ts` | `getOrderEntryState`, `FormState`, `PersistedState` | Unused exports |
| `stores/use-global-modal-store.ts` | `useGlobalModal` | Unused export |
| `hooks/use-mobile.ts` | `useMobileContext`, `usePrefersReducedMotion`, `useVirtualKeyboardVisible` | Unused hooks - remove |
| `lib/i18n.ts` | `isLocaleValid` | Unused function |
| `lib/explorer.ts` | `getExplorerAddressUrl`, `getExplorerBlockUrl` | Unused functions |
| `lib/hyperliquid/explorer.ts` | `getExplorerAddressUrl` | Unused function |
| `domain/trade/orders.ts` | `extractResponseError` | Unused function |
| `components/ui/` | 12 components | Unused UI components |
| `components/trade/components/token-avatar.tsx` | Entire file | Unused component |

### Improvements to Consider

1. **Split `config/constants.ts`** into smaller, focused files
2. **Consolidate explorer utilities** into a single file
3. **Remove unused UI components** to reduce bundle size
4. **Remove `console.error`** from `use-copy-to-clipboard.ts`
5. **Consistent naming** for chart constants (avoid re-exports with different names)

### Overall Assessment

The codebase is **well-organized** with clear separation of concerns. The main issues are:
- ~20 unused exports/functions across various files
- ~12 unused UI components from the design system
- Minor duplication in config files

The unused code represents about **5-10% of the codebase** and can be safely removed to improve maintainability.

---

*Review completed on 2026-01-30*
