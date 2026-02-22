/**
 * Sync queue — manages offline-to-server synchronisation.
 *
 * Strategy:
 *  - Automatic: triggered as soon as the browser comes back online
 *    (via network.svelte.ts watching the `online` event).
 *  - Manual: call processSyncQueue() directly from a "Sync Now" button.
 *
 * Each SyncQueueItem is retried up to MAX_ATTEMPTS times.
 * After that the operation is marked 'error' and the user is notified
 * via the pending count in the network store.
 */

import { isTestMode } from '$lib/config';
import {
	openDB,
	idbRequest,
	idbGetAll,
	idbGetByIndex,
	STORE,
	type SyncQueueItem,
	type QueueStatus
} from './db';
import { localStorageAdapter } from './storage-adapter';

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;

// ─── Sync Result ─────────────────────────────────────────────────────────────

export interface SyncItemDetail {
	entityType: string;
	entityLocalId: string;
	remoteId?: number;
	success: boolean;
	isFinalFailure: boolean;
	error?: string;
}

export interface SyncResult {
	processed: number;
	succeeded: number;
	failed: number;
	skipped: number;
	errors: Array<{ entityLocalId: string; error: string }>;
	details: SyncItemDetail[];
}

// ─── Enqueue ─────────────────────────────────────────────────────────────────

/**
 * Add an operation to the sync queue.
 * Called automatically by submissions.ts — no need to call this directly.
 */
export async function enqueue(
	item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts' | 'status' | 'lastAttemptAt' | 'error'>
): Promise<void> {
	const queueItem: SyncQueueItem = {
		...item,
		status: 'pending',
		attempts: 0,
		createdAt: new Date().toISOString()
	};

	if (isTestMode()) {
		const id = localStorageAdapter.autoIncrement(STORE.SYNC_QUEUE);
		localStorageAdapter.put(STORE.SYNC_QUEUE, { ...queueItem, id });
	} else {
		const db = await openDB();
		const tx = db.transaction(STORE.SYNC_QUEUE, 'readwrite');
		await idbRequest(tx.objectStore(STORE.SYNC_QUEUE).add(queueItem));
	}
}

// ─── Queue queries ────────────────────────────────────────────────────────────

export async function getPendingQueueItems(): Promise<SyncQueueItem[]> {
	if (isTestMode()) {
		return localStorageAdapter
			.getAll<SyncQueueItem>(STORE.SYNC_QUEUE)
			.filter((i: SyncQueueItem) => i.status === 'pending');
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SYNC_QUEUE, 'readonly');
	return idbGetByIndex<SyncQueueItem>(
		tx.objectStore(STORE.SYNC_QUEUE),
		'status',
		IDBKeyRange.only('pending')
	);
}

export async function getAllQueueItems(): Promise<SyncQueueItem[]> {
	if (isTestMode()) {
		return localStorageAdapter.getAll<SyncQueueItem>(STORE.SYNC_QUEUE);
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SYNC_QUEUE, 'readonly');
	return idbGetAll<SyncQueueItem>(tx.objectStore(STORE.SYNC_QUEUE));
}

// ─── Queue mutation ───────────────────────────────────────────────────────────

async function updateQueueItem(
	id: number,
	updates: Partial<SyncQueueItem>
): Promise<void> {
	if (isTestMode()) {
		const existing = localStorageAdapter
			.getAll<SyncQueueItem>(STORE.SYNC_QUEUE)
			.find((i: SyncQueueItem) => i.id === id);
		if (existing) {
			localStorageAdapter.put(STORE.SYNC_QUEUE, { ...existing, ...updates });
		}
		return;
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SYNC_QUEUE, 'readwrite');
	const store = tx.objectStore(STORE.SYNC_QUEUE);
	const existing = await idbRequest<SyncQueueItem | undefined>(store.get(id));
	if (existing) {
		await idbRequest(store.put({ ...existing, ...updates }));
	}
}

export async function clearDoneItems(): Promise<void> {
	if (isTestMode()) {
		const items = localStorageAdapter.getAll<SyncQueueItem>(STORE.SYNC_QUEUE);
		items
			.filter((i: SyncQueueItem) => i.status === 'done')
			.forEach((i: SyncQueueItem) => localStorageAdapter.delete(STORE.SYNC_QUEUE, i.id!));
		return;
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SYNC_QUEUE, 'readwrite');
	const store = tx.objectStore(STORE.SYNC_QUEUE);
	const done = await idbGetByIndex<SyncQueueItem>(
		store,
		'status',
		IDBKeyRange.only('done' as QueueStatus)
	);
	for (const item of done) {
		if (item.id !== undefined) store.delete(item.id);
	}
}

// ─── Process ─────────────────────────────────────────────────────────────────

/**
 * Walk the pending queue and push each item to the server.
 *
 * @param apiCaller  Async function that takes a SyncQueueItem and syncs it.
 *                   Should throw on failure so the retry/error logic fires.
 */
export async function processSyncQueue(
	apiCaller: (item: SyncQueueItem) => Promise<{ remoteId?: number }>
): Promise<SyncResult> {
	const result: SyncResult = {
		processed: 0,
		succeeded: 0,
		failed: 0,
		skipped: 0,
		errors: [],
		details: []
	};

	const items = await getPendingQueueItems();

	for (const item of items) {
		result.processed++;

		// Already hit max attempts — skip and leave as 'error'
		if (item.attempts >= MAX_ATTEMPTS) {
			result.skipped++;
			continue;
		}

		// Mark processing
		await updateQueueItem(item.id!, {
			status: 'processing',
			attempts: item.attempts + 1,
			lastAttemptAt: new Date().toISOString()
		});

		try {
			const response = await apiCaller(item);

			// Mark queue item done
			await updateQueueItem(item.id!, { status: 'done' });

			result.details.push({
				entityType: item.entityType,
				entityLocalId: item.entityLocalId,
				remoteId: response.remoteId,
				success: true,
				isFinalFailure: false
			});
			result.succeeded++;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			const newAttempts = (item.attempts ?? 0) + 1;
			const isFinal = newAttempts >= MAX_ATTEMPTS;

			await updateQueueItem(item.id!, {
				status: isFinal ? 'error' : 'pending',
				attempts: newAttempts,
				error: errorMsg,
				lastAttemptAt: new Date().toISOString()
			});

			result.details.push({
				entityType: item.entityType,
				entityLocalId: item.entityLocalId,
				success: false,
				isFinalFailure: isFinal,
				error: errorMsg
			});
			result.failed++;
			result.errors.push({ entityLocalId: item.entityLocalId, error: errorMsg });
		}
	}

	// Clean up done items after each run
	await clearDoneItems();

	return result;
}
