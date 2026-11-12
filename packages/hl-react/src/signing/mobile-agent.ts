import type { ExtraAgentsResponse } from "@nktkas/hyperliquid";
import type { Address, Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { AgentWallet } from "./types";

export const MOBILE_AGENT_NAME_BASE = "Mobile";
export const MOBILE_AGENT_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;
export const MOBILE_AGENT_REVOKE_VALIDITY_MS = 60 * 1000;

const VALID_UNTIL_SUFFIX_RE = / valid_until \d+$/u;

export interface MobileAgentApproval {
	privateKey: Hex;
	publicKey: Address;
	agentNameBase: typeof MOBILE_AGENT_NAME_BASE;
	agentName: string;
	agentValidUntilMs: number;
}

export interface MobileAgentStorageMetadata {
	source: "mobile-sync";
	agentNameBase: typeof MOBILE_AGENT_NAME_BASE;
	agentName: string;
	agentValidUntilMs: number;
	importedAtMs: number;
	syncId: string;
}

export type MobileAgentStaleReason = "expired_local" | "missing_remote" | "expired_remote" | "wrong_remote_name";

export type MobileAgentVerification =
	| { status: "missing_local" }
	| { status: "not_mobile_agent"; localAgent: AgentWallet }
	| { status: "remote_unknown"; localAgent: AgentWallet }
	| { status: "approved"; localAgent: AgentWallet; remoteAgent: ExtraAgentsResponse[number] }
	| { status: "stale"; reason: MobileAgentStaleReason; localAgent: AgentWallet };

export function createMobileAgentName(validUntilMs: number): string {
	if (!Number.isSafeInteger(validUntilMs) || validUntilMs <= 0) {
		throw new Error("Invalid mobile agent expiry");
	}
	return `${MOBILE_AGENT_NAME_BASE} valid_until ${validUntilMs}`;
}

export function getMobileAgentNameBase(agentName: string | null | undefined): string {
	return (agentName ?? "").replace(VALID_UNTIL_SUFFIX_RE, "");
}

export function isMobileAgentName(agentName: string | null | undefined): boolean {
	return getMobileAgentNameBase(agentName) === MOBILE_AGENT_NAME_BASE;
}

export function createMobileAgentApproval(
	nowMs = Date.now(),
	privateKey: Hex = generatePrivateKey(),
): MobileAgentApproval {
	return createMobileAgentApprovalForValidity(nowMs + MOBILE_AGENT_VALIDITY_MS, privateKey);
}

export function createMobileAgentRevocationApproval(
	nowMs = Date.now(),
	privateKey: Hex = generatePrivateKey(),
): MobileAgentApproval {
	return createMobileAgentApprovalForValidity(nowMs + MOBILE_AGENT_REVOKE_VALIDITY_MS, privateKey);
}

export function createMobileAgentStorageMetadata(input: {
	agentName: string;
	agentValidUntilMs: number;
	importedAtMs: number;
	syncId: string;
}): MobileAgentStorageMetadata {
	if (!isMobileAgentName(input.agentName) || input.agentName !== createMobileAgentName(input.agentValidUntilMs)) {
		throw new Error("Invalid mobile agent name");
	}
	if (!Number.isSafeInteger(input.importedAtMs) || input.importedAtMs <= 0) {
		throw new Error("Invalid mobile agent import time");
	}
	if (!input.syncId) {
		throw new Error("Invalid mobile agent sync id");
	}
	return {
		source: "mobile-sync",
		agentNameBase: MOBILE_AGENT_NAME_BASE,
		agentName: input.agentName,
		agentValidUntilMs: input.agentValidUntilMs,
		importedAtMs: input.importedAtMs,
		syncId: input.syncId,
	};
}

export function createMobileAgentWalletRecord(input: {
	privateKey: Hex;
	publicKey: Address;
	agentName: string;
	agentValidUntilMs: number;
	importedAtMs: number;
	syncId: string;
}): AgentWallet {
	const derivedPublicKey = privateKeyToAccount(input.privateKey).address.toLowerCase();
	if (derivedPublicKey !== input.publicKey.toLowerCase()) {
		throw new Error("Mobile agent private key does not match public key");
	}

	return {
		privateKey: input.privateKey.toLowerCase() as Hex,
		publicKey: input.publicKey.toLowerCase() as Address,
		...createMobileAgentStorageMetadata({
			agentName: input.agentName,
			agentValidUntilMs: input.agentValidUntilMs,
			importedAtMs: input.importedAtMs,
			syncId: input.syncId,
		}),
	};
}

export function isStoredMobileAgent(
	agent: AgentWallet | null | undefined,
): agent is AgentWallet & MobileAgentStorageMetadata {
	return (
		agent?.source === "mobile-sync" &&
		agent.agentNameBase === MOBILE_AGENT_NAME_BASE &&
		typeof agent.agentName === "string" &&
		Number.isSafeInteger(agent.agentValidUntilMs) &&
		Number.isSafeInteger(agent.importedAtMs) &&
		typeof agent.syncId === "string" &&
		agent.syncId.length > 0
	);
}

export function findApprovedMobileAgent(
	extraAgents: ExtraAgentsResponse | undefined,
	agentAddress: string | undefined,
	nowMs = Date.now(),
): ExtraAgentsResponse[number] | null {
	if (!extraAgents || !agentAddress) return null;
	const normalizedAddress = agentAddress.toLowerCase();
	return (
		extraAgents.find(
			(agent) =>
				agent.address.toLowerCase() === normalizedAddress &&
				(agent.validUntil === null || agent.validUntil > nowMs) &&
				isMobileAgentName(agent.name),
		) ?? null
	);
}

export function verifyMobileAgent(
	localAgent: AgentWallet | null | undefined,
	extraAgents: ExtraAgentsResponse | undefined,
	nowMs = Date.now(),
): MobileAgentVerification {
	if (!localAgent) return { status: "missing_local" };
	if (!isStoredMobileAgent(localAgent)) return { status: "not_mobile_agent", localAgent };
	if (localAgent.agentValidUntilMs <= nowMs) {
		return { status: "stale", reason: "expired_local", localAgent };
	}
	if (!extraAgents) {
		return { status: "remote_unknown", localAgent };
	}

	const remoteAgent = extraAgents.find((agent) => agent.address.toLowerCase() === localAgent.publicKey.toLowerCase());
	if (!remoteAgent) {
		return { status: "stale", reason: "missing_remote", localAgent };
	}
	if (remoteAgent.validUntil !== null && remoteAgent.validUntil <= nowMs) {
		return { status: "stale", reason: "expired_remote", localAgent };
	}
	if (!isMobileAgentName(remoteAgent.name)) {
		return { status: "stale", reason: "wrong_remote_name", localAgent };
	}

	return { status: "approved", localAgent, remoteAgent };
}

export function shouldClearMobileAgent(verification: MobileAgentVerification): boolean {
	return verification.status === "stale";
}

function createMobileAgentApprovalForValidity(validUntilMs: number, privateKey: Hex): MobileAgentApproval {
	const account = privateKeyToAccount(privateKey);
	return {
		privateKey: privateKey.toLowerCase() as Hex,
		publicKey: account.address.toLowerCase() as Address,
		agentNameBase: MOBILE_AGENT_NAME_BASE,
		agentName: createMobileAgentName(validUntilMs),
		agentValidUntilMs: validUntilMs,
	};
}
