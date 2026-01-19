import { useCallback, useEffect, useState } from "react";
import { formatUnits, hexToSignature, parseUnits } from "viem";
import {
	useAccount,
	useReadContract,
	useSignTypedData,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWriteContract,
} from "wagmi";
import {
	ARBITRUM_CHAIN_ID,
	BRIDGE2_ABI,
	CONTRACTS,
	MIN_DEPOSIT_USDC,
	USDC_ABI,
	USDC_DECIMALS,
} from "@/config/contracts";

type DepositStep = "idle" | "signing" | "depositing" | "success" | "error";

const PERMIT_TYPES = {
	EIP712Domain: [
		{ name: "name", type: "string" },
		{ name: "version", type: "string" },
		{ name: "chainId", type: "uint256" },
		{ name: "verifyingContract", type: "address" },
	],
	Permit: [
		{ name: "owner", type: "address" },
		{ name: "spender", type: "address" },
		{ name: "value", type: "uint256" },
		{ name: "nonce", type: "uint256" },
		{ name: "deadline", type: "uint256" },
	],
} as const;

const USDC_DOMAIN = {
	name: "USD Coin",
	version: "2",
	chainId: BigInt(ARBITRUM_CHAIN_ID),
	verifyingContract: CONTRACTS.arbitrum.usdc,
};

export function useArbitrumDeposit() {
	const { address, chainId } = useAccount();
	const { switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
	const [step, setStep] = useState<DepositStep>("idle");

	const isArbitrum = chainId === ARBITRUM_CHAIN_ID;

	// USDC Balance
	const { data: balanceData, refetch: refetchBalance } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: USDC_ABI,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled: isArbitrum && !!address },
	});

	const balance = balanceData ? formatUnits(balanceData, USDC_DECIMALS) : "0";
	const balanceRaw = balanceData ?? 0n;

	// USDC Nonce for permit
	const { data: nonce } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: USDC_ABI,
		functionName: "nonces",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled: isArbitrum && !!address },
	});

	// Sign permit
	const {
		signTypedData,
		isPending: isSigning,
		error: signError,
		reset: resetSign,
	} = useSignTypedData();

	// Write to bridge contract
	const {
		writeContract,
		data: hash,
		isPending: isSubmitting,
		error: submitError,
		reset: resetSubmit,
	} = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

	// Track step changes
	useEffect(() => {
		if (isSigning && step === "idle") {
			setStep("signing");
		}
	}, [isSigning, step]);

	useEffect(() => {
		if (isSubmitting || isConfirming) {
			setStep("depositing");
		}
	}, [isSubmitting, isConfirming]);

	useEffect(() => {
		if (isSuccess && step === "depositing") {
			setStep("success");
			refetchBalance();
		}
	}, [isSuccess, step, refetchBalance]);

	const depositError = signError || submitError;

	useEffect(() => {
		if (depositError && step !== "idle") {
			setStep("error");
		}
	}, [depositError, step]);

	function switchToArbitrum() {
		switchChain({ chainId: ARBITRUM_CHAIN_ID });
	}

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
		[balanceRaw],
	);

	const startDeposit = useCallback(
		(amount: string) => {
			if (!address || nonce === undefined) return;

			const amountRaw = parseUnits(amount, USDC_DECIMALS);
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

			signTypedData(
				{
					domain: USDC_DOMAIN,
					types: PERMIT_TYPES,
					primaryType: "Permit",
					message: {
						owner: address,
						spender: CONTRACTS.arbitrum.bridge2,
						value: amountRaw,
						nonce,
						deadline,
					},
				},
				{
					onSuccess: (sig) => {
						const { r, s, v } = hexToSignature(sig);
						// Ensure v is 27 or 28 (some wallets return 0 or 1)
						const vNormalized = Number(v) < 27 ? Number(v) + 27 : Number(v);

						console.log("Deposit params:", {
							user: address,
							usd: amountRaw.toString(),
							deadline: deadline.toString(),
							nonce: nonce?.toString(),
							r,
							s,
							v: vNormalized,
						});

						writeContract({
							address: CONTRACTS.arbitrum.bridge2,
							abi: BRIDGE2_ABI,
							functionName: "batchedDepositWithPermit",
							args: [
								[
									{
										user: address,
										usd: amountRaw,
										deadline,
										signature: {
											r: BigInt(r),
											s: BigInt(s),
											v: vNormalized,
										},
									},
								],
							],
							chainId: ARBITRUM_CHAIN_ID,
							account: address,
						});
					},
				},
			);
		},
		[address, nonce, signTypedData, writeContract],
	);

	const reset = useCallback(() => {
		setStep("idle");
		resetSign();
		resetSubmit();
	}, [resetSign, resetSubmit]);

	return {
		chainId,
		isArbitrum,
		switchToArbitrum,
		isSwitching,
		switchError,

		balance,
		balanceRaw,

		step,
		error: depositError,

		startDeposit,
		validateAmount,
		reset,
		refetchBalance,

		isPending: isSigning || isSubmitting,
		isSuccess,
		depositHash: hash,
	};
}
