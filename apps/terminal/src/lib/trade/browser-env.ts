import type { LockManagerLike } from "@/lib/trade/order-sender";
import type { ChangeBus, KeyValueStore } from "@/lib/trade/pending-requests";

const DATABASE = "hypeterminal-orders";
const OBJECT_STORE = "requests";
const CHANNEL = "hypeterminal:pending-request";

let database: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
	database ??= new Promise<IDBDatabase>((resolve, reject) => {
		const opening = indexedDB.open(DATABASE, 1);
		opening.onupgradeneeded = () => opening.result.createObjectStore(OBJECT_STORE);
		opening.onsuccess = () => {
			const opened = opening.result;
			opened.onclose = () => {
				database = null;
			};
			opened.onversionchange = () => {
				opened.close();
				database = null;
			};
			resolve(opened);
		};
		opening.onerror = () => reject(opening.error);
		opening.onblocked = () => reject(new Error("Order database is blocked by another tab"));
	}).catch((error) => {
		database = null;
		throw error;
	});
	return database;
}

async function transact<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await openDatabase();
	let transaction: IDBTransaction;
	try {
		transaction = db.transaction(OBJECT_STORE, mode, { durability: "strict" });
	} catch (error) {
		database = null;
		throw error;
	}
	return new Promise<T>((resolve, reject) => {
		const request = run(transaction.objectStore(OBJECT_STORE));
		transaction.oncomplete = () => resolve(request.result);
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error ?? new Error("Order database write aborted"));
	});
}

const indexedDbStore: KeyValueStore = {
	get: (key) => transact("readonly", (store) => store.get(key)),
	async set(key, value) {
		await transact("readwrite", (store) => store.put(value, key));
	},
	async keys() {
		const keys = await transact("readonly", (store) => store.getAllKeys());
		return keys.map(String);
	},
};

let sender: BroadcastChannel | null = null;

const broadcastBus: ChangeBus = {
	post(slot) {
		sender ??= new BroadcastChannel(CHANNEL);
		sender.postMessage(slot);
	},
	subscribe(listener) {
		const receiver = new BroadcastChannel(CHANNEL);
		receiver.onmessage = (event: MessageEvent<string>) => listener(event.data);
		return () => receiver.close();
	},
};

export function getBrowserKeyValue(): KeyValueStore | null {
	return typeof window === "undefined" || typeof indexedDB === "undefined" ? null : indexedDbStore;
}

export function getBrowserChangeBus(): ChangeBus {
	return typeof window === "undefined" || typeof BroadcastChannel === "undefined"
		? { post() {}, subscribe: () => () => {} }
		: broadcastBus;
}

export function getBrowserLocks(): LockManagerLike | null {
	if (typeof window === "undefined" || !navigator.locks) return null;
	return { request: (name, callback) => navigator.locks.request(name, () => callback()) };
}
