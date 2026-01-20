import { t } from "@lingui/core/macro";
import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseSignature, parseUnits } from "viem";
import {
	useConnection,
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

const PERMIT_DEADLINE_SECONDS = 3600;

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

function normalizeSignatureV(v: bigint | undefined, yParity: number): number {
	const vRaw = v !== undefined ? Number(v) : yParity + 27;
	const vNormalized = vRaw < 27 ? vRaw + 27 : vRaw;
	if (vNormalized !== 27 && vNormalized !== 28) {
		throw new Error(`Invalid signature v value: ${vNormalized}`);
	}
	return vNormalized;
}

export function useArbitrumDeposit() {
	const { address, chainId } = useConnection();
	const { mutate: switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();
	const [step, setStep] = useState<DepositStep>("idle");

	const isArbitrum = chainId === ARBITRUM_CHAIN_ID;

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

	const { data: nonce } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: USDC_ABI,
		functionName: "nonces",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled: isArbitrum && !!address },
	});

	const { signTypedData, isPending: isSigning, error: signError, reset: resetSign } = useSignTypedData();

	const {
		writeContract,
		data: hash,
		isPending: isSubmitting,
		error: submitError,
		reset: resetSubmit,
	} = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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

	const switchToArbitrum = useCallback(() => {
		switchChain({ chainId: ARBITRUM_CHAIN_ID });
	}, [switchChain]);

	const validateAmount = useCallback(
		(amount: string): { valid: boolean; error: string | null } => {
			if (!amount || amount === "0") {
				return { valid: false, error: null };
			}
			try {
				const amountRaw = parseUnits(amount, USDC_DECIMALS);
				if (amountRaw < MIN_DEPOSIT_USDC) {
					return { valid: false, error: t`Minimum deposit is 5 USDC` };
				}
				if (amountRaw > balanceRaw) {
					return { valid: false, error: t`Insufficient balance` };
				}
				return { valid: true, error: null };
			} catch {
				return { valid: false, error: t`Invalid amount` };
			}
		},
		[balanceRaw],
	);
	// TODO: refactor this
	const startDeposit = useCallback(
		(amount: string) => {
			if (!address || nonce === undefined) return;

			const amountRaw = parseUnits(amount, USDC_DECIMALS);
			const deadline = BigInt(Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_SECONDS);

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
						const { r, s, v, yParity } = parseSignature(sig);
						const vNormalized = normalizeSignatureV(v, yParity);

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
		isArbitrum,
		switchToArbitrum,
		isSwitching,
		switchError,

		balance,
		step,
		error: depositError,

		startDeposit,
		validateAmount,
		reset,

		isPending: isSigning || isSubmitting,
		depositHash: hash,
	};
}
