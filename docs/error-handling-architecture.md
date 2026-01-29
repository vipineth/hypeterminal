# Error Handling Architecture

## Overview

This document tracks our research and design for a more robust, configurable error management system.

---

## Current State Analysis

### Error Categories Found

| Category | Examples | Current Location |
|----------|----------|------------------|
| **Connection** | Not connected, Loading wallet | `use-order-validation.ts` |
| **Balance** | No balance, Insufficient balance | `use-order-validation.ts`, `use-deposit.ts` |
| **Market** | No market, Market not ready, No mark price | `use-order-validation.ts` |
| **Order Input** | Enter limit price, Enter size, Min order $10 | `use-order-validation.ts` |
| **TP/SL** | TP must be above entry, SL must be below entry | `use-order-validation.ts`, `tpsl.ts` |
| **Trigger Orders** | Stop trigger must be above mark | `use-order-validation.ts` |
| **Scale Orders** | Enter price range, Scale levels must be 2-100 | `use-order-validation.ts` |
| **TWAP** | TWAP minutes must be 1-10080 | `use-order-validation.ts` |
| **Deposits** | Minimum deposit is 5 USDC | `use-deposit.ts` |
| **Withdrawals** | Minimum withdrawal is $100 | `deposit-modal.tsx` |
| **Transactions** | Transaction rejected, Insufficient gas | `transfer/errors.ts` |
| **System** | Signer not ready, Something went wrong | Various |

### Current Problems

1. **Scattered Logic**: Validation spread across multiple files
2. **Inconsistent Patterns**: Different validation approaches in different places
3. **Hard to Reuse**: Same validations duplicated (e.g., balance checks)
4. **No Prioritization**: All errors shown equally, no severity levels
5. **Tight Coupling**: Validation logic embedded in hooks
6. **No Composability**: Can't easily create validation "stacks" for different contexts

### Current Validation Flow

```
useOrderValidation hook
├── Connection checks (isConnected, isWalletLoading)
├── Agent approval check
├── Balance check (availableBalance <= 0)
├── Market checks (hasMarket, hasAssetIndex)
├── Trading readiness (isReadyToTrade, markPx)
├── Order input validations (price, size, notional)
├── TP/SL validations
├── Order type specific (scale, twap, trigger)
└── Returns { valid, errors[], canSubmit, needsApproval }
```

### Current Error Display Methods

| Method | Used For | Component |
|--------|----------|-----------|
| Inline text list | Order validation errors | `order-entry/` |
| Toast notifications | Transaction status | `order-toast.tsx`, Sonner |
| Red border + text | Form field errors | Input components |
| Full screen modal | Critical errors (deposit fail) | `deposit-modal.tsx` |
| Dialog | Wrong network, wallet issues | Various dialogs |

---

## Files to Reference

### Core Error Utilities
- `src/lib/errors.ts` - `formatErrorForDisplay()`
- `src/lib/transfer/errors.ts` - `formatTransferError()`
- `src/lib/hyperliquid/errors.ts` - Provider/Transport/Wallet errors

### Validation Logic
- `src/lib/trade/use-order-validation.ts` - Main validation hook
- `src/lib/trade/tpsl.ts` - TP/SL validation helpers
- `src/lib/trade/numbers.ts` - Number validation helpers
- `src/lib/hyperliquid/use-deposit.ts` - Deposit validation

### Constants
- `src/config/constants.ts` - ORDER_MIN_NOTIONAL_USD, SCALE_LEVELS_*, TWAP_MINUTES_*
- `src/config/contracts.ts` - MIN_DEPOSIT_USDC, MIN_WITHDRAW_USD

### Localization
- `src/locales/en/messages.po` - All error message strings

---

## Proposed Architecture

### Core Concepts

#### 1. Error Definition

```typescript
interface ErrorDefinition {
  id: string;                    // Unique identifier
  code: string;                  // Machine-readable code
  message: string | ((ctx: ErrorContext) => string);
  severity: 'error' | 'warning' | 'info';
  category: ErrorCategory;
  priority: number;              // Lower = higher priority (shown first)
}

type ErrorCategory =
  | 'connection'
  | 'balance'
  | 'market'
  | 'input'
  | 'tpsl'
  | 'trigger'
  | 'scale'
  | 'twap'
  | 'deposit'
  | 'withdraw'
  | 'transaction'
  | 'system';
```

