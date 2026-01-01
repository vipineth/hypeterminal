export function formatErrorForDisplay(error: unknown, fallbackMessage = "Something went wrong."): string {
	const parts: string[] = [];

	function collect(err: unknown, depth: number) {
		if (!err || depth > 6) return;

		if (typeof err === "string") {
			parts.push(err);
			return;
		}

		if (err instanceof Error) {
			const anyErr = err as unknown as Record<string, unknown>;
			if (typeof anyErr.shortMessage === "string") parts.push(anyErr.shortMessage);
			if (typeof anyErr.details === "string") parts.push(anyErr.details);
			if (typeof err.message === "string") parts.push(err.message);
			collect(err.cause, depth + 1);
			return;
		}

		if (typeof err === "object") {
			const anyErr = err as Record<string, unknown>;
			if (typeof anyErr.shortMessage === "string") parts.push(anyErr.shortMessage);
			if (typeof anyErr.details === "string") parts.push(anyErr.details);
			if (typeof anyErr.message === "string") parts.push(anyErr.message);
			collect(anyErr.cause, depth + 1);
		}
	}

	collect(error, 0);

	const unique = Array.from(new Set(parts.map((x) => x.trim()).filter(Boolean)));
	return unique.join(" — ") || fallbackMessage;
}

