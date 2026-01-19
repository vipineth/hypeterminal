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
