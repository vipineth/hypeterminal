import { z } from "zod";

const KEY_PREFIX = "hypeterminal:pending-request:v1:";

const legSchema = z.object({
	role: z.enum(["entry", "takeProfit", "stopLoss", "order", "scaleLeg"]),
	price: z.string(),
});

const labelSchema = z.object({
	market: z.string(),
	side: z.enum(["buy", "sell"]),
	size: z.string(),
});

const pendingRequestSchema = z.object({
	slot: z.string(),
	kind: z.enum(["order", "twap"]),
	user: z.string(),
	signer: z.string(),
	asset: z.number().int(),
	body: z.string(),
	nonce: z.number().int(),
	expiresAfter: z.number().int(),
	cloids: z.array(z.string()),
	legs: z.array(legSchema),
	twap: z.object({ coin: z.string(), knownIds: z.array(z.number()).nullable() }).nullable(),
	label: labelSchema,
	createdAt: z.number(),
});

export type PendingRequest = z.infer<typeof pendingRequestSchema>;
export type RequestLabel = z.infer<typeof labelSchema>;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export interface RequestStore {
	get(slot: string): PendingRequest | null;
	put(request: PendingRequest): void;
	remove(request: PendingRequest): void;
	list(slotPrefix: string): PendingRequest[];
	subscribe(listener: () => void): () => void;
}

export function getUserSlotPrefix(network: string, user: string): string {
	return `${network}:${user.toLowerCase()}:`;
}

export function getRequestSlot(network: string, user: string, asset: number): string {
	return `${getUserSlotPrefix(network, user)}${asset}`;
}

export function createRequestStore(
	getStorage: () => StorageLike | null,
	onExternalChange: (listener: () => void) => () => void = () => () => {},
): RequestStore {
	const unsaved = new Map<string, string>();
	const listeners = new Set<() => void>();

	function notify() {
		for (const listener of listeners) listener();
	}

	function read(slot: string): string | null {
		try {
			return getStorage()?.getItem(KEY_PREFIX + slot) ?? unsaved.get(slot) ?? null;
		} catch {
			return unsaved.get(slot) ?? null;
		}
	}

	function get(slot: string): PendingRequest | null {
		const raw = read(slot);
		if (!raw) return null;
		try {
			return pendingRequestSchema.parse(JSON.parse(raw));
		} catch {
			return null;
		}
	}

	function put(request: PendingRequest) {
		const raw = JSON.stringify(request);
		try {
			const storage = getStorage();
			if (!storage) throw new Error("no storage");
			storage.setItem(KEY_PREFIX + request.slot, raw);
			unsaved.delete(request.slot);
		} catch {
			unsaved.set(request.slot, raw);
		}
		notify();
	}

	function remove(request: PendingRequest) {
		if (get(request.slot)?.nonce !== request.nonce) return;
		unsaved.delete(request.slot);
		try {
			getStorage()?.removeItem(KEY_PREFIX + request.slot);
		} catch {}
		notify();
	}

	function storedSlots(): string[] {
		const slots: string[] = [];
		const storage = getStorage();
		try {
			for (let index = 0; storage && index < storage.length; index++) {
				const key = storage.key(index);
				if (key?.startsWith(KEY_PREFIX)) slots.push(key.slice(KEY_PREFIX.length));
			}
		} catch {}
		return slots;
	}

	function list(slotPrefix: string): PendingRequest[] {
		const slots = new Set([...storedSlots(), ...unsaved.keys()]);
		return [...slots]
			.filter((slot) => slot.startsWith(slotPrefix))
			.flatMap((slot) => get(slot) ?? [])
			.sort((a, b) => a.createdAt - b.createdAt);
	}

	function subscribe(listener: () => void) {
		listeners.add(listener);
		const unsubscribeExternal = onExternalChange(listener);
		return () => {
			listeners.delete(listener);
			unsubscribeExternal();
		};
	}

	return { get, put, remove, list, subscribe };
}
