import type { ExtraAgentsResponse, MaxBuilderFeeResponse } from "@nktkas/hyperliquid";
import Big from "big.js";

export function isAgentApproved(extraAgents: ExtraAgentsResponse | undefined, publicKey: string | undefined): boolean {
	if (!extraAgents || !publicKey) return false;
	const normalizedKey = publicKey.toLowerCase();
	const now = Date.now();
	return extraAgents.some(
		(agent) => agent.address.toLowerCase() === normalizedKey && (agent.validUntil === null || agent.validUntil > now),
	);
}

export function isBuilderFeeApproved(
	maxBuilderFee: MaxBuilderFeeResponse | undefined,
	requiredFee: number | string | undefined,
): boolean {
	if (maxBuilderFee === undefined || requiredFee === undefined) return false;
	const requiredFeeNum = typeof requiredFee === "string" ? Number(requiredFee) : requiredFee;
	return maxBuilderFee >= requiredFeeNum;
}

const TENTHS_OF_BASIS_POINT_PER_PERCENT = 1000;

export function convertFeeToPercentageString(fee: number | string): `${string}%` {
	return `${Big(fee).div(TENTHS_OF_BASIS_POINT_PER_PERCENT).toString()}%`;
}
