export type RingBufferOptions<T> = {
	maxSize: number;
	getKey: (item: T) => string;
	compare: (a: T, b: T) => number;
	shouldReplace?: (existing: T, incoming: T) => boolean;
};

export class RingBuffer<T> {
	private items: T[];
	private keyMap: Map<string, number>;
	private readonly maxSize: number;
	private readonly getKey: (item: T) => string;
	private readonly compare: (a: T, b: T) => number;
	private readonly shouldReplace?: (existing: T, incoming: T) => boolean;
	private dirty = false;
	private snapshot: T[] | null = null;

	constructor(options: RingBufferOptions<T>) {
		this.maxSize = options.maxSize;
		this.getKey = options.getKey;
		this.compare = options.compare;
		this.shouldReplace = options.shouldReplace;
		this.items = [];
		this.keyMap = new Map();
	}

	add(newItems: T[]): boolean {
		if (newItems.length === 0) return false;

		let changed = false;

		for (let i = 0; i < newItems.length; i++) {
			const item = newItems[i];
			const key = this.getKey(item);
			const existingIndex = this.keyMap.get(key);

			if (existingIndex !== undefined) {
				const existingItem = this.items[existingIndex];
				if (!this.shouldReplace || !this.shouldReplace(existingItem, item)) continue;

				this.items[existingIndex] = item;
				changed = true;
				continue;
			}

			this.keyMap.set(key, this.items.length);
			this.items.push(item);
			changed = true;
		}

		if (!changed) return false;

		this.items.sort(this.compare);
		this.rebuildKeyMap();

		if (this.items.length > this.maxSize) {
			for (let i = this.maxSize; i < this.items.length; i++) {
				this.keyMap.delete(this.getKey(this.items[i]));
			}
			this.items.length = this.maxSize;
		}

		this.dirty = true;
		this.snapshot = null;
		return true;
	}

	getItems(): T[] {
		if (!this.dirty && this.snapshot) {
			return this.snapshot;
		}
		this.snapshot = this.items.slice();
		this.dirty = false;
		return this.snapshot;
	}

	clear(): void {
		this.items.length = 0;
		this.keyMap.clear();
		this.snapshot = null;
		this.dirty = false;
	}

	get size(): number {
		return this.items.length;
	}

	private rebuildKeyMap(): void {
		this.keyMap.clear();
		for (let i = 0; i < this.items.length; i++) {
			this.keyMap.set(this.getKey(this.items[i]), i);
		}
	}
}
