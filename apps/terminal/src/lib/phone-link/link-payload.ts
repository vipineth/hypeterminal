import type { HyperliquidEnv } from "@hypeterminal/hl-react";
import type { Address, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import { PHONE_LINK_ROUTE } from "@/config/phone-link";

const payloadSchema = z.object({
	v: z.literal(1),
	address: z
		.string()
		.regex(/^0x[0-9a-fA-F]{40}$/)
		.transform((value) => value.toLowerCase() as Address),
	key: z
		.string()
		.regex(/^0x[0-9a-fA-F]{64}$/)
		.transform((value) => value.toLowerCase() as Hex),
	network: z.enum(["Mainnet", "Testnet"]),
	validUntil: z.number().int().positive(),
});

export interface PhoneLink {
	address: Address;
	agentKey: Hex;
	agentAddress: Address;
	network: HyperliquidEnv;
	validUntil: number;
}

export type PhoneLinkReadResult =
	| { status: "ok"; link: PhoneLink }
	| { status: "expired"; link: PhoneLink }
	| { status: "wrong-network"; link: PhoneLink }
	| { status: "invalid" };

function toBase64Url(text: string): string {
	return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
	return atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
}

export function createPhoneLinkUrl(origin: string, link: Omit<PhoneLink, "agentAddress">): string {
	const payload: z.input<typeof payloadSchema> = {
		v: 1,
		address: link.address,
		key: link.agentKey,
		network: link.network,
		validUntil: link.validUntil,
	};
	return `${origin}${PHONE_LINK_ROUTE}#${toBase64Url(JSON.stringify(payload))}`;
}

function decodeFragment(value: string): PhoneLink | null {
	const hashIndex = value.indexOf("#");
	const fragment = hashIndex === -1 ? value : value.slice(hashIndex + 1);
	try {
		const parsed = payloadSchema.safeParse(JSON.parse(fromBase64Url(fragment.trim())));
		if (!parsed.success) return null;
		const { address, key, network, validUntil } = parsed.data;
		const agentAddress = privateKeyToAccount(key).address.toLowerCase() as Address;
		return { address, agentKey: key, agentAddress, network, validUntil };
	} catch {
		return null;
	}
}

export function readPhoneLink(
	value: string,
	expected: { nowMs: number; network: HyperliquidEnv },
): PhoneLinkReadResult {
	const link = decodeFragment(value);
	if (!link) return { status: "invalid" };
	if (link.validUntil <= expected.nowMs) return { status: "expired", link };
	if (link.network !== expected.network) return { status: "wrong-network", link };
	return { status: "ok", link };
}
