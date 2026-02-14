const STATIC_CACHE = "hypeterminal-static-v1";
const PAGE_CACHE = "hypeterminal-pages-v1";

const APP_SHELL = [
	"/",
	"/manifest.webmanifest",
	"/favicon.ico",
	"/icon.svg",
	"/apple-touch-icon.png",
	"/icon-192.png",
	"/icon-512.png",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => cache.addAll(APP_SHELL))
			.catch(() => undefined)
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => name !== STATIC_CACHE && name !== PAGE_CACHE)
					.map((name) => caches.delete(name)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request, PAGE_CACHE));
		return;
	}

	const isStaticRequest =
		request.destination === "script" ||
		request.destination === "style" ||
		request.destination === "image" ||
		request.destination === "font" ||
		url.pathname.startsWith("/assets/");

	if (isStaticRequest) {
		event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
	}
});

async function networkFirst(request, cacheName) {
	try {
		const response = await fetch(request);
		const cache = await caches.open(cacheName);
		cache.put(request, response.clone());
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) return cached;
		const fallback = await caches.match("/");
		return fallback || Response.error();
	}
}

async function staleWhileRevalidate(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	const networkPromise = fetch(request)
		.then((response) => {
			cache.put(request, response.clone());
			return response;
		})
		.catch(() => undefined);

	if (cached) {
		return cached;
	}

	const networkResponse = await networkPromise;
	return networkResponse || Response.error();
}
