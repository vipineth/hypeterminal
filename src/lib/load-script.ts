interface LoadScriptOptions {
	async?: boolean;
	timeoutMs?: number;
	isReady?: () => boolean;
}

const scriptPromises = new Map<string, Promise<void>>();

function resolveUrl(src: string): string {
	if (typeof window === "undefined") return src;
	return new URL(src, window.location.href).href;
}

function findScript(src: string): HTMLScriptElement | null {
	const target = resolveUrl(src);
	for (const script of Array.from(document.scripts)) {
		const current = script.src || script.getAttribute("src");
		if (!current) continue;
		if (resolveUrl(current) === target) return script;
	}
	return null;
}

function safeCheckReady(isReady?: () => boolean): boolean {
	if (!isReady) return false;
	try {
		return isReady();
	} catch {
		return false;
	}
}

export function loadScript(src: string, options: LoadScriptOptions = {}): Promise<void> {
	if (typeof window === "undefined") return Promise.resolve();
	if (safeCheckReady(options.isReady)) return Promise.resolve();

	const key = resolveUrl(src);
	const existingPromise = scriptPromises.get(key);
	if (existingPromise) return existingPromise;

	const promise = new Promise<void>((resolve, reject) => {
		if (safeCheckReady(options.isReady)) {
			resolve();
			return;
		}

		let script = findScript(key);
		let timeout: ReturnType<typeof setTimeout> | null = null;

		if (script?.getAttribute("data-load-error") === "true") {
			script.remove();
			script = null;
		}

		if (script?.getAttribute("data-loaded") === "true") {
			resolve();
			return;
		}
		const readyState = (script as (HTMLScriptElement & { readyState?: string }) | null)?.readyState;
		if (readyState === "complete" || readyState === "loaded") {
			script?.setAttribute("data-loaded", "true");
			resolve();
			return;
		}

		const cleanup = () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			if (script) {
				script.removeEventListener("load", onLoad);
				script.removeEventListener("error", onError);
			}
		};

		const onLoad = () => {
			cleanup();
			script?.setAttribute("data-loaded", "true");
			script?.removeAttribute("data-load-error");
			resolve();
		};

		const onError = () => {
			cleanup();
			script?.setAttribute("data-load-error", "true");
			script?.remove();
			scriptPromises.delete(key);
			reject(new Error(`Failed to load script: ${src}`));
		};

		if (!script) {
			script = document.createElement("script");
			script.src = key;
			script.async = options.async ?? true;
			script.setAttribute("data-loaded", "false");
			document.head.appendChild(script);
		}

		script.addEventListener("load", onLoad);
		script.addEventListener("error", onError);

		const timeoutMs = options.timeoutMs ?? 30000;
		if (timeoutMs > 0) {
			timeout = setTimeout(() => {
				cleanup();
				if (safeCheckReady(options.isReady)) {
					resolve();
					return;
				}
				script?.setAttribute("data-load-error", "true");
				script?.remove();
				scriptPromises.delete(key);
				reject(new Error(`Script load timeout: ${src}`));
			}, timeoutMs);
		}
	});

	scriptPromises.set(key, promise);
	return promise;
}
