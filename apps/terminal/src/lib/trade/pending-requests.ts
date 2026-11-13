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

export interface KeyValueStore {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
	keys(): Promise<string[]>;
}

export interface ChangeBus {
	post(slot: string): void;
	subscribe(listener: (slot: string) => void): () => void;
}

const SILENT_BUS: ChangeBus = { post() {}, subscribe: () => () => {} };

export class UnreadableStore extends Error {}

export interface RequestStore {
	read(slot: string): Promise<SlotRecord | null>;
	write(slot: string, record: SlotRecord): Promise<boolean>;
	recordDismissal(dismissal: Dismissal): Promise<boolean>;
	isWritable(): Promise<boolean>;
	pending(): PendingRequest[];
	refresh(): Promise<void>;
	subscribe(listener: () => void): () => void;
}

export function getUserSlotPrefix(network: string, user: string): string {
	return `${network}:${user.toLowerCase()}:`;
}

export function getRequestSlot(network: string, user: string, asset: number): string {
	return `${getUserSlotPrefix(network, user)}${asset}`;
}

export function createRequestStore(getStore: () => KeyValueStore | null, bus: ChangeBus = SILENT_BUS): RequestStore {
	const listeners = new Set<() => void>();
	const cached = new Map<string, PendingRequest>();
	const cachedAt = new Map<string, number>();
	let version = 0;
	let pendingList: PendingRequest[] = [];

	function notify() {
		pendingList = [...cached.values()].sort((a, b) => a.createdAt - b.createdAt);
		for (const listener of listeners) listener();
	}

	function place(slot: string, record: SlotRecord | null) {
		if (record?.state === "pending") cached.set(slot, record.request);
		else cached.delete(slot);
	}

	function cache(slot: string, record: SlotRecord | null) {
		cachedAt.set(slot, ++version);
		place(slot, record);
		notify();
	}

	async function read(slot: string): Promise<SlotRecord | null> {
		const store = getStore();
		if (!store) throw new UnreadableStore("Order storage is unavailable");
		let raw: unknown;
		try {
			raw = await store.get(KEY_PREFIX + slot);
		} catch (error) {
			throw new UnreadableStore(error instanceof Error ? error.message : String(error));
		}
		if (raw === undefined || raw === null) return null;
		const parsed = slotRecordSchema.safeParse(raw);
		return parsed.success ? parsed.data : null;
	}

	async function readForList(slot: string): Promise<SlotRecord | null | undefined> {
		try {
			return await read(slot);
		} catch {
			return undefined;
		}
	}

	async function save(key: string, value: unknown): Promise<boolean> {
		const store = getStore();
		if (!store) return false;
		try {
			await store.set(key, value);
			return true;
		} catch {
			return false;
		}
	}

	async function write(slot: string, record: SlotRecord): Promise<boolean> {
		if (!(await save(KEY_PREFIX + slot, record))) return false;
		cache(slot, record);
		bus.post(slot);
		return true;
	}

	function recordDismissal(dismissal: Dismissal): Promise<boolean> {
		return save(`${DISMISSAL_PREFIX}${dismissal.request.slot}#${dismissal.request.nonce}`, dismissal);
	}

	function isWritable(): Promise<boolean> {
		return save(PROBE_KEY, Date.now());
	}

	async function refresh() {
		const startedAt = version;
		let keys: string[] = [];
		try {
			keys = (await getStore()?.keys()) ?? [];
		} catch {
			return;
		}
		const slots = keys.filter((key) => key.startsWith(KEY_PREFIX)).map((key) => key.slice(KEY_PREFIX.length));
		const records = await Promise.all(slots.map(async (slot) => [slot, await readForList(slot)] as const));
		const untouched = (slot: string) => (cachedAt.get(slot) ?? 0) <= startedAt;
		for (const slot of cached.keys()) if (!slots.includes(slot) && untouched(slot)) cached.delete(slot);
		for (const [slot, record] of records) if (record !== undefined && untouched(slot)) place(slot, record);
		notify();
	}

	function subscribe(listener: () => void) {
		listeners.add(listener);
		const unsubscribeBus = bus.subscribe(async (slot) => {
			const record = await readForList(slot);
			if (record !== undefined) cache(slot, record);
		});
		void refresh();
		return () => {
			listeners.delete(listener);
			unsubscribeBus();
		};
	}

	return { read, write, recordDismissal, isWritable, pending: () => pendingList, refresh, subscribe };
}
