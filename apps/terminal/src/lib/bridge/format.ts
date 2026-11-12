import Big from "big.js";

export function formatTokenBalance(amount: string, decimals: number): string {
	const value = Big(amount).div(Big(10).pow(decimals));
	if (value.lt(0.001)) return "<0.001";
	if (value.lt(1)) return value.toFixed(4);
	if (value.lt(1000)) return value.toFixed(3);
	return value.toFixed(2);
}

export function formatTokenAmount(amount: string, decimals: number): string {
	const value = Big(amount).div(Big(10).pow(decimals));
	if (value.lt(0.0001)) return "<0.0001";
	if (value.lt(1)) return value.toFixed(6);
	if (value.lt(1000)) return value.toFixed(4);
	return value.toFixed(2);
}

export function formatSendAmount(amount: string, maxSigFigs = 5): string {
	try {
		const value = Big(amount);
		if (value.eq(0)) return "0";
		const isNegative = value.lt(0);
		const abs = isNegative ? value.neg() : value;
		const formatted = abs.gte(1) ? abs.toPrecision(maxSigFigs) : truncateSubUnit(abs.toFixed(18), maxSigFigs);
		return isNegative ? `-${formatted}` : formatted;
	} catch {
		return amount;
	}
}

function truncateSubUnit(str: string, maxSigFigs: number): string {
	let sigCount = 0;
	let endIdx = 0;
	for (let i = 2; i < str.length; i++) {
		if (str[i] !== "0" || sigCount > 0) sigCount++;
		if (sigCount >= maxSigFigs) {
			endIdx = i + 1;
			break;
		}
	}
	return endIdx > 0 ? str.slice(0, endIdx) : str;
}

export function isValidUsdInput(value: string): boolean {
	if (!value || value === "." || value === "0") return false;
	try {
		return Big(value).gt(0);
	} catch {
		return false;
	}
}

export function usdToTokenAmount(usd: string, priceUSD: string, decimals: number): string {
	try {
		const price = Big(priceUSD);
		if (price.lte(0)) return "";
		return Big(usd).div(price).toFixed(decimals);
	} catch {
		return "";
	}
}

export function processTypeLabel(type: string): string {
	switch (type) {
		case "CHECK_ALLOWANCE":
		case "RESET_ALLOWANCE":
		case "SET_ALLOWANCE":
		case "PERMIT":
		case "NATIVE_PERMIT":
			return "Approval tx";
		case "SWAP":
			return "Swap tx";
		case "CROSS_CHAIN":
			return "Bridge tx";
		case "RECEIVING_CHAIN":
			return "Deposit tx";
		default:
			return "Transaction";
	}
}
