/**
 * Cache layer for projects and forms.
 *
 * Provides TTL-based caching so the agent has fresh data after sync
 * but still works fully offline after the cache has been populated.
 *
 * Default TTL: 24 hours (configurable per call).
 */

import { isTestMode } from '$lib/config';
import { openDB, idbRequest, STORE } from './db';
import { localStorageAdapter } from './storage-adapter';

// ─── TTL ─────────────────────────────────────────────────────────────────────

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isExpired(cachedAt: string, ttlMs: number): boolean {
	return Date.now() - new Date(cachedAt).getTime() > ttlMs;
}

// ─── Generic IDB cache helpers ────────────────────────────────────────────────

async function setIDB<T>(storeName: string, id: number, data: T, extra?: Record<string, unknown>): Promise<void> {
	const db = await openDB();
	const tx = db.transaction(storeName, 'readwrite');
	await idbRequest(
		tx.objectStore(storeName).put({
			id,
			data,
			cachedAt: new Date().toISOString(),
			...extra
		})
	);
}

async function getIDB<T>(
	storeName: string,
	id: number,
	ttlMs: number
): Promise<T | null> {
	const db = await openDB();
	const tx = db.transaction(storeName, 'readonly');
	const entry = await idbRequest<{ id: number; data: T; cachedAt: string } | undefined>(
		tx.objectStore(storeName).get(id)
	);
	if (!entry) return null;
	if (isExpired(entry.cachedAt, ttlMs)) return null;
	return entry.data;
}

// ─── Generic localStorage cache helpers ───────────────────────────────────────

function setLS<T>(storeName: string, key: number, data: T, extra?: Record<string, unknown>): void {
	localStorageAdapter.put(storeName, {
		id: key,
		data,
		cachedAt: new Date().toISOString(),
		...extra
	});
}

function getLS<T>(storeName: string, key: number, ttlMs: number): T | null {
	const entry = localStorageAdapter.get<{ id: number; data: T; cachedAt: string }>(storeName, key);
	if (!entry) return null;
	if (isExpired(entry.cachedAt, ttlMs)) return null;
	return entry.data;
}

// ─── Well-known cache key ────────────────────────────────────────────────────

// All projects are stored under a single entry (list cache)
const ALL_PROJECTS_KEY = 0;

// ─── Projects ────────────────────────────────────────────────────────────────

/**
 * Cache the full list of projects (as returned by the API).
 */
export async function cacheProjects<T>(projects: T[], ttlMs = DEFAULT_TTL_MS): Promise<void> {
	void ttlMs; // stored implicitly via cachedAt + checked on read
	if (isTestMode()) {
		setLS(STORE.PROJECTS_CACHE, ALL_PROJECTS_KEY, projects);
	} else {
		await setIDB(STORE.PROJECTS_CACHE, ALL_PROJECTS_KEY, projects);
	}
}

/**
 * Get cached projects. Returns null if cache is empty or expired.
 */
export async function getCachedProjects<T>(ttlMs = DEFAULT_TTL_MS): Promise<T[] | null> {
	if (isTestMode()) {
		return getLS<T[]>(STORE.PROJECTS_CACHE, ALL_PROJECTS_KEY, ttlMs);
	}
	return getIDB<T[]>(STORE.PROJECTS_CACHE, ALL_PROJECTS_KEY, ttlMs);
}

/**
 * Invalidate the projects cache immediately.
 */
export async function clearProjectsCache(): Promise<void> {
	if (isTestMode()) {
		localStorageAdapter.delete(STORE.PROJECTS_CACHE, ALL_PROJECTS_KEY);
	} else {
		const db = await openDB();
		const tx = db.transaction(STORE.PROJECTS_CACHE, 'readwrite');
		await idbRequest(tx.objectStore(STORE.PROJECTS_CACHE).delete(ALL_PROJECTS_KEY));
	}
}

// ─── Forms ───────────────────────────────────────────────────────────────────

/**
 * Cache forms for a specific project.
 * Each project's forms are stored as a single entry keyed by projectId.
 */
export async function cacheForms<T>(
	forms: T[],
	projectId: number,
	ttlMs = DEFAULT_TTL_MS
): Promise<void> {
	void ttlMs;
	if (isTestMode()) {
		setLS(STORE.FORMS_CACHE, projectId, forms, { projectId });
	} else {
		await setIDB(STORE.FORMS_CACHE, projectId, forms, { projectId });
	}
}

/**
 * Get cached forms for a project. Returns null if missing or expired.
 */
export async function getCachedForms<T>(
	projectId: number,
	ttlMs = DEFAULT_TTL_MS
): Promise<T[] | null> {
	if (isTestMode()) {
		return getLS<T[]>(STORE.FORMS_CACHE, projectId, ttlMs);
	}
	return getIDB<T[]>(STORE.FORMS_CACHE, projectId, ttlMs);
}

/**
 * Invalidate the forms cache for a specific project.
 */
export async function clearFormsCache(projectId: number): Promise<void> {
	if (isTestMode()) {
		localStorageAdapter.delete(STORE.FORMS_CACHE, projectId);
	} else {
		const db = await openDB();
		const tx = db.transaction(STORE.FORMS_CACHE, 'readwrite');
		await idbRequest(tx.objectStore(STORE.FORMS_CACHE).delete(projectId));
	}
}

/**
 * Invalidate all cache stores at once.
 */
export async function clearAllCaches(): Promise<void> {
	if (isTestMode()) {
		localStorageAdapter.clear(STORE.PROJECTS_CACHE);
		localStorageAdapter.clear(STORE.FORMS_CACHE);
	} else {
		const db = await openDB();
		for (const storeName of [STORE.PROJECTS_CACHE, STORE.FORMS_CACHE]) {
			const tx = db.transaction(storeName, 'readwrite');
			await idbRequest(tx.objectStore(storeName).clear());
		}
	}
}