#### 2. Validator Definition

```typescript
interface Validator<TContext> {
  id: string;
  error: ErrorDefinition;
  validate: (ctx: TContext) => boolean;  // true = valid, false = error
  dependencies?: string[];               // Other validator IDs that must pass first
}
```

#### 3. Validation Stack

```typescript
interface ValidationStack<TContext> {
  name: string;
  validators: Validator<TContext>[];

  validate(ctx: TContext): ValidationResult;
  getFirstError(ctx: TContext): ErrorDefinition | null;
  getAllErrors(ctx: TContext): ErrorDefinition[];
}
```

#### 4. Pre-built Stacks

```typescript
// Base validators that apply everywhere
const baseValidators = [
  walletConnectedValidator,
  walletLoadingValidator,
];

// Perp-specific stack
const perpOrderValidators = createValidationStack('perp-order', [
  ...baseValidators,
  hasBalanceValidator,
  hasMarketValidator,
  marketReadyValidator,
  hasPriceValidator,
  minNotionalValidator,
  maxSizeValidator,
]);

// Spot-specific stack
const spotOrderValidators = createValidationStack('spot-order', [
  ...baseValidators,
  hasBalanceValidator,
  hasMarketValidator,
  // Different min notional for spot?
]);

// Deposit stack
const depositValidators = createValidationStack('deposit', [
  ...baseValidators,
  minDepositValidator,
  maxDepositValidator,
  sufficientWalletBalanceValidator,
]);
```

### Directory Structure

```
src/lib/errors/
├── index.ts                 # Public exports
├── types.ts                 # Error types and interfaces
├── definitions/
│   ├── index.ts
│   ├── connection.ts        # Connection-related errors
│   ├── balance.ts           # Balance-related errors
│   ├── market.ts            # Market-related errors
│   ├── order-input.ts       # Order input errors
│   ├── tpsl.ts              # TP/SL errors
│   ├── trigger.ts           # Trigger order errors
│   ├── scale.ts             # Scale order errors
│   ├── twap.ts              # TWAP errors
│   ├── deposit.ts           # Deposit errors
│   ├── withdraw.ts          # Withdrawal errors
│   └── transaction.ts       # Transaction errors
├── validators/
│   ├── index.ts
│   ├── connection.ts        # Connection validators
│   ├── balance.ts           # Balance validators
│   ├── market.ts            # Market validators
│   ├── order.ts             # Order validators
│   └── transfer.ts          # Deposit/withdraw validators
├── stacks/
│   ├── index.ts
│   ├── perp-order.ts        # Perp order validation stack
│   ├── spot-order.ts        # Spot order validation stack
│   ├── deposit.ts           # Deposit validation stack
│   └── withdraw.ts          # Withdraw validation stack
├── hooks/
│   ├── use-validation.ts    # Generic validation hook
│   └── use-order-errors.ts  # Order-specific hook
└── utils/
    ├── format.ts            # Error formatting utilities
    └── priority.ts          # Priority/sorting utilities
```

### Usage Examples

#### Basic Usage

```typescript
// In a component
const { errors, isValid, canSubmit } = useValidation(perpOrderStack, {
  isConnected,
  balance,
  market,
  size,
  price,
  // ...
});

// errors is an array of ErrorDefinition objects
// Can filter by severity, category, etc.
```

#### Custom Stack

```typescript
// Create a custom stack for a specific use case
const myCustomStack = createValidationStack('custom', [
  walletConnectedValidator,
  hasBalanceValidator,
  // Add custom validator
  createValidator({
    id: 'my-custom-check',
    error: {
      id: 'my-custom-error',
      code: 'CUSTOM_ERROR',
      message: 'Custom validation failed',
      severity: 'error',
      category: 'input',
      priority: 50,
    },
    validate: (ctx) => ctx.someValue > 0,
  }),
]);
```

#### Conditional Validators

```typescript
// Validators can be conditionally included
const orderStack = createValidationStack('order', [
  ...baseValidators,
  ...orderInputValidators,
  // Only include TP/SL validators if enabled
  ...(tpSlEnabled ? tpSlValidators : []),
  // Only include scale validators for scale orders
  ...(isScaleOrder ? scaleValidators : []),
]);
```

