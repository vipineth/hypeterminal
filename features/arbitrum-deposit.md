# Feature: Deposit USDC from Arbitrum

## Meta

| Field | Value |
|-------|-------|
| Priority | High |
| Status | Planned |
| Created | 2026-01-12 |
| Updated | 2026-01-12 |

## Summary

Enable users to deposit USDC from Arbitrum directly into their Hyperliquid trading account without leaving the app. Currently users are redirected to the Hyperliquid website to deposit. This feature will integrate the Arbitrum bridge directly, allowing seamless onboarding.

## Background

### How Hyperliquid Deposits Work

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  User Wallet    │     │  Bridge2 Contract    │     │   Hyperliquid   │
│  (Arbitrum)     │     │  (Arbitrum)          │     │   (L1)          │
│                 │     │                      │     │                 │
│  USDC Balance   │────▶│  Receives USDC       │────▶│  Credits User   │
│                 │     │  Emits Deposit event │     │  Account        │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
        │                        │
        │   1. Approve USDC      │
        │   2. Transfer USDC     │
        │   (or use Permit)      │
        └────────────────────────┘
```

### Contract Addresses

| Contract | Mainnet | Testnet |
|----------|---------|---------|
| **Bridge2** | `0x2df1c51e09aecf9cacb7bc98cb1742757f163df7` | `0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89` |
| **USDC (Arbitrum)** | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` | `0x...` |

### Key Constraints

- **Minimum deposit**: 5 USDC (amounts below this are lost forever)
- **Processing time**: < 1 minute for funds to appear
- **Network**: User must be connected to Arbitrum
- **Gas**: User pays Arbitrum gas for the deposit transaction

## User Stories

- As a new user, I want to deposit USDC from my Arbitrum wallet so that I can start trading immediately
- As a trader, I want to add funds without leaving the app so that I don't miss trading opportunities
- As a user, I want to see my Arbitrum USDC balance so that I know how much I can deposit
- As a user, I want clear feedback on deposit status so that I know when my funds are available

## Requirements

### Must Have

- [ ] Display user's Arbitrum USDC balance
- [ ] Input field for deposit amount with max button
- [ ] Validate minimum deposit (5 USDC)
- [ ] Two-step transaction flow: Approve → Deposit (if needed)
- [ ] Or single-step with Permit signature (gasless approval)
- [ ] Show transaction status (pending, confirming, complete)
- [ ] Error handling for failed transactions
- [ ] Refresh Hyperliquid balance after successful deposit
- [ ] Ensure user is on Arbitrum network (prompt switch if not)

### Nice to Have

- [ ] Remember last deposit amount
- [ ] Quick amount buttons (25%, 50%, 75%, 100%)
- [ ] Estimated gas cost display
- [ ] Transaction history of deposits

### Future Enhancement: Multi-Chain Bridge via LI.FI

- [ ] Integrate LI.FI SDK for multi-chain deposits (see below)

## Tasks

1. [ ] Create `useArbitrumUSDCBalance` hook - fetch user's USDC balance on Arbitrum
2. [ ] Create `useUSDCAllowance` hook - check current allowance for Bridge2
3. [ ] Create `useApproveUSDC` hook - approve USDC spending
4. [ ] Create `useDepositUSDC` hook - call Bridge2 deposit function
5. [ ] Create `useDepositWithPermit` hook - gasless approval + deposit
6. [ ] Update `DepositModal` component with full deposit flow
7. [ ] Add Arbitrum network detection and switch prompt
8. [ ] Add transaction status tracking
9. [ ] Add balance refresh after successful deposit
10. [ ] Add minimum amount validation (5 USDC)
11. [ ] Add error handling and retry logic
12. [ ] Test on testnet before mainnet

## Technical Spec

### File: `src/config/contracts.ts` (Create)

```typescript
export const ARBITRUM_CHAIN_ID = 42161;

export const CONTRACTS = {
  arbitrum: {
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    bridge2: "0x2df1c51e09aecf9cacb7bc98cb1742757f163df7",
  },
  arbitrumSepolia: {
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Circle testnet USDC
    bridge2: "0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89",
  },
} as const;

export const USDC_DECIMALS = 6;
export const MIN_DEPOSIT_USDC = 5n * 10n ** 6n; // 5 USDC in raw units (5000000)

// USDC ABI - only functions we need
export const USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

// Bridge2 ABI - only functions we need
export const BRIDGE2_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "usd", type: "uint64" }],
    outputs: [],
  },
  {
    name: "Deposit",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "usd", type: "uint64", indexed: false },
    ],
  },
] as const;
```

