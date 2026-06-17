import {
	decodeMobileSyncEnvelope,
	encodeMobileSyncEnvelope,
	MOBILE_SYNC_CLOCK_SKEW_MS,
	type MobileSyncEnvelope,
} from "./sync-core";

const MOBILE_SYNC_DRAFT_STORAGE_KEY = "hypeterminal.mobile-sync.import-draft.v1";

interface StoredMobileSyncDraft {
	v: 1;
	syncId: string;
	createdAtMs: number;
	expiresAtMs: number;
	encodedEnvelope: string;
	storedAtMs: number;
}

export interface MobileSyncDraft {
	envelope: MobileSyncEnvelope;
	syncId: string;
	createdAtMs: number;
	expiresAtMs: number;
	storedAtMs: number;
}

export type ReadMobileSyncDraftResult =
	| { status: "empty" }
	| { status: "found"; draft: MobileSyncDraft }
	| { status: "expired" }
	| { status: "invalid" };

interface MobileSyncDraftStorageOptions {
	nowMs?: number;
	storage?: Storage | null;
}

export function saveMobileSyncDraft(
	envelope: MobileSyncEnvelope,
	options: MobileSyncDraftStorageOptions = {},
): boolean {
	const storage = getDraftStorage(options.storage);
	if (!storage) return false;

	const storedDraft: StoredMobileSyncDraft = {
		v: 1,
		syncId: envelope.syncId,
		createdAtMs: envelope.createdAtMs,
		expiresAtMs: envelope.expiresAtMs,
		encodedEnvelope: encodeMobileSyncEnvelope(envelope),
		storedAtMs: options.nowMs ?? Date.now(),
	};

	try {
		storage.setItem(MOBILE_SYNC_DRAFT_STORAGE_KEY, JSON.stringify(storedDraft));
		return true;
	} catch {
		return false;
	}
}

export function readMobileSyncDraft(options: MobileSyncDraftStorageOptions = {}): ReadMobileSyncDraftResult {
	const storage = getDraftStorage(options.storage);
	if (!storage) return { status: "empty" };

	let storedValue: string | null;
	try {
		storedValue = storage.getItem(MOBILE_SYNC_DRAFT_STORAGE_KEY);
	} catch {
		return { status: "empty" };
	}
	if (!storedValue) return { status: "empty" };

	try {
		const parsed = JSON.parse(storedValue) as Partial<StoredMobileSyncDraft>;
		if (
			parsed.v !== 1 ||
			typeof parsed.syncId !== "string" ||
			typeof parsed.createdAtMs !== "number" ||
			typeof parsed.expiresAtMs !== "number" ||
			typeof parsed.encodedEnvelope !== "string" ||
			typeof parsed.storedAtMs !== "number"
		) {
			clearMobileSyncDraft({ storage });
			return { status: "invalid" };
		}

		if (isMobileSyncEnvelopeExpiredAt(parsed.expiresAtMs, options.nowMs ?? Date.now())) {
			clearMobileSyncDraft({ storage });
			return { status: "expired" };
		}

		const envelope = decodeMobileSyncEnvelope(parsed.encodedEnvelope);
		if (
			envelope.syncId !== parsed.syncId ||
			envelope.createdAtMs !== parsed.createdAtMs ||
			envelope.expiresAtMs !== parsed.expiresAtMs
		) {
			clearMobileSyncDraft({ storage });
			return { status: "invalid" };
		}

		return {
			status: "found",
			draft: {
				envelope,
				syncId: parsed.syncId,
				createdAtMs: parsed.createdAtMs,
				expiresAtMs: parsed.expiresAtMs,
				storedAtMs: parsed.storedAtMs,
			},
		};
	} catch {
		clearMobileSyncDraft({ storage });
		return { status: "invalid" };
	}
}

export function clearMobileSyncDraft(options: Pick<MobileSyncDraftStorageOptions, "storage"> = {}): boolean {
	const storage = getDraftStorage(options.storage);
	if (!storage) return false;

	try {
		storage.removeItem(MOBILE_SYNC_DRAFT_STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}

export function isMobileSyncEnvelopeExpired(envelope: MobileSyncEnvelope, nowMs = Date.now()): boolean {
	return isMobileSyncEnvelopeExpiredAt(envelope.expiresAtMs, nowMs);
}

function isMobileSyncEnvelopeExpiredAt(expiresAtMs: number, nowMs: number): boolean {
	return nowMs > expiresAtMs + MOBILE_SYNC_CLOCK_SKEW_MS;
}

function getDraftStorage(storage?: Storage | null): Storage | null {
	if (storage !== undefined) return storage;
	if (typeof window === "undefined") return null;
	try {
		return window.sessionStorage;
	} catch {
		return null;
	}
}

export { MOBILE_SYNC_DRAFT_STORAGE_KEY };
