type StackEntry = {
	value: unknown;
	depth: number;
};

const MAX_WALK_DEPTH = 20;
const OBJECT_OVERHEAD_BYTES = 32;
const ARRAY_OVERHEAD_BYTES = 24;

export function estimatePayloadSizeBytes(value: unknown, stopAtBytes: number = Number.POSITIVE_INFINITY): number {
	const seen = new WeakSet<object>();
	const stack: StackEntry[] = [{ value, depth: 0 }];
	let size = 0;

	while (stack.length > 0) {
		const next = stack.pop();
		if (!next) break;

		const { value, depth } = next;
		const valueType = typeof value;

		if (value === null) {
			size += 4;
		} else if (valueType === "string") {
			size += value.length * 2;
		} else if (valueType === "number" || valueType === "bigint") {
			size += 8;
		} else if (valueType === "boolean") {
			size += 4;
		} else if (valueType === "undefined") {
			size += 2;
		} else if (valueType === "symbol" || valueType === "function") {
			size += 16;
		} else if (ArrayBuffer.isView(value)) {
			size += value.byteLength;
		} else if (value instanceof ArrayBuffer) {
			size += value.byteLength;
		} else if (typeof Blob !== "undefined" && value instanceof Blob) {
			size += value.size;
		} else if (valueType === "object") {
			const objectValue = value as Record<string, unknown>;
			if (seen.has(objectValue)) continue;
			seen.add(objectValue);

			if (depth >= MAX_WALK_DEPTH) {
				size += OBJECT_OVERHEAD_BYTES;
			} else if (Array.isArray(objectValue)) {
				size += ARRAY_OVERHEAD_BYTES;
				for (let index = 0; index < objectValue.length; index += 1) {
					stack.push({ value: objectValue[index], depth: depth + 1 });
				}
			} else {
				size += OBJECT_OVERHEAD_BYTES;
				for (const [key, childValue] of Object.entries(objectValue)) {
					size += key.length * 2;
					stack.push({ value: childValue, depth: depth + 1 });
				}
			}
		}

		if (size > stopAtBytes) {
			return size;
		}
	}

	return size;
}

export function isPayloadOversized(
	value: unknown,
	maxPayloadBytes: number,
): {
	estimatedBytes: number;
	oversized: boolean;
} {
	const estimatedBytes = estimatePayloadSizeBytes(value, maxPayloadBytes + 1);
	return {
		estimatedBytes,
		oversized: estimatedBytes > maxPayloadBytes,
	};
}
