/**
 * FieldScope IndexedDB Schema
 *
 * Database: fieldscope_offline (version 1)
 *
 * Stores:
 *  - submissions        Agent submissions (offline-first, synced to server)
 *  - sync_queue         Pending operations awaiting network
 *  - projects_cache     Cached project list for offline browsing
 *  - forms_cache        Cached form definitions per project
 */

export const DB_NAME = 'fieldscope_offline';
export const DB_VERSION = 1;

// ─── Store Names ──────────────────────────────────────────────────────────────

export const STORE = {
	SUBMISSIONS: 'submissions',
	SYNC_QUEUE: 'sync_queue',
	PROJECTS_CACHE: 'projects_cache',
	FORMS_CACHE: 'forms_cache'
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';
export type QueueOperation = 'create' | 'update' | 'delete';
export type QueueStatus = 'pending' | 'processing' | 'done' | 'error';

/** A form answer: maps fieldId → value */
export type FormAnswers = Record<string, unknown>;

/** One form's answers within a submission */
export interface FormResponse {
	formId: number;
	answers: FormAnswers;
}

/** A full agent submission stored locally */
export interface LocalSubmission {
	/** Browser-generated UUID (primary key) */
	localId: string;
	/** Set after successful sync with the server */
	remoteId?: number;
	projectId: number;
	/** Human-readable respondent identifier entered by agent */
	respondentName: string;
	/** Array of per-form responses (one per form in the project) */
	responses: FormResponse[];
	syncStatus: SyncStatus;
	syncError?: string;
	syncedAt?: string;
	createdAt: string;
	updatedAt: string;
}

/** An operation waiting to be sent to the server */
export interface SyncQueueItem {
	/** Auto-incremented by IndexedDB */
	id?: number;
	entityType: 'submission';
	entityLocalId: string;
	operation: QueueOperation;
	payload: unknown;
	status: QueueStatus;
	attempts: number;
	lastAttemptAt?: string;
	error?: string;
	createdAt: string;
}

/** Cached entity wrapper */
export interface CacheEntry<T> {
	id: number;
	data: T;
	cachedAt: string;
}

/** Forms cache entry also stores projectId for querying by project */
export interface FormsCacheEntry<T> extends CacheEntry<T> {
	projectId: number;
}

// ─── Open / Migrate DB ────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
	if (_db) return Promise.resolve(_db);

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;

			// ── submissions ──────────────────────────────────────────────────
			if (!db.objectStoreNames.contains(STORE.SUBMISSIONS)) {
				const submissionsStore = db.createObjectStore(STORE.SUBMISSIONS, {
					keyPath: 'localId'
				});
				submissionsStore.createIndex('projectId', 'projectId', { unique: false });
				submissionsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
				submissionsStore.createIndex('createdAt', 'createdAt', { unique: false });
				// Compound index for querying by project + sync status
				submissionsStore.createIndex('projectId_syncStatus', ['projectId', 'syncStatus'], {
					unique: false
				});
			}

			// ── sync_queue ───────────────────────────────────────────────────
			if (!db.objectStoreNames.contains(STORE.SYNC_QUEUE)) {
				const queueStore = db.createObjectStore(STORE.SYNC_QUEUE, {
					keyPath: 'id',
					autoIncrement: true
				});
				queueStore.createIndex('entityLocalId', 'entityLocalId', { unique: false });
				queueStore.createIndex('status', 'status', { unique: false });
				queueStore.createIndex('createdAt', 'createdAt', { unique: false });
			}

			// ── projects_cache ───────────────────────────────────────────────
			if (!db.objectStoreNames.contains(STORE.PROJECTS_CACHE)) {
				db.createObjectStore(STORE.PROJECTS_CACHE, { keyPath: 'id' });
			}

			// ── forms_cache ──────────────────────────────────────────────────
			if (!db.objectStoreNames.contains(STORE.FORMS_CACHE)) {
				const formsStore = db.createObjectStore(STORE.FORMS_CACHE, { keyPath: 'id' });
				formsStore.createIndex('projectId', 'projectId', { unique: false });
			}
		};

		request.onsuccess = (event) => {
			_db = (event.target as IDBOpenDBRequest).result;

			// Handle unexpected version changes (e.g. another tab upgraded)
			_db.onversionchange = () => {
				_db?.close();
				_db = null;
			};

			resolve(_db);
		};

		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error('IndexedDB upgrade blocked by another tab'));
	});
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

export function idbTransaction(
	db: IDBDatabase,
	storeNames: string | string[],
	mode: IDBTransactionMode = 'readonly'
): IDBTransaction {
	return db.transaction(storeNames, mode);
}

/** Wrap an IDBRequest in a Promise */
export function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/** Collect all records from a cursor */
export function idbGetAll<T>(store: IDBObjectStore | IDBIndex): Promise<T[]> {
	return idbRequest<T[]>(store.getAll() as IDBRequest<T[]>);
}

/** Collect all records matching an index range */
export function idbGetByIndex<T>(
	store: IDBObjectStore,
	indexName: string,
	query: IDBValidKey | IDBKeyRange
): Promise<T[]> {
	const index = store.index(indexName);
	return idbRequest<T[]>(index.getAll(query) as IDBRequest<T[]>);
}

// ─── Reset (useful for dev / testing) ────────────────────────────────────────

export async function deleteDB(): Promise<void> {
	_db?.close();
	_db = null;
	await idbRequest(indexedDB.deleteDatabase(DB_NAME));
}
