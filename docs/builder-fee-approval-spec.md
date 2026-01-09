# Builder Fee Approval Feature Specification

## Overview

Extend the agent registration flow to include builder fee approval as a prerequisite step when builder configuration is enabled. The flow becomes: **ApproveBuilderFee → ApproveAgent** (sequential, with auto-skip for already-approved steps).

## Background

When builder fees are configured in `HyperliquidProvider`, users must approve two blockchain transactions before trading:

1. **ApproveBuilderFee** - One-time approval for the builder to charge fees on orders
2. **ApproveAgent** - One-time approval for the locally-generated agent key to sign transactions

Both approvals are verified on-chain and persist across sessions.

## Technical Design

### Fee Rate Conversion

The `BuilderConfig.f` value is in 0.1 basis points:
- `f: 1` = 0.0001%
- `f: 10` = 0.001%
- `f: 100` = 0.01%
- `f: 1000` = 0.1% (max for perps)

**Conversion formula:**
```typescript
const maxFeeRatePercent = (builderConfig.f / 10000) * 100;
// e.g., f: 1 → 0.0001 → "0.0001%"
```

### Approval Status Checks

Use existing info hooks to verify approval status:

**Builder Fee Approval Check:**
```typescript
const { data: maxBuilderFee } = useInfoMaxBuilderFee(
  { user: address, builder: builderConfig.b },
  { enabled: !!address && !!builderConfig?.b }
);

// Approved if maxBuilderFee >= required fee
const isBuilderFeeApproved = maxBuilderFee !== undefined && maxBuilderFee >= builderConfig.f;
```

**Agent Approval Check (existing):**
```typescript
const { data: extraAgents } = useInfoExtraAgents({ user: address });
const isAgentApproved = isAgentApproved(extraAgents, agentWallet?.publicKey);
```

### Modified `useAgentRegistration` Hook

#### New Behavior

1. **Auto-skip logic**: Check both `maxBuilderFee` and `extraAgents` to determine which approvals are needed
2. **Sequential execution**: If builder config exists and fee not approved, approve builder fee first, then agent
3. **Resumable**: Calling `register()` multiple times only performs pending approvals
4. **Source of truth**: On-chain state via info hooks determines what's approved

#### Updated Status Flow

```
AgentStatus: 'loading' | 'no_agent' | 'needs_builder_fee' | 'valid' | 'invalid'
                                      ↑ new state
```

- `needs_builder_fee`: Builder config exists, builder fee not approved (regardless of agent state)
- `no_agent`: Builder fee approved (or no builder config), but agent not registered
- `valid`: Both approvals complete (or agent approved when no builder config)

#### Hook Return Type (unchanged interface)

```typescript
interface UseAgentRegistrationResult {
  status: AgentStatus;
  registerStatus: AgentRegisterStatus;
  agentWallet: AgentWallet | null;
  signer: ReturnType<typeof privateKeyToAccount> | null;
  register: () => Promise<`0x${string}`>;
  reset: () => void;
  error: Error | null;
  isReady: boolean;
}
```

**Note:** Individual approval states (`builderFeeApproved`, `agentApproved`) are managed internally, not exposed.

#### Register Flow

```typescript
async function register(): Promise<`0x${string}`> {
  // 1. Check if builder fee approval needed
  if (builderConfig?.b && !isBuilderFeeApproved) {
    setRegisterStatus('signing');
    await exchangeClient.approveBuilderFee({
      builder: builderConfig.b,
      maxFeeRate: convertFeeToPercentageString(builderConfig.f)
    });

    setRegisterStatus('verifying');
    await queryClient.invalidateQueries({
      queryKey: infoKeys.method('maxBuilderFee', { user: address, builder: builderConfig.b })
    });
  }

  // 2. Check if agent approval needed (re-evaluate after potential builder fee)
  if (!isAgentApprovedOnChain) {
    setRegisterStatus('signing');

    // Generate new agent if needed
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    setAgent(env, address, privateKey, account.address);

    await exchangeClient.approveAgent({
      agentAddress: account.address,
      agentName
    });

    setRegisterStatus('verifying');
    await queryClient.invalidateQueries({
      queryKey: infoKeys.method('extraAgents', { user: address })
    });
  }

  setRegisterStatus('idle');
  return agentWallet.publicKey;
}
```

### Utility Function

Add to `src/lib/hyperliquid/utils/agent.ts`:

```typescript
export function isBuilderFeeApproved(
  maxBuilderFee: number | undefined,
  requiredFee: number | undefined
): boolean {
  if (maxBuilderFee === undefined || requiredFee === undefined) return false;
  return maxBuilderFee >= requiredFee;
}

export function convertFeeToPercentageString(fee: number): string {
  // f is in 0.1 bps, convert to percentage string
  const percentage = (fee / 10000) * 100;
  return `${percentage}%`;
}
```

### Query Configuration

**Builder fee query:**
```typescript
useInfoMaxBuilderFee(
  { user: address, builder: builderConfig.b },
  {
    enabled: !!address && !!builderConfig?.b,
    staleTime: 5_000,
    // No refetchInterval - on-demand only
  }
);
```

**Agent query (unchanged):**
```typescript
useInfoExtraAgents(
  { user: address },
  { enabled: !!address, staleTime: 5_000, refetchInterval: 30_000 }
);
```

### TradingStatus (unchanged)

Keep `TradingStatus` simple with single `'needs_approval'` state:

```typescript
const status: TradingStatus = !address
  ? 'no_wallet'
  : signingMode === 'agent' && !signerType
    ? 'needs_approval'  // Covers both builder fee and agent approval needs
    : !exchange
      ? 'no_signer'
      : 'ready';
```

### Conditional Behavior

| Builder Config | Builder Fee Approved | Agent Approved | Flow |
|----------------|---------------------|----------------|------|
| Not set | N/A | No | Agent approval only |
| Not set | N/A | Yes | Ready |
| Set | No | No | Builder fee → Agent |
| Set | No | Yes | Builder fee only |
| Set | Yes | No | Agent only |
| Set | Yes | Yes | Ready |

### Error Handling

- Simple throw on failure (no step enrichment)
- Errors propagate from underlying SDK calls
- State persists on blockchain - partial success is recoverable
- Next `register()` call checks on-chain state and resumes

### UI/UX

- **Invisible progression**: Users see wallet signature popups but no step indicators
- **Two potential popups**: First for builder fee (if needed), second for agent (if needed)
- **Automatic skip**: If any step is already approved, its popup is skipped

## Files to Modify

1. **`src/lib/hyperliquid/hooks/agent/types.ts`**
   - Add `'needs_builder_fee'` to `AgentStatus` type

2. **`src/lib/hyperliquid/utils/agent.ts`**
   - Add `isBuilderFeeApproved()` function
   - Add `convertFeeToPercentageString()` function

3. **`src/lib/hyperliquid/hooks/useAgentRegistration.ts`**
   - Add `useInfoMaxBuilderFee` query
   - Update status derivation to include `'needs_builder_fee'`
   - Update `register()` to handle builder fee approval first
   - Update `isReady` to require both approvals (when builder config exists)

## Implementation Notes

- Builder address comes from `builderConfig.b` in `HyperliquidProvider` context
- No separate hooks needed - unified in existing `useAgentRegistration`
- Cache invalidation happens after each successful approval
- On-chain state is source of truth for approval status
