/**
 * Reactive network status store (Svelte 5 runes).
 *
 * Usage in any Svelte component:
 *
 *   import { network } from '$lib/stores/network.svelte';
 *
 *   <p>Status: {network.online ? 'Online' : 'Offline'}</p>
 *   <p>Pending: {network.pendingCount}</p>
 *   <button onclick={() => network.syncNow()}>Sync Now</button>
 *
 * Auto-sync fires automatically when the browser comes back online.
 * The apiCaller must be wired up once at app start via registerApiCaller().
 */

import { countPendingSubmissions, updateSubmission } from '$lib/offline/submissions';
import { processSyncQueue, type SyncResult } from '$lib/offline/sync';
import type { SyncQueueItem } from '$lib/offline/db';
import { api } from '$lib/api/client';

// ─── API caller registration ──────────────────────────────────────────────────

type ApiCaller = (item: SyncQueueItem) => Promise<{ remoteId?: number }>;

let _apiCaller: ApiCaller | null = null;

/**
 * Register the function that will actually push items to the server.
 * Call this once in the root layout (+layout.svelte or +layout.ts).
 *
 * Example:
 *   registerApiCaller(async (item) => {
 *     const res = await apiClient.submissions.create(item.payload);
 *     return { remoteId: res.id };
 *   });
 */
export function registerApiCaller(fn: ApiCaller): void {
	_apiCaller = fn;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface NetworkState {
	online: boolean;
	syncing: boolean;
	pendingCount: number;
	lastSyncAt: string | null;
	lastSyncResult: SyncResult | null;
}

// Svelte 5 rune-based reactive state
const state = $state<NetworkState>({
	online: typeof navigator !== 'undefined' ? navigator.onLine : true,
	syncing: false,
	pendingCount: 0,
	lastSyncAt: null,
	lastSyncResult: null
});

// ─── Reactive accessors ───────────────────────────────────────────────────────

export const network = {
	get online() { return state.online; },
	get syncing() { return state.syncing; },
	get pendingCount() { return state.pendingCount; },
	get lastSyncAt() { return state.lastSyncAt; },
	get lastSyncResult() { return state.lastSyncResult; },

	/** Manually trigger sync — safe to call at any time. */
	async syncNow(): Promise<SyncResult | null> {
		return runSync();
	},

	/** Refresh the pending count without syncing (e.g. after saving a form). */
	async refreshPendingCount(): Promise<void> {
		state.pendingCount = await countPendingSubmissions();
	}
};

// ─── Internal sync runner ─────────────────────────────────────────────────────

async function runSync(): Promise<SyncResult | null> {
	if (!state.online || state.syncing) return null;
	if (!_apiCaller) {
		console.warn('[FieldScope] Sync skipped: no API caller registered. Call registerApiCaller() in +layout.svelte.');
		return null;
	}

	state.syncing = true;

	try {
		const result = await processSyncQueue(_apiCaller);

		// Apply per-item status updates to local submission records
		for (const detail of result.details) {
			if (detail.entityType === 'submission') {
				if (detail.success) {
					await updateSubmission(detail.entityLocalId, {
						syncStatus: 'synced',
						remoteId: detail.remoteId,
						syncedAt: new Date().toISOString()
					});
				} else {
					await updateSubmission(detail.entityLocalId, {
						syncStatus: detail.isFinalFailure ? 'error' : 'pending',
						syncError: detail.error
					});
				}
			}
		}

		state.lastSyncAt = new Date().toISOString();
		state.lastSyncResult = result;
		// Refresh the badge count
		state.pendingCount = await countPendingSubmissions();
		return result;
	} catch (err) {
		console.error('[FieldScope] Sync error:', err);
		return null;
	} finally {
		state.syncing = false;
	}
}

// ─── Cache refresh on reconnect ───────────────────────────────────────────────

async function refreshCacheOnReconnect(): Promise<void> {
	try {
		// Refresh projects cache
		await api.getProjects();
		console.log('[FieldScope] Cache refreshed: projects');
	} catch (err) {
		console.error('[FieldScope] Failed to refresh cache on reconnect:', err);
	}
}

// ─── Browser event listeners ──────────────────────────────────────────────────

if (typeof window !== 'undefined') {
	window.addEventListener('online', () => {
		state.online = true;
		// Auto-sync immediately when reconnecting
		runSync();
		// Refresh cache in the background
		refreshCacheOnReconnect();
	});

	window.addEventListener('offline', () => {
		state.online = false;
	});

	// Populate initial pending count on load
	countPendingSubmissions().then((n) => {
		state.pendingCount = n;
	});
}
