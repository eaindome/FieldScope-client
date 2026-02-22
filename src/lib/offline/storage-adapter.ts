/**
 * localStorage adapter — mirrors the IndexedDB surface so submissions.ts,
 * sync.ts, and cache.ts can use the same API in test mode.
 *
 * Data is stored as JSON under namespaced keys:
 *   fieldscope_offline::<storeName>::<key>
 * An index key is kept per store:
 *   fieldscope_offline::<storeName>::__index__  → string[]
 *
 * autoIncrement() is used for stores that need numeric IDs (sync_queue).
 */

const NS = 'fieldscope_offline';

function storeKey(storeName: string, key: string | number): string {
	return `${NS}::${storeName}::${key}`;
}

function indexKey(storeName: string): string {
	return `${NS}::${storeName}::__index__`;
}

function counterKey(storeName: string): string {
	return `${NS}::${storeName}::__counter__`;
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

function readIndex(storeName: string): (string | number)[] {
	try {
		return JSON.parse(localStorage.getItem(indexKey(storeName)) ?? '[]');
	} catch {
		return [];
	}
}

function writeIndex(storeName: string, keys: (string | number)[]): void {
	localStorage.setItem(indexKey(storeName), JSON.stringify(keys));
}

function readItem<T>(storeName: string, key: string | number): T | null {
	try {
		const raw = localStorage.getItem(storeKey(storeName, key));
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

// ─── Public adapter ───────────────────────────────────────────────────────────

export const localStorageAdapter = {
	/** Insert or replace a record. The keyPath is assumed to be 'localId' or 'id'. */
	put<T extends object>(storeName: string, item: T): void {
		const record = item as Record<string, unknown>;
		const key = (record['localId'] ?? record['id']) as string | number;
		if (key === undefined || key === null) {
			throw new Error(`localStorageAdapter.put: item has no 'localId' or 'id' field`);
		}
		localStorage.setItem(storeKey(storeName, key), JSON.stringify(record));

		// Maintain index
		const idx = readIndex(storeName);
		if (!idx.includes(key)) {
			idx.push(key);
			writeIndex(storeName, idx);
		}
	},

	/** Get a single record by key. Returns null if not found. */
	get<T>(storeName: string, key: string | number): T | null {
		return readItem<T>(storeName, key);
	},

	/** Get all records in a store. */
	getAll<T>(storeName: string): T[] {
		const idx = readIndex(storeName);
		return idx
			.map((k) => readItem<T>(storeName, k))
			.filter((v): v is T => v !== null);
	},

	/** Delete a record by key. */
	delete(storeName: string, key: string | number): void {
		localStorage.removeItem(storeKey(storeName, key));
		const idx = readIndex(storeName).filter((k) => k !== key);
		writeIndex(storeName, idx);
	},

	/** Clear all records in a store. */
	clear(storeName: string): void {
		const idx = readIndex(storeName);
		idx.forEach((k) => localStorage.removeItem(storeKey(storeName, k)));
		localStorage.removeItem(indexKey(storeName));
		localStorage.removeItem(counterKey(storeName));
	},

	/**
	 * Return the next auto-increment number for stores like sync_queue.
	 * Persisted across reloads.
	 */
	autoIncrement(storeName: string): number {
		const raw = localStorage.getItem(counterKey(storeName));
		const next = (raw ? parseInt(raw, 10) : 0) + 1;
		localStorage.setItem(counterKey(storeName), String(next));
		return next;
	}
};
