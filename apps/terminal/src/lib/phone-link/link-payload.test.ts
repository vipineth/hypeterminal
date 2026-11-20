import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { createPhoneLinkUrl, readPhoneLink } from "@/lib/phone-link/link-payload";

const ORIGIN = "https://app.example.com";
const NOW = 1_800_000_000_000;
const OWNER = "0xAbCdEf0123456789aBcDeF0123456789AbCdEf01";
const AGENT_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const AGENT_ADDRESS = privateKeyToAccount(AGENT_KEY).address.toLowerCase();

const LINK = { address: OWNER, agentKey: AGENT_KEY, network: "Mainnet", validUntil: NOW + 60_000 } as const;

function encodeRaw(payload: unknown): string {
	return `${ORIGIN}/link#${btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

describe("phone link payload", () => {
	it("round-trips the account, agent key, network and expiry", () => {
		const url = createPhoneLinkUrl(ORIGIN, LINK);
		expect(readPhoneLink(url, { nowMs: NOW, network: "Mainnet" })).toEqual({
			status: "ok",
			link: {
				address: OWNER.toLowerCase(),
				agentKey: AGENT_KEY,
				agentAddress: AGENT_ADDRESS,
				network: "Mainnet",
				validUntil: NOW + 60_000,
			},
		});
	});

	it("keeps the payload out of the path and query so servers never receive it", () => {
		const url = new URL(createPhoneLinkUrl(ORIGIN, LINK));
		expect(url.origin).toBe(ORIGIN);
		expect(url.pathname).toBe("/link");
		expect(url.search).toBe("");
		expect(url.hash.length).toBeGreaterThan(1);
		expect(`${url.pathname}${url.search}`).not.toContain(AGENT_KEY.slice(2, 12));
	});

	it("reads a bare fragment the same as the full url", () => {
		const url = createPhoneLinkUrl(ORIGIN, LINK);
		const fragment = new URL(url).hash;
		expect(readPhoneLink(fragment, { nowMs: NOW, network: "Mainnet" }).status).toBe("ok");
		expect(readPhoneLink(fragment.slice(1), { nowMs: NOW, network: "Mainnet" }).status).toBe("ok");
	});

	it("rejects a link at or after its expiry", () => {
		const url = createPhoneLinkUrl(ORIGIN, LINK);
		expect(readPhoneLink(url, { nowMs: LINK.validUntil, network: "Mainnet" }).status).toBe("expired");
		expect(readPhoneLink(url, { nowMs: LINK.validUntil + 1, network: "Mainnet" }).status).toBe("expired");
		expect(readPhoneLink(url, { nowMs: LINK.validUntil - 1, network: "Mainnet" }).status).toBe("ok");
	});

	it("rejects a link made for the other network", () => {
		const url = createPhoneLinkUrl(ORIGIN, { ...LINK, network: "Testnet" });
		expect(readPhoneLink(url, { nowMs: NOW, network: "Mainnet" }).status).toBe("wrong-network");
	});

	it.each([
		["an empty string", ""],
		["plain text", "hello"],
		["a WalletConnect uri", "wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2?relay-protocol=irn"],
		["a fragment that is not base64", `${ORIGIN}/link#not*base64!`],
		["base64 that is not json", `${ORIGIN}/link#${btoa("not json")}`],
		[
			"an unknown version",
			encodeRaw({ v: 2, address: OWNER, key: AGENT_KEY, network: "Mainnet", validUntil: NOW + 1 }),
		],
		["a missing key", encodeRaw({ v: 1, address: OWNER, network: "Mainnet", validUntil: NOW + 1 })],
		["a short key", encodeRaw({ v: 1, address: OWNER, key: "0x1234", network: "Mainnet", validUntil: NOW + 1 })],
		[
			"a key outside the curve",
			encodeRaw({ v: 1, address: OWNER, key: `0x${"0".repeat(64)}`, network: "Mainnet", validUntil: NOW + 1 }),
		],
		["a bad address", encodeRaw({ v: 1, address: "0x123", key: AGENT_KEY, network: "Mainnet", validUntil: NOW + 1 })],
		["an unknown network", encodeRaw({ v: 1, address: OWNER, key: AGENT_KEY, network: "Devnet", validUntil: NOW + 1 })],
		["a string expiry", encodeRaw({ v: 1, address: OWNER, key: AGENT_KEY, network: "Mainnet", validUntil: "soon" })],
	])("rejects %s as invalid", (_label, value) => {
		expect(readPhoneLink(value, { nowMs: NOW, network: "Mainnet" })).toEqual({ status: "invalid" });
	});
});