### Wagmi Hooks Implementation

#### File: `src/hooks/arbitrum/use-usdc-balance.ts`

```typescript
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, USDC_ABI, USDC_DECIMALS } from "@/config/contracts";

interface Props {
  address: `0x${string}` | undefined;
  enabled?: boolean;
}

export function useUSDCBalance({ address, enabled = true }: Props) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.arbitrum.usdc,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  return {
    balance: data ? formatUnits(data, USDC_DECIMALS) : "0",
    balanceRaw: data ?? 0n,
    isLoading,
    refetch,
  };
}
```

#### File: `src/hooks/arbitrum/use-usdc-allowance.ts`

```typescript
import { useReadContract } from "wagmi";
import { CONTRACTS, USDC_ABI } from "@/config/contracts";

interface Props {
  owner: `0x${string}` | undefined;
  enabled?: boolean;
}

export function useUSDCAllowance({ owner, enabled = true }: Props) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.arbitrum.usdc,
    abi: USDC_ABI,
    functionName: "allowance",
    args: owner ? [owner, CONTRACTS.arbitrum.bridge2] : undefined,
    query: { enabled: enabled && !!owner },
  });

  return {
    allowance: data ?? 0n,
    isLoading,
    refetch,
  };
}
```

#### File: `src/hooks/arbitrum/use-approve-usdc.ts`

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, USDC_ABI } from "@/config/contracts";

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (amount: bigint) => {
    writeContract({
      address: CONTRACTS.arbitrum.usdc,
      abi: USDC_ABI,
      functionName: "approve",
      args: [CONTRACTS.arbitrum.bridge2, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
```

#### File: `src/hooks/arbitrum/use-deposit-to-hyperliquid.ts`

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, BRIDGE2_ABI } from "@/config/contracts";

export function useDepositToHyperliquid() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deposit = (amountRaw: bigint) => {
    writeContract({
      address: CONTRACTS.arbitrum.bridge2,
      abi: BRIDGE2_ABI,
      functionName: "deposit",
      args: [amountRaw],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    reset,
  };
}
```

#### File: `src/hooks/arbitrum/use-arbitrum-network.ts`

```typescript
import { useChainId, useSwitchChain } from "wagmi";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";

export function useArbitrumNetwork() {
  const chainId = useChainId();
  const { switchChain, isPending, error } = useSwitchChain();

  const isArbitrum = chainId === ARBITRUM_CHAIN_ID;

  const switchToArbitrum = () => {
    switchChain({ chainId: ARBITRUM_CHAIN_ID });
  };

  return {
    isArbitrum,
    switchToArbitrum,
    isSwitching: isPending,
    switchError: error,
  };
}
```

#### File: `src/hooks/arbitrum/use-arbitrum-deposit.ts` (Combined Flow)

```typescript
import { useState, useCallback, useEffect } from "react";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";
import { useUSDCBalance } from "./use-usdc-balance";
import { useUSDCAllowance } from "./use-usdc-allowance";
import { useApproveUSDC } from "./use-approve-usdc";
import { useDepositToHyperliquid } from "./use-deposit-to-hyperliquid";
import { useArbitrumNetwork } from "./use-arbitrum-network";
import { USDC_DECIMALS, MIN_DEPOSIT_USDC } from "@/config/contracts";

type DepositStep = "idle" | "approving" | "depositing" | "success" | "error";

export function useArbitrumDeposit() {
  const { address } = useConnection();
  const [step, setStep] = useState<DepositStep>("idle");
  const [pendingAmount, setPendingAmount] = useState<bigint>(0n);

  const { isArbitrum, switchToArbitrum, isSwitching } = useArbitrumNetwork();

  const { balance, balanceRaw, refetch: refetchBalance } = useUSDCBalance({
    address,
    enabled: isArbitrum,
  });

  const { allowance, refetch: refetchAllowance } = useUSDCAllowance({
    owner: address,
    enabled: isArbitrum,
  });

  const {
    approve,
    isPending: isApproving,
    isConfirming: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
    error: approvalError,
    reset: resetApproval,
  } = useApproveUSDC();

  const {
    deposit: executeDeposit,
    isPending: isDepositing,
    isConfirming: isDepositConfirming,
    isSuccess: isDepositSuccess,
    hash: depositHash,
    error: depositError,
    reset: resetDeposit,
  } = useDepositToHyperliquid();

  // After approval success, automatically proceed to deposit
  useEffect(() => {
    if (isApprovalSuccess && step === "approving" && pendingAmount > 0n) {
      refetchAllowance();
      setStep("depositing");
      executeDeposit(pendingAmount);
    }
  }, [isApprovalSuccess, step, pendingAmount, refetchAllowance, executeDeposit]);

  // On deposit success, update step
  useEffect(() => {
    if (isDepositSuccess && step === "depositing") {
      setStep("success");
      refetchBalance();
    }
  }, [isDepositSuccess, step, refetchBalance]);

  // On errors, update step
  useEffect(() => {
    if ((approvalError || depositError) && step !== "idle") {
      setStep("error");
    }
  }, [approvalError, depositError, step]);

  const needsApproval = useCallback(
    (amount: bigint) => allowance < amount,
    [allowance]
  );

  const validateAmount = useCallback(
    (amount: string): { valid: boolean; error: string | null } => {
      if (!amount || amount === "0") {
        return { valid: false, error: null };
      }
      try {
        const amountRaw = parseUnits(amount, USDC_DECIMALS);
        if (amountRaw < MIN_DEPOSIT_USDC) {
          return { valid: false, error: "Minimum deposit is 5 USDC" };
        }
        if (amountRaw > balanceRaw) {
          return { valid: false, error: "Insufficient balance" };
        }
        return { valid: true, error: null };
      } catch {
        return { valid: false, error: "Invalid amount" };
      }
    },
    [balanceRaw]
  );

  const startDeposit = useCallback(
    (amount: string) => {
      const amountRaw = parseUnits(amount, USDC_DECIMALS);
      setPendingAmount(amountRaw);

      if (needsApproval(amountRaw)) {
        setStep("approving");
        approve(amountRaw);
      } else {
        setStep("depositing");
        executeDeposit(amountRaw);
      }
    },
    [needsApproval, approve, executeDeposit]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setPendingAmount(0n);
    resetApproval();
    resetDeposit();
  }, [resetApproval, resetDeposit]);

  return {
    // Network
    isArbitrum,
    switchToArbitrum,
    isSwitching,

    // Balance
    balance,
    balanceRaw,

    // State
    step,
    error: approvalError || depositError,

    // Actions
    startDeposit,
    validateAmount,
    needsApproval,
    reset,
    refetchBalance,

    // Transaction status
    isApproving: isApproving || isApprovalConfirming,
    isDepositing: isDepositing || isDepositConfirming,
    isSuccess: isDepositSuccess,
    depositHash,
  };
}
```

#### File: `src/hooks/arbitrum/index.ts`

```typescript
export { useUSDCBalance } from "./use-usdc-balance";
export { useUSDCAllowance } from "./use-usdc-allowance";
export { useApproveUSDC } from "./use-approve-usdc";
export { useDepositToHyperliquid } from "./use-deposit-to-hyperliquid";
export { useArbitrumDeposit } from "./use-arbitrum-deposit";
export { useArbitrumNetwork } from "./use-arbitrum-network";
```

### Deposit Flow Options

#### Option A: Standard Approve + Deposit (Two Transactions)

```typescript
// Step 1: Check allowance
const allowance = await usdcContract.read.allowance([userAddress, bridge2Address]);

// Step 2: Approve if needed
if (allowance < depositAmount) {
  const approveTx = await usdcContract.write.approve([bridge2Address, depositAmount]);
  await waitForTransaction(approveTx);
}

// Step 3: Deposit
const depositTx = await bridge2Contract.write.deposit([depositAmountUint64]);
await waitForTransaction(depositTx);
```

#### Option B: Permit + Deposit (Single Transaction, Gasless Approval)

```typescript
// Step 1: Get permit signature (off-chain, no gas)
const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
const nonce = await usdcContract.read.nonces([userAddress]);

const permitSignature = await walletClient.signTypedData({
  domain: {
    name: "USD Coin",
    version: "2",
    chainId: 42161, // Arbitrum
    verifyingContract: USDC_ADDRESS,
  },
  types: {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  },
  primaryType: "Permit",
  message: {
    owner: userAddress,
    spender: bridge2Address,
    value: depositAmount,
    nonce,
    deadline,
  },
});

// Step 2: Split signature
const { v, r, s } = splitSignature(permitSignature);

// Step 3: Call batchedDepositWithPermit (single transaction)
const depositTx = await bridge2Contract.write.batchedDepositWithPermit([
  [{
    user: userAddress,
    usd: depositAmountUint64,
    deadline: deadline,
    signature: { v, r, s },
  }]
]);
```

### Hooks to Create

#### useArbitrumUSDCBalance

```typescript
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";

export function useArbitrumUSDCBalance(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.arbitrum.usdc,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data ? formatUnits(data, USDC_DECIMALS) : "0",
    balanceRaw: data ?? 0n,
    isLoading,
    refetch,
  };
}
```

#### useDepositUSDC

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";

export function useDepositUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = async (amount: string) => {
    const amountRaw = parseUnits(amount, USDC_DECIMALS);
    const amountUint64 = BigInt(amountRaw); // Bridge expects uint64

    writeContract({
      address: CONTRACTS.arbitrum.bridge2,
      abi: BRIDGE2_ABI,
      functionName: "deposit",
      args: [amountUint64],
    });
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
```

### State Management

```typescript
interface DepositState {
  step: "idle" | "approving" | "depositing" | "confirming" | "success" | "error";
  amount: string;
  txHash: `0x${string}` | null;
  error: Error | null;
}

// Deposit modal state machine
type DepositStep =
  | { status: "input" }                           // User entering amount
  | { status: "needs-approval"; amount: string }  // Allowance insufficient
  | { status: "approving"; txHash: string }       // Approval tx pending
  | { status: "ready"; amount: string }           // Ready to deposit
  | { status: "depositing"; txHash: string }      // Deposit tx pending
  | { status: "confirming"; txHash: string }      // Waiting for confirmations
  | { status: "success"; txHash: string }         // Complete
  | { status: "error"; error: Error };            // Failed
```

## Files

### Create

| File | Purpose |
|------|---------|
| `src/config/contracts.ts` | ABIs, addresses, constants for USDC and Bridge2 |
| `src/hooks/arbitrum/use-usdc-balance.ts` | Read USDC balance on Arbitrum |
| `src/hooks/arbitrum/use-usdc-allowance.ts` | Read allowance for Bridge2 |
| `src/hooks/arbitrum/use-approve-usdc.ts` | Approve USDC spending tx |
| `src/hooks/arbitrum/use-deposit-to-hyperliquid.ts` | Execute deposit tx |
| `src/hooks/arbitrum/use-arbitrum-network.ts` | Network check and switch |
| `src/hooks/arbitrum/use-arbitrum-deposit.ts` | Combined flow orchestrator |
| `src/hooks/arbitrum/index.ts` | Export all hooks |

### Modify

| File | Changes |
|------|---------|
| `src/components/trade/order-entry/deposit-modal.tsx` | Replace redirect with full deposit flow UI |
| `src/config/wagmi.ts` | Already configured for Arbitrum ✓ |

### Wagmi v3 Functions Used

| Hook | Package | Purpose |
|------|---------|---------|
| `useReadContract` | `wagmi` | Read contract state (balance, allowance) |
| `useWriteContract` | `wagmi` | Write transactions (approve, deposit) |
| `useWaitForTransactionReceipt` | `wagmi` | Wait for tx confirmation |
| `useChainId` | `wagmi` | Get current chain ID |
| `useSwitchChain` | `wagmi` | Switch network |
| `useConnection` | `wagmi` | Get wallet address (v3 renamed from useAccount) |

### Viem Functions Used

| Function | Package | Purpose |
|----------|---------|---------|
| `parseUnits` | `viem` | Convert "100" → 100000000n (with decimals) |
| `formatUnits` | `viem` | Convert 100000000n → "100" (with decimals) |

## UI/UX

### Components

- **DepositModal** - Main modal with deposit flow
- **AmountInput** - Input with max button and validation
- **TransactionStatus** - Shows pending/confirming/success states
- **NetworkSwitcher** - Prompts user to switch to Arbitrum if needed

### User Flow

1. User clicks "Deposit" button
2. Modal opens showing:
   - Arbitrum USDC balance
   - Amount input with max button
   - Minimum deposit notice (5 USDC)
3. User enters amount
4. System checks allowance:
   - If insufficient: Show "Approve" button first
   - If sufficient: Show "Deposit" button
5. User clicks Approve (if needed):
   - Wallet prompts for approval tx
   - Show pending state
   - On success, enable Deposit button
6. User clicks Deposit:
   - Wallet prompts for deposit tx
   - Show pending state
   - Show confirming state
7. On success:
   - Show success message with tx link
   - Refresh Hyperliquid balance
   - Auto-close after delay or user dismisses

### Visual States

```
Initial State:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│ From: Arbitrum                          │
│ Balance: 1,234.56 USDC                  │
│                                         │
│ Amount:                                 │
│ ┌─────────────────────────────┬───────┐ │
│ │ 100                         │  MAX  │ │
│ └─────────────────────────────┴───────┘ │
│                                         │
│ ⓘ Minimum deposit: 5 USDC              │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │            Deposit                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Funds arrive in < 1 minute              │
└─────────────────────────────────────────┘

Needs Approval State:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│ Step 1 of 2: Approve USDC               │
│                                         │
│ Amount: 100 USDC                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │         Approve USDC                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ This allows the bridge to transfer      │
│ USDC from your wallet.                  │
└─────────────────────────────────────────┘

Pending Transaction:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│         ◠◠◠                             │
│      Depositing...                      │
│                                         │
│ 100 USDC → Hyperliquid                  │
│                                         │
│ View on Arbiscan ↗                      │
│                                         │
└─────────────────────────────────────────┘

Success State:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│         ✓                               │
│   Deposit Successful                    │
│                                         │
│ 100 USDC deposited to Hyperliquid       │
│                                         │
│ Your funds will be available shortly.   │
│                                         │
│ View on Arbiscan ↗                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │             Done                    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

Error State:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│         ✗                               │
│   Transaction Failed                    │
│                                         │
│ User rejected the transaction           │
│                                         │
│ ┌───────────────┐ ┌───────────────────┐ │
│ │    Cancel     │ │    Try Again      │ │
│ └───────────────┘ └───────────────────┘ │
└─────────────────────────────────────────┘

Wrong Network:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│         ⚠                               │
│   Switch to Arbitrum                    │
│                                         │
│ Please switch to Arbitrum network       │
│ to deposit USDC.                        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │      Switch to Arbitrum             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Edge Cases

### Amount Validation
- **Below minimum (< 5 USDC)** → Show error, disable deposit button
- **Exceeds balance** → Show error, suggest max amount
- **Zero or empty** → Disable deposit button
- **Invalid input (negative, non-numeric)** → Show validation error

### Network Issues
- **Wrong network** → Show network switch prompt
- **Network switch rejected** → Keep prompt visible
- **Network switch fails** → Show error with manual instructions

### Transaction Issues
- **User rejects approval** → Return to input state, show message
- **User rejects deposit** → Return to ready state, show message
- **Transaction fails on-chain** → Show error with reason if available
- **Transaction stuck (no confirmation)** → Show "taking longer than expected" after 2 min

### Wallet Issues
- **Wallet disconnected during flow** → Return to connect wallet state
- **Insufficient gas** → Show "insufficient ETH for gas" error

### Bridge Issues
- **Bridge paused** → Show maintenance message (check contract `paused()`)
- **Deposit not credited** → Link to support, show tx hash for reference

## Security Considerations

- **Never store private keys** - All signing done via wallet
- **Validate addresses** - Use checksummed addresses from constants
- **Amount overflow** - Ensure amount fits in uint64 before sending
- **Permit replay** - Include deadline and use fresh nonce
- **Front-running** - Permit approach reduces approval front-run risk

## Testing Checklist

- [ ] Test on Arbitrum Sepolia testnet first
- [ ] Test minimum deposit boundary (4.99 USDC should fail, 5 USDC should work)
- [ ] Test max balance deposit
- [ ] Test approval flow (new user with 0 allowance)
- [ ] Test deposit with existing allowance
- [ ] Test permit flow if implementing
- [ ] Test transaction rejection handling
- [ ] Test network switching
- [ ] Test balance refresh after deposit
- [ ] Verify funds appear in Hyperliquid within 1 minute

## Research Notes

- Bridge2 contract source: https://github.com/hyperliquid-dex/contracts/blob/master/Bridge2.sol
- Bridge2 holds ~$4B USDC (69% of all USDC on Arbitrum)
- Hyperliquid is migrating to native USDC but Arbitrum bridge will remain supported
- Permit approach saves user one transaction but requires EIP-2612 support
- USDC on Arbitrum supports permit (EIP-2612)

## Open Questions

- [ ] Should we support permit flow or just standard approve + deposit?
- [ ] Do we need to check if bridge is paused before showing UI?
- [ ] Should we poll for deposit confirmation on Hyperliquid side?
- [ ] How to handle if deposit tx succeeds but Hyperliquid doesn't credit?
- [ ] Should we add support for other chains (Ethereum mainnet, etc.)?
- [ ] Do we want to integrate a bridge aggregator for other source chains?

## References

- [Bridge2 API Documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2)
- [Bridge2 Contract on Arbiscan](https://arbiscan.io/address/0x2df1c51e09aecf9cacb7bc98cb1742757f163df7)
- [Bridge2 Source Code](https://github.com/hyperliquid-dex/contracts/blob/master/Bridge2.sol)
- [How to start trading - Hyperliquid Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/onboarding/how-to-start-trading)

---

## Future Enhancement: Multi-Chain Deposits via LI.FI

> **Status**: Planned for future release after direct Arbitrum bridge is implemented

### Why LI.FI?

| Feature | Benefit |
|---------|---------|
| **50+ Source Chains** | Users can deposit from Ethereum, Optimism, Base, Polygon, Solana, etc. |
| **Direct HyperCore Routing** | Only aggregator with native perps balance integration |
| **Proven Track Record** | $130M+ volume on Hyperliquid via Jumper Exchange |
| **Speed** | 3-6 second transfers via intent-based bridges |
| **Route Optimization** | Automatically finds best bridge/DEX path |

### Comparison: Direct Bridge vs LI.FI

| Aspect | Direct Arbitrum Bridge | LI.FI Aggregator |
|--------|------------------------|------------------|
| Source chains | Arbitrum only | 50+ chains |
| Dependencies | None (just wagmi) | `@lifi/sdk` package |
| Fees | Gas only | Gas + ~0.25% bridge fee |
| Complexity | Simple | Medium |
| Speed | < 1 min | 3-6 seconds |
| User has USDC on | Must be Arbitrum | Any supported chain |

### Implementation Plan

#### Installation

```bash
pnpm add @lifi/sdk
```

#### File: `src/hooks/bridge/use-lifi-deposit.ts`

```typescript
import { createConfig, getQuote, executeRoute, getRoutes } from '@lifi/sdk'
import { useState, useCallback } from 'react'
import { useWalletClient, useSwitchChain } from 'wagmi'

// Chain IDs
const HYPERLIQUID_CHAIN_ID = 999 // TODO: Verify actual LI.FI chain ID for HyperCore

// Initialize LI.FI SDK
createConfig({
  integrator: 'hypeterminal',
})

interface UseLifiDepositProps {
  fromChainId: number
  fromTokenAddress: string
  amount: string
  userAddress: string
}

export function useLifiDeposit() {
  const { data: walletClient } = useWalletClient()
  const { switchChainAsync } = useSwitchChain()

  const [quote, setQuote] = useState<any>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const getDepositQuote = useCallback(async ({
    fromChainId,
    fromTokenAddress,
    amount,
    userAddress,
  }: UseLifiDepositProps) => {
    setIsQuoting(true)
    setError(null)

    try {
      const result = await getQuote({
        fromAddress: userAddress,
        fromChain: fromChainId,
        toChain: HYPERLIQUID_CHAIN_ID,
        fromToken: fromTokenAddress,
        toToken: 'USDC', // Native USDC on HyperCore
        fromAmount: amount,
      })

      setQuote(result)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsQuoting(false)
    }
  }, [])

  const executeDeposit = useCallback(async () => {
    if (!quote || !walletClient) return

    setIsExecuting(true)
    setError(null)

    try {
      const result = await executeRoute(quote, {
        updateRouteHook: (updatedRoute) => {
          // Track transaction hash when available
          const step = updatedRoute.steps[0]
          if (step?.execution?.process?.[0]?.txHash) {
            setTxHash(step.execution.process[0].txHash)
          }
        },
        switchChainHook: async (chainId) => {
          await switchChainAsync({ chainId })
          return walletClient
        },
      })

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setIsExecuting(false)
    }
  }, [quote, walletClient, switchChainAsync])

  const reset = useCallback(() => {
    setQuote(null)
    setError(null)
    setTxHash(null)
  }, [])

  return {
    // Quote
    quote,
    getDepositQuote,
    isQuoting,

    // Execution
    executeDeposit,
    isExecuting,
    txHash,

    // State
    error,
    reset,

    // Derived
    estimatedOutput: quote?.estimate?.toAmount,
    estimatedTime: quote?.estimate?.executionDuration,
    fees: quote?.estimate?.feeCosts,
  }
}
```

#### File: `src/config/supported-chains.ts`

```typescript
// Chains users can deposit from via LI.FI
export const DEPOSIT_SOURCE_CHAINS = [
  { id: 1, name: 'Ethereum', icon: 'eth' },
  { id: 42161, name: 'Arbitrum', icon: 'arb' },
  { id: 10, name: 'Optimism', icon: 'op' },
  { id: 8453, name: 'Base', icon: 'base' },
  { id: 137, name: 'Polygon', icon: 'polygon' },
  { id: 56, name: 'BNB Chain', icon: 'bnb' },
  { id: 43114, name: 'Avalanche', icon: 'avax' },
] as const

// Common USDC addresses per chain
export const USDC_ADDRESSES: Record<number, string> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',      // Ethereum
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',  // Arbitrum
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',     // Optimism
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',   // Base
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',    // Polygon
  56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',     // BNB Chain
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',  // Avalanche
}
```

#### Updated Deposit Modal UI (Future)

```
Multi-Chain Deposit Modal:
┌─────────────────────────────────────────┐
│ Deposit USDC                        [X] │
├─────────────────────────────────────────┤
│                                         │
│ From:                                   │
│ ┌─────────────────────────────────────┐ │
│ │ [◉] Arbitrum          ▼            │ │  ← Chain selector
│ └─────────────────────────────────────┘ │
│                                         │
│ Balance: 1,234.56 USDC                  │
│                                         │
│ Amount:                                 │
│ ┌─────────────────────────────┬───────┐ │
│ │ 100                         │  MAX  │ │
│ └─────────────────────────────┴───────┘ │
│                                         │
│ Route: Arbitrum → Hyperliquid           │
│ Via: Relay • Est. 4 seconds             │
│ Fee: ~$0.25 (0.25%)                     │
│                                         │
│ You receive: ~99.75 USDC                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │            Deposit                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Tasks for LI.FI Enhancement

1. [ ] Add `@lifi/sdk` package
2. [ ] Create `src/config/supported-chains.ts` with chain list
3. [ ] Create `src/hooks/bridge/use-lifi-deposit.ts` hook
4. [ ] Add chain selector dropdown to deposit modal
5. [ ] Display route info (bridge used, estimated time, fees)
6. [ ] Handle chain switching during execution
7. [ ] Add fallback to direct Arbitrum bridge if LI.FI fails
8. [ ] Test with multiple source chains

### LI.FI References

- [LI.FI SDK GitHub](https://github.com/lifinance/sdk)
- [@lifi/sdk npm](https://www.npmjs.com/package/@lifi/sdk)
- [LI.FI Documentation](https://docs.li.fi/sdk/installing-the-sdk)
- [LI.FI HyperCore Integration](https://li.fi/knowledge-hub/step-into-hypercore-with-li-fi/)
- [Jumper Exchange](https://jumper.exchange) - LI.FI powered, proven Hyperliquid integration
