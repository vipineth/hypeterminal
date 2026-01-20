export const BRIDGE2_ABI = [
	{
		inputs: [
			{
				components: [
					{ internalType: "address", name: "user", type: "address" },
					{ internalType: "uint64", name: "usd", type: "uint64" },
					{ internalType: "uint64", name: "deadline", type: "uint64" },
					{
						components: [
							{ internalType: "uint256", name: "r", type: "uint256" },
							{ internalType: "uint256", name: "s", type: "uint256" },
							{ internalType: "uint8", name: "v", type: "uint8" },
						],
						internalType: "struct Signature",
						name: "signature",
						type: "tuple",
					},
				],
				internalType: "struct DepositWithPermit[]",
				name: "deposits",
				type: "tuple[]",
			},
		],
		name: "batchedDepositWithPermit",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: "address", name: "user", type: "address" },
			{ indexed: false, internalType: "uint64", name: "usd", type: "uint64" },
		],
		name: "Deposit",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: false, internalType: "address", name: "user", type: "address" },
			{ indexed: false, internalType: "uint64", name: "usd", type: "uint64" },
			{ indexed: false, internalType: "uint32", name: "errorCode", type: "uint32" },
		],
		name: "FailedPermitDeposit",
		type: "event",
	},
] as const;
