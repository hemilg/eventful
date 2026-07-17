/**
 * Thin, typed wrappers around Cloudflare D1 and KV bindings.
 *
 * These are NOT an ORM and define no app-specific schema or keys —
 * consuming apps own their own tables/records and build on top of these
 * generic helpers.
 */

/**
 * Wraps a `D1Database` binding with generically typed query helpers.
 *
 * @example
 * ```ts
 * const db = new D1Client<{ id: number; name: string }>(platform.env.DB);
 * const rows = await db.all('SELECT * FROM my_table WHERE id = ?', [1]);
 * ```
 */
export class D1Client {
	constructor(private readonly db: D1Database) {}

	/** Run a query and return all result rows, typed by the caller. */
	async all<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
		const stmt = params.length ? this.db.prepare(query).bind(...params) : this.db.prepare(query);
		const result = await stmt.all<T>();
		return result.results ?? [];
	}

	/** Run a query and return the first result row (or `null`), typed by the caller. */
	async first<T = unknown>(query: string, params: unknown[] = []): Promise<T | null> {
		const stmt = params.length ? this.db.prepare(query).bind(...params) : this.db.prepare(query);
		return stmt.first<T>();
	}

	/** Run a write/DDL statement, returning D1's metadata about the operation. */
	async run(query: string, params: unknown[] = []): Promise<D1Result> {
		const stmt = params.length ? this.db.prepare(query).bind(...params) : this.db.prepare(query);
		return stmt.run();
	}

	/** Prepare a query statement for use with `batch()` or standalone execution. */
	prepare(query: string): D1PreparedStatement {
		return this.db.prepare(query);
	}

	/** Execute multiple prepared statements atomically (or near-atomically on D1). */
	async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
		return this.db.batch(statements);
	}

	/** Access the underlying binding directly for anything these helpers don't cover. */
	get raw(): D1Database {
		return this.db;
	}
}

/** Options accepted when writing a value to KV. */
export interface KVPutOptions {
	expirationTtl?: number;
	expiration?: number;
	metadata?: Record<string, unknown>;
}

/**
 * Wraps a `KVNamespace` binding with typed JSON get/put helpers.
 *
 * @example
 * ```ts
 * const kv = new KVClient<MyValue>(platform.env.MY_KV);
 * const value = await kv.getJSON('some-key');
 * ```
 */
export class KVClient<T = unknown> {
	constructor(private readonly kv: KVNamespace) {}

	/** Get a value and parse it as JSON, or `null` if absent/unparseable. */
	async getJSON(key: string): Promise<T | null> {
		return this.kv.get<T>(key, 'json');
	}

	/** Get a raw string value, or `null` if absent. */
	async getText(key: string): Promise<string | null> {
		return this.kv.get(key, 'text');
	}

	/** Serialize a value as JSON and write it to the given key. */
	async putJSON(key: string, value: T, options?: KVPutOptions): Promise<void> {
		await this.kv.put(key, JSON.stringify(value), options);
	}

	/** Write a raw string value to the given key. */
	async putText(key: string, value: string, options?: KVPutOptions): Promise<void> {
		await this.kv.put(key, value, options);
	}

	async delete(key: string): Promise<void> {
		await this.kv.delete(key);
	}

	/** Get multiple JSON values in parallel, returning a record of key → value (null if absent). */
	async getManyJSON(keys: string[]): Promise<Record<string, T | null>> {
		const results = await Promise.all(keys.map((key) => this.getJSON(key)));
		const record: Record<string, T | null> = {};
		for (let i = 0; i < keys.length; i++) {
			record[keys[i]] = results[i];
		}
		return record;
	}

	/** Write multiple JSON values in parallel. */
	async putManyJSON(entries: Record<string, T>, options?: KVPutOptions): Promise<void> {
		await Promise.all(
			Object.entries(entries).map(([key, value]) => this.putJSON(key, value, options))
		);
	}

	/** List all keys matching the given prefix, handling pagination automatically. */
	async listWithPrefix(prefix: string): Promise<string[]> {
		const keys: string[] = [];
		let cursor: string | undefined;
		let list_complete = false;

		while (!list_complete) {
			const result = await this.kv.list({ prefix, cursor });
			keys.push(...result.keys.map((k) => k.name));
			list_complete = result.list_complete;
			if (!list_complete) {
				cursor = (result as { cursor?: string }).cursor;
			}
		}

		return keys;
	}

	/** Access the underlying binding directly for anything these helpers don't cover. */
	get raw(): KVNamespace {
		return this.kv;
	}
}
