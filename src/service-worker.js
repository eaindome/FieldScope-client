/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
const RUNTIME_CACHE = `runtime-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE && key !== RUNTIME_CACHE) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches());
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	// ignore POST, PUT, DELETE requests - only cache GET requests
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);
		const runtimeCache = await caches.open(RUNTIME_CACHE);

		// Skip API calls - don't cache server responses
		if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
			try {
				return await fetch(event.request);
			} catch {
				// If offline and trying to reach API, return a custom offline response
				return new Response(
					JSON.stringify({ error: 'You are offline. This action requires internet connection.' }),
					{
						status: 503,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}
		}

		// For static assets (JS, CSS, images), try cache first
		if (ASSETS.includes(url.pathname)) {
			const cachedResponse = await cache.match(url.pathname);
			if (cachedResponse) {
				return cachedResponse;
			}
		}

		// For navigation requests (HTML pages), try network first, then cache
		if (event.request.mode === 'navigate') {
			try {
				// Try network first
				const response = await fetch(event.request);

				if (response.status === 200) {
					// Cache successful responses
					runtimeCache.put(event.request, response.clone());
				}

				return response;
			} catch {
				// If network fails, try to serve from cache
				const cachedResponse = await runtimeCache.match(event.request);
				if (cachedResponse) {
					return cachedResponse;
				}

				// If not in cache, serve the app shell (index.html)
				const appShell = await cache.match('/');
				if (appShell) {
					return appShell;
				}

				// Last resort: return offline page
				return new Response(
					`<!DOCTYPE html>
					<html>
						<head>
							<meta charset="utf-8">
							<meta name="viewport" content="width=device-width, initial-scale=1">
							<title>Offline - FieldScope</title>
							<style>
								body {
									font-family: system-ui, -apple-system, sans-serif;
									display: flex;
									align-items: center;
									justify-content: center;
									min-height: 100vh;
									margin: 0;
									background: #f8fafc;
									color: #334155;
								}
								.container {
									text-align: center;
									padding: 2rem;
								}
								h1 {
									font-size: 1.5rem;
									margin-bottom: 1rem;
								}
								p {
									color: #64748b;
								}
							</style>
						</head>
						<body>
							<div class="container">
								<h1>You're Offline</h1>
								<p>Please check your internet connection and try again.</p>
							</div>
						</body>
					</html>`,
					{
						status: 503,
						headers: { 'Content-Type': 'text/html' }
					}
				);
			}
		}

		// For other requests, try network first, then cache
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				runtimeCache.put(event.request, response.clone());
			}

			return response;
		} catch {
			const cachedResponse = await runtimeCache.match(event.request) ||
							   await cache.match(event.request);

			if (cachedResponse) {
				return cachedResponse;
			}

			return new Response('Not found', { status: 404 });
		}
	}

	event.respondWith(respond());
});
