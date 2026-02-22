/**
 * Submission store operations
 *
 * All writes go to IndexedDB first (offline-first).
 * Every create/update also enqueues a sync_queue item so the
 * background sync worker knows to push changes to the server.
 *
 * In test mode (APP_MODE === 'test') the LocalStorageAdapter is
 * used instead of IndexedDB so the same API works without a browser
 * IDB implementation in test environments.
 */

import { isTestMode } from '$lib/config';
import {
	openDB,
	idbRequest,
	idbGetByIndex,
	STORE,
	type LocalSubmission,
	type FormResponse,
	type SyncStatus
} from './db';
import { enqueue } from './sync';
import { localStorageAdapter } from './storage-adapter';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateLocalId(): string {
	// crypto.randomUUID is available in all modern browsers
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback for older environments
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
	return new Date().toISOString();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new submission locally.
 * Returns the localId assigned to the record.
 */
export async function createSubmission(params: {
	projectId: number;
	respondentName: string;
	responses: FormResponse[];
}): Promise<string> {
	const submission: LocalSubmission = {
		localId: generateLocalId(),
		projectId: params.projectId,
		respondentName: params.respondentName,
		responses: params.responses,
		syncStatus: 'pending',
		createdAt: now(),
		updatedAt: now()
	};

	if (isTestMode()) {
		localStorageAdapter.put(STORE.SUBMISSIONS, submission);
	} else {
		const db = await openDB();
		const tx = db.transaction(STORE.SUBMISSIONS, 'readwrite');
		await idbRequest(tx.objectStore(STORE.SUBMISSIONS).put(submission));
	}

	// Queue for sync
	await enqueue({
		entityType: 'submission',
		entityLocalId: submission.localId,
		operation: 'create',
		payload: submission
	});

	return submission.localId;
}

/**
 * Update an existing local submission (e.g. editing before sync).
 */
export async function updateSubmission(
	localId: string,
	updates: Partial<Pick<LocalSubmission, 'respondentName' | 'responses' | 'syncStatus' | 'syncError' | 'syncedAt' | 'remoteId'>>
): Promise<void> {
	const existing = await getSubmission(localId);
	if (!existing) throw new Error(`Submission ${localId} not found`);

	const updated: LocalSubmission = { ...existing, ...updates, updatedAt: now() };

	if (isTestMode()) {
		localStorageAdapter.put(STORE.SUBMISSIONS, updated);
	} else {
		const db = await openDB();
		const tx = db.transaction(STORE.SUBMISSIONS, 'readwrite');
		await idbRequest(tx.objectStore(STORE.SUBMISSIONS).put(updated));
	}

	// Only re-enqueue if the agent is editing content (not an internal status update)
	if (updates.respondentName || updates.responses) {
		await enqueue({
			entityType: 'submission',
			entityLocalId: localId,
			operation: 'update',
			payload: updated
		});
	}
}

/**
 * Delete a local submission (and its queued operations).
 */
export async function deleteSubmission(localId: string): Promise<void> {
	if (isTestMode()) {
		localStorageAdapter.delete(STORE.SUBMISSIONS, localId);
	} else {
		const db = await openDB();
		const tx = db.transaction([STORE.SUBMISSIONS, STORE.SYNC_QUEUE], 'readwrite');
		tx.objectStore(STORE.SUBMISSIONS).delete(localId);

		// Remove any pending queue items for this submission
		const queueStore = tx.objectStore(STORE.SYNC_QUEUE);
		const index = queueStore.index('entityLocalId');
		const cursor = index.openCursor(IDBKeyRange.only(localId));
		cursor.onsuccess = (e) => {
			const c = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
			if (c) {
				c.delete();
				c.continue();
			}
		};

		await new Promise<void>((res, rej) => {
			tx.oncomplete = () => res();
			tx.onerror = () => rej(tx.error);
		});
	}
}

/**
 * Fetch a single submission by localId.
 */
export async function getSubmission(localId: string): Promise<LocalSubmission | null> {
	if (isTestMode()) {
		return localStorageAdapter.get<LocalSubmission>(STORE.SUBMISSIONS, localId);
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SUBMISSIONS, 'readonly');
	const result = await idbRequest<LocalSubmission | undefined>(
		tx.objectStore(STORE.SUBMISSIONS).get(localId)
	);
	return result ?? null;
}

/**
 * Get all submissions for a given project (all sync statuses).
 */
export async function getSubmissionsByProject(projectId: number): Promise<LocalSubmission[]> {
	if (isTestMode()) {
		return localStorageAdapter
			.getAll<LocalSubmission>(STORE.SUBMISSIONS)
			.filter((s: LocalSubmission) => s.projectId === projectId);
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SUBMISSIONS, 'readonly');
	return idbGetByIndex<LocalSubmission>(tx.objectStore(STORE.SUBMISSIONS), 'projectId', projectId);
}

/**
 * Get all submissions with a specific sync status.
 */
export async function getSubmissionsBySyncStatus(status: SyncStatus): Promise<LocalSubmission[]> {
	if (isTestMode()) {
		return localStorageAdapter
			.getAll<LocalSubmission>(STORE.SUBMISSIONS)
			.filter((s: LocalSubmission) => s.syncStatus === status);
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SUBMISSIONS, 'readonly');
	return idbGetByIndex<LocalSubmission>(
		tx.objectStore(STORE.SUBMISSIONS),
		'syncStatus',
		IDBKeyRange.only(status)
	);
}

/**
 * Get all local submissions — useful for admin/manager view during dev.
 */
export async function getAllSubmissions(): Promise<LocalSubmission[]> {
	if (isTestMode()) {
		return localStorageAdapter.getAll<LocalSubmission>(STORE.SUBMISSIONS);
	}

	const db = await openDB();
	const tx = db.transaction(STORE.SUBMISSIONS, 'readonly');
	return idbRequest<LocalSubmission[]>(tx.objectStore(STORE.SUBMISSIONS).getAll());
}

/**
 * Count pending submissions (those not yet synced).
 */
export async function countPendingSubmissions(): Promise<number> {
	const pending = await getSubmissionsBySyncStatus('pending');
	const errored = await getSubmissionsBySyncStatus('error');
	return pending.length + errored.length;
}