---

## Migration Strategy

### Phase 1: Create Error Definitions
- Extract all error messages into centralized definitions
- Add error codes and categories
- Maintain backward compatibility with existing strings

### Phase 2: Create Validators
- Convert existing validation logic to validator format
- Keep existing hooks working during transition
- Add tests for each validator

### Phase 3: Create Stacks
- Build pre-configured stacks for common use cases
- Create hooks that use the new system
- Document stack composition

### Phase 4: Migrate Components
- Update components to use new validation hooks
- Remove old scattered validation logic
- Ensure all error displays work with new system

### Phase 5: Cleanup
- Remove deprecated validation code
- Update documentation
- Add developer guide for creating new validators

---

## Open Questions

1. **Error Priority**: Should we show all errors or just the highest priority one?
2. **Async Validators**: Do we need support for async validation (API checks)?
3. **Field-Level vs Form-Level**: How to handle both inline field errors and form-level errors?
4. **Error Recovery**: Should errors include recovery hints/actions?
5. **Telemetry**: Should we track which errors users encounter most?

---

## Notes & Decisions

_Add notes here as we iterate on the design_

- [ ] Decision needed: Single error vs multiple errors display
- [ ] Decision needed: Error codes format (e.g., `ERR_BALANCE_001`)
- [ ] Decision needed: How to handle localization with the new system

---

## Implementation Status

### Completed ✅

**Core Types** (`src/lib/errors/types.ts`)
- `ErrorDefinition` - Base error structure with id, code, severity, category, priority
- `ValidationError` - Error with message attached
- `Validator<TContext>` - Generic validator interface
- `createValidator()` - Helper to create validators
- `runValidators()` - Execute validators and collect errors
- `getFirstError()` - Get highest priority error

**Error Definitions** (`src/lib/errors/definitions/`)
- `connection.ts` - Wallet not connected, loading, signer not ready
- `balance.ts` - No balance
- `market.ts` - No market, market not ready, no mark price
- `order-input.ts` - Enter price/size, min notional, max size
- `tpsl.ts` - TP/SL price validation
- `trigger.ts` - Stop/TP trigger vs mark price
- `scale.ts` - Scale order validations
- `twap.ts` - TWAP duration validation
- `deposit.ts` - Deposit/withdraw min amounts and balance checks

**Validation Stacks** (`src/lib/errors/stacks/`)
- `perp-order.ts` - Full perp order validation stack
- `deposit.ts` - Deposit validation stack
- `withdraw.ts` - Withdraw validation stack

**React Hooks** (`src/lib/errors/hooks/`)
- `use-perp-order-validation.ts` - Drop-in replacement for existing hook

### Error Codes Format

| Category | Code Format | Example |
|----------|-------------|---------|
| Connection | `CONN_XXX` | `CONN_001` |
| Balance | `BAL_XXX` | `BAL_001` |
| Market | `MKT_XXX` | `MKT_001` |
| Input | `INP_XXX` | `INP_001` |
| TP/SL | `TPSL_XXX` | `TPSL_001` |
| Trigger | `TRG_XXX` | `TRG_001` |
| Scale | `SCL_XXX` | `SCL_001` |
| TWAP | `TWAP_XXX` | `TWAP_001` |
| Deposit | `DEP_XXX` | `DEP_001` |
| Withdraw | `WDR_XXX` | `WDR_001` |

### Priority Ranges

| Range | Category |
|-------|----------|
| 10-29 | Connection (highest priority - blocking) |
| 30-39 | Balance |
| 40-49 | Market |
| 50-69 | System (signer, mark price) |
| 100-199 | Order Input |
| 200-299 | TP/SL |
| 300-399 | Trigger |
| 400-499 | Scale |
| 500-599 | TWAP |

### Pending Tasks

- [ ] Migrate existing `use-order-validation.ts` to use new system
- [ ] Add spot order validation stack
- [ ] Add transaction error handling
- [ ] Create visual error display components
- [ ] Add telemetry for error tracking

---

## References

- Current validation hook: `src/lib/trade/use-order-validation.ts`
- Error formatting: `src/lib/errors.ts`
- Localization: `src/locales/en/messages.po`
- **New error system**: `src/lib/errors/`
