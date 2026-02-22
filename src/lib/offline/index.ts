/**
 * Public barrel export for the offline layer.
 *
 * Everything a page/component needs is re-exported here.
 * Import from '$lib/offline' rather than individual files.
 *
 * Example:
 *   import { createSubmission, network, cacheProjects } from '$lib/offline';
 */

// ─── DB schema (types + helpers) ─────────────────────────────────────────────
export type {
	LocalSubmission,
	SyncQueueItem,
	CacheEntry,
	FormsCacheEntry,
	FormResponse,
	FormAnswers,
	SyncStatus,
	QueueOperation,
	QueueStatus
} from './db';

export { openDB, STORE } from './db';

// ─── Submissions ──────────────────────────────────────────────────────────────
export {
	createSubmission,
	updateSubmission,
	deleteSubmission,
	getSubmission,
	getSubmissionsByProject,
	getSubmissionsBySyncStatus,
	getAllSubmissions,
	countPendingSubmissions
} from './submissions';

// ─── Sync queue ───────────────────────────────────────────────────────────────
export type { SyncResult, SyncItemDetail } from './sync';
export {
	enqueue,
	getPendingQueueItems,
	getAllQueueItems,
	clearDoneItems,
	processSyncQueue
} from './sync';

// ─── Cache ────────────────────────────────────────────────────────────────────
export {
	cacheProjects,
	getCachedProjects,
	clearProjectsCache,
	cacheForms,
	getCachedForms,
	clearFormsCache,
	clearAllCaches
} from './cache';

// ─── Network store ────────────────────────────────────────────────────────────
export { network, registerApiCaller } from '$lib/stores/network.svelte';

// ─── Storage adapter (useful for testing/resetting) ──────────────────────────
export { localStorageAdapter } from './storage-adapter';
