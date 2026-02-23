/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;
const RUNTIME_CACHE = `runtime-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

// Key used to store the app shell HTML for offline navigation fallback
const APP_SHELL_KEY = '/__app_shell__';

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);

		// Pre-cache the app shell (root HTML) so offline navigation always has
		// something to serve. On Vercel the HTML is SSR-generated and is NOT
		// included in `build` / `files`, so we must fetch it explicitly here.
		try {
			const shellResponse = await fetch('/', { credentials: 'same-origin' });
			if (shellResponse.ok) {
				await cache.put(APP_SHELL_KEY, shellResponse);
			}
		} catch {
			// Already offline during install — shell will be cached on first online visit.
		}
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

				if (response.ok) {
					// Cache this navigation response for future offline use.
					runtimeCache.put(event.request, response.clone());
					// Also keep the app shell fresh with the latest HTML.
					cache.put(APP_SHELL_KEY, response.clone());
				}

				return response;
			} catch {
				// Network failed — serve the most specific cached version we have.

				// 1. Exact URL match (user visited this page before while online)
				const cachedResponse = await runtimeCache.match(event.request);
				if (cachedResponse) {
					return cachedResponse;
				}

				// 2. App shell — lets SvelteKit's client-side router handle the route
				const appShell =
					(await cache.match(APP_SHELL_KEY)) ||
					(await cache.match('/'));
				if (appShell) {
					return appShell;
				}

				// 3. Last resort: inline offline page (should rarely be reached)
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
