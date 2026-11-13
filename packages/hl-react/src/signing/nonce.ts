export const NONCE_LANES = 16;

const SHARED_RESIDUE = NONCE_LANES;
const STRIDE = SHARED_RESIDUE + 1;

export interface LaneLocks {
	request(name: string, options: { ifAvailable: true }, callback: (lock: Lock | null) => unknown): Promise<unknown>;
}

export type HighWaterStorage = Pick<Storage, "getItem" | "setItem">;

export type NonceManager = (address: string) => Promise<number>;

interface Lane {
	residue: number;
	highWater: HighWaterStorage | null;
}

const UNCOORDINATED: Lane = { residue: SHARED_RESIDUE, highWater: null };

function browserLocks(): LaneLocks | null {
	if (typeof window === "undefined") return null;
	return navigator.locks ?? null;
}

function browserStorage(): HighWaterStorage | null {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}

function holdForTabLifetime(locks: LaneLocks, name: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		locks
			.request(name, { ifAvailable: true }, (lock) => {
				resolve(lock !== null);
				return lock ? new Promise<never>(() => {}) : undefined;
			})
			.catch(reject);
	});
}

async function leaseLane(locks: LaneLocks | null, highWater: HighWaterStorage | null): Promise<Lane> {
	if (!locks) return UNCOORDINATED;
	const start = Math.floor(Math.random() * NONCE_LANES);
	try {
		for (let i = 0; i < NONCE_LANES; i++) {
			const residue = (start + i) % NONCE_LANES;
			if (await holdForTabLifetime(locks, `hyperliquid-nonce-lane-${residue}`)) return { residue, highWater };
		}
	} catch {
		return UNCOORDINATED;
	}
	return UNCOORDINATED;
}

function readHighWater(storage: HighWaterStorage | null, key: string): number {
	try {
		const stored = Number(storage?.getItem(key));
		return Number.isSafeInteger(stored) ? stored : 0;
	} catch {
		return 0;
	}
}

function writeHighWater(storage: HighWaterStorage | null, key: string, nonce: number) {
	try {
		storage?.setItem(key, String(nonce));
	} catch {}
}

function waitForClockAtMostOneStride(lead: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, Math.min(lead, STRIDE)));
}

function alignToLane(floor: number, residue: number): number {
	return floor + ((residue - (floor % STRIDE) + STRIDE) % STRIDE);
}

export function createNonceManager(
	locks: LaneLocks | null = browserLocks(),
	storage: HighWaterStorage | null = browserStorage(),
): NonceManager {
	let lane: Promise<Lane> | undefined;
	let queue: Promise<unknown> = Promise.resolve();
	const last = new Map<string, number>();

	async function allocate(address: string) {
		lane ??= leaseLane(locks, storage);
		const { residue, highWater } = await lane;
		const key = `hyperliquid-nonce-lane-${residue}:${address.toLowerCase()}`;
		const previous = last.get(key) ?? readHighWater(highWater, key);
		const lead = previous - Date.now();
		if (lead > 0) await waitForClockAtMostOneStride(lead);
		const nonce = alignToLane(Math.max(Date.now(), previous + 1), residue);
		last.set(key, nonce);
		writeHighWater(highWater, key, nonce);
		return nonce;
	}

	return function nextNonce(address: string) {
		const nonce = queue.then(() => allocate(address));
		queue = nonce.catch(() => undefined);
		return nonce;
	};
}
