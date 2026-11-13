import { z } from "zod";

const KEY_PREFIX = "hypeterminal:pending-request:v2:";
const DISMISSAL_PREFIX = "hypeterminal:dismissed-request:v1:";
const PROBE_KEY = "hypeterminal:pending-request:probe";

const hexSchema = z.custom<`0x${string}`>((value) => typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value));

const roleSchema = z.enum(["entry", "takeProfit", "stopLoss", "order", "scaleLeg"]);

const legSchema = z.object({ role: roleSchema, price: z.string() });

const labelSchema = z.object({
	market: z.string(),
	side: z.enum(["buy", "sell"]),
	size: z.string(),
});

const partialPlanSchema = z.object({
	roles: z.array(roleSchema),
	buy: z.boolean(),
	grouping: z.enum(["na", "normalTpsl", "positionTpsl"]),
	fates: z.array(z.enum(["placed", "rejected", "unknown"])),
	settledAt: z.number(),
});

const pendingRequestSchema = z.object({
	slot: z.string(),
	kind: z.enum(["order", "twap"]),
	user: hexSchema,
	signer: z.string(),
	asset: z.number().int(),
	body: z.string(),
	nonce: z.number().int(),
	expiresAfter: z.number().int(),
	cloids: z.array(hexSchema),
	legs: z.array(legSchema).catch([]),
	twap: z
		.object({ coin: z.string(), knownIds: z.array(z.number()) })
		.nullable()
		.catch(null),
	parent: z
		.object({ plan: partialPlanSchema, indices: z.array(z.number().int()) })
		.nullable()
		.catch(null),
	label: labelSchema.catch({ market: "", side: "buy", size: "" }),
	createdAt: z.number().catch(0),
});

const slotRecordSchema = z.discriminatedUnion("state", [
	z.object({ state: z.literal("pending"), request: pendingRequestSchema }),
	z.object({
		state: z.literal("settled"),
		nonce: z.number().int(),
		settledAt: z.number(),
		partial: partialPlanSchema.nullable().catch(null),
	}),
]);

export type PendingRequest = z.infer<typeof pendingRequestSchema>;
export type RequestLabel = z.infer<typeof labelSchema>;
export type PartialPlan = z.infer<typeof partialPlanSchema>;
export type SlotRecord = z.infer<typeof slotRecordSchema>;
export type Dismissal = { request: PendingRequest; dismissedAt: number; lookup: unknown };

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export interface RequestStore {
	read(slot: string): SlotRecord | null;
	write(slot: string, record: SlotRecord): boolean;
	recordDismissal(dismissal: Dismissal): boolean;
	isWritable(): boolean;
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
	const listeners = new Set<() => void>();

	function read(slot: string): SlotRecord | null {
		try {
			const raw = getStorage()?.getItem(KEY_PREFIX + slot);
			return raw ? slotRecordSchema.parse(JSON.parse(raw)) : null;
		} catch {
			return null;
		}
	}

	function save(key: string, value: unknown): boolean {
		const storage = getStorage();
		if (!storage) return false;
		try {
			storage.setItem(key, JSON.stringify(value));
		} catch {
			return false;
		}
		return true;
	}

	function write(slot: string, record: SlotRecord): boolean {
		if (!save(KEY_PREFIX + slot, record)) return false;
		for (const listener of listeners) listener();
		return true;
	}

	function recordDismissal(dismissal: Dismissal): boolean {
		return save(`${DISMISSAL_PREFIX}${dismissal.request.slot}#${dismissal.request.nonce}`, dismissal);
	}

	function isWritable(): boolean {
		const storage = getStorage();
		if (!storage) return false;
		try {
			storage.setItem(PROBE_KEY, "1");
			storage.removeItem(PROBE_KEY);
			return true;
		} catch {
			return false;
		}
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
		return storedSlots()
			.filter((slot) => slot.startsWith(slotPrefix))
			.flatMap((slot) => {
				const record = read(slot);
				return record?.state === "pending" ? [record.request] : [];
			})
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

	return { read, write, recordDismissal, isWritable, list, subscribe };
}
