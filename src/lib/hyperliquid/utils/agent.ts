import type { ExtraAgentsResponse } from "@nktkas/hyperliquid";

export function isAgentApproved(extraAgents: ExtraAgentsResponse | undefined, publicKey: string | undefined): boolean {
	if (!extraAgents || !publicKey) return false;
	const normalizedKey = publicKey.toLowerCase();
	const now = Date.now();
	return extraAgents.some((agent) => agent.address.toLowerCase() === normalizedKey && agent.validUntil > now);
}
