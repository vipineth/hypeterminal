export const NONCE_LANES = 16;

export interface LaneLocks {
	request(name: string, options: { ifAvailable: true }, callback: (lock: Lock | null) => unknown): Promise<unknown>;
}

export type NonceManager = (address: string) => Promise<number>;

interface Lane {
	residue: number;
	stride: number;
}

const UNCOORDINATED: Lane = { residue: 0, stride: 1 };

function browserLocks(): LaneLocks | null {
	if (typeof window === "undefined") return null;
	return navigator.locks ?? null;
}

function holdIfFree(locks: LaneLocks, name: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		locks
			.request(name, { ifAvailable: true }, (lock) => {
				resolve(lock !== null);
				return lock ? new Promise<never>(() => {}) : undefined;
			})
			.catch(reject);
	});
}

// Each tab owns one residue mod NONCE_LANES until it closes, so tabs sharing an agent never mint the same nonce.
// The random start stops two browsers sharing an agent from both taking lane 0.
async function leaseLane(locks: LaneLocks | null): Promise<Lane> {
	if (!locks) return UNCOORDINATED;
	const start = Math.floor(Math.random() * NONCE_LANES);
	try {
		for (let i = 0; i < NONCE_LANES; i++) {
			const residue = (start + i) % NONCE_LANES;
			if (await holdIfFree(locks, `hyperliquid-nonce-lane-${residue}`)) return { residue, stride: NONCE_LANES };
		}
	} catch {
		return UNCOORDINATED;
	}
	return UNCOORDINATED;
}

function alignToLane(floor: number, { residue, stride }: Lane): number {
	return floor + ((residue - (floor % stride) + stride) % stride);
}

export function createNonceManager(locks: LaneLocks | null = browserLocks()): NonceManager {
	let lane: Promise<Lane> | undefined;
	const last = new Map<string, number>();
	return async function nextNonce(address: string) {
		lane ??= leaseLane(locks);
		const owned = await lane;
		const key = address.toLowerCase();
		const nonce = alignToLane(Math.max(Date.now(), (last.get(key) ?? 0) + 1), owned);
		last.set(key, nonce);
		return nonce;
	};
}
