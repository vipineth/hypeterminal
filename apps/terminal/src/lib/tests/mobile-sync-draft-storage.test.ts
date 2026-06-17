import { describe, expect, it } from "vitest";
import { clearMobileSyncDraft, readMobileSyncDraft, saveMobileSyncDraft } from "../mobile-sync/draft-storage";
import {
	createMobileAgentSyncUrl,
	MOBILE_SYNC_CLOCK_SKEW_MS,
	MOBILE_SYNC_PAYLOAD_TTL_MS,
} from "../mobile-sync/sync-core";

const NOW_MS = 1_779_364_227_000;
const APP_ORIGIN = "https://app.hypeterminal.com";
const USER_ADDRESS = "0x1111111111111111111111111111111111111111" as const;
const AGENT_PRIVATE_KEY = `0x${"ab".repeat(32)}` as const;

function createMemoryStorage(): Storage {
	const values = new Map<string, string>();
	return {
		get length() {
			return values.size;
		},
		clear: () => values.clear(),
		getItem: (key: string) => values.get(key) ?? null,
		key: (index: number) => Array.from(values.keys())[index] ?? null,
		removeItem: (key: string) => {
			values.delete(key);
		},
		setItem: (key: string, value: string) => {
			values.set(key, value);
		},
	};
}

async function createSyncFixture() {
	return createMobileAgentSyncUrl({
		appOrigin: APP_ORIGIN,
		env: "Mainnet",
		userAddress: USER_ADDRESS,
		agentPrivateKey: AGENT_PRIVATE_KEY,
		nowMs: NOW_MS,
	});
}

describe("mobile sync draft storage", () => {
	it("persists only the encrypted envelope metadata", async () => {
		const sync = await createSyncFixture();
		const storage = createMemoryStorage();

		expect(saveMobileSyncDraft(sync.envelope, { storage, nowMs: NOW_MS })).toBe(true);

		const rawStoredValue = storage.getItem("hypeterminal.mobile-sync.import-draft.v1");
		expect(rawStoredValue).not.toContain(AGENT_PRIVATE_KEY);
		expect(rawStoredValue).not.toContain(USER_ADDRESS);
		expect(rawStoredValue).not.toContain(sync.pairingCode);

		expect(readMobileSyncDraft({ storage, nowMs: NOW_MS })).toMatchObject({
			status: "found",
			draft: {
				syncId: sync.syncId,
				createdAtMs: NOW_MS,
				expiresAtMs: sync.expiresAtMs,
			},
		});
	});

	it("does not expose legacy pairing-code drafts from older stored records", async () => {
		const sync = await createSyncFixture();
		const storage = createMemoryStorage();

		saveMobileSyncDraft(sync.envelope, { storage, nowMs: NOW_MS });
		const rawStoredValue = storage.getItem("hypeterminal.mobile-sync.import-draft.v1");
		if (!rawStoredValue) throw new Error("missing stored draft");
		storage.setItem(
			"hypeterminal.mobile-sync.import-draft.v1",
			JSON.stringify({ ...JSON.parse(rawStoredValue), pairingCodeDraft: "FFFF-EEEE-DDDD-CCCC" }),
		);

		const result = readMobileSyncDraft({ storage, nowMs: NOW_MS });
		expect(result.status).toBe("found");
		if (result.status !== "found") throw new Error("missing draft");
		expect("pairingCodeDraft" in result.draft).toBe(false);
	});

	it("clears expired or invalid drafts", async () => {
		const sync = await createSyncFixture();
		const storage = createMemoryStorage();

		saveMobileSyncDraft(sync.envelope, { storage, nowMs: NOW_MS });
		expect(
			readMobileSyncDraft({
				storage,
				nowMs: NOW_MS + MOBILE_SYNC_PAYLOAD_TTL_MS + MOBILE_SYNC_CLOCK_SKEW_MS + 1,
			}),
		).toEqual({ status: "expired" });
		expect(readMobileSyncDraft({ storage, nowMs: NOW_MS })).toEqual({ status: "empty" });

		storage.setItem("hypeterminal.mobile-sync.import-draft.v1", JSON.stringify({ v: 1, encodedEnvelope: "bad" }));
		expect(readMobileSyncDraft({ storage, nowMs: NOW_MS })).toEqual({ status: "invalid" });
		expect(readMobileSyncDraft({ storage, nowMs: NOW_MS })).toEqual({ status: "empty" });
	});

	it("can be explicitly cleared", async () => {
		const sync = await createSyncFixture();
		const storage = createMemoryStorage();

		saveMobileSyncDraft(sync.envelope, { storage, nowMs: NOW_MS });
		expect(clearMobileSyncDraft({ storage })).toBe(true);
		expect(readMobileSyncDraft({ storage, nowMs: NOW_MS })).toEqual({ status: "empty" });
	});
});
