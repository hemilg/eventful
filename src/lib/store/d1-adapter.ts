/**
 * D1-backed EventStore adapter.
 *
 * This adapter implements the EventStore interface using Cloudflare D1 as the
 * underlying storage backend. It provides a drop-in implementation for the
 * generic EventStore contract, allowing consuming apps to persist EventData
 * to D1 with automatic JSON serialization.
 */

import { D1Client } from '../db.js';
import type { EventData } from '../types.js';
import type { EventStore } from './router.js';

/**
 * Reference schema for consuming apps to create in their D1 migrations.
 *
 * Consuming apps are responsible for running their own D1 migrations;
 * this is provided as reference documentation only.
 *
 * @example Create the table with:
 * ```sql
 * CREATE TABLE events (
 *   id TEXT PRIMARY KEY,
 *   data TEXT NOT NULL,
 *   created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TEXT DEFAULT CURRENT_TIMESTAMP
 * );
 * ```
 */

/**
 * D1-backed EventStore implementation.
 *
 * Stores complete EventData objects as JSON-serialized text in a simple
 * single-table schema. Reads and writes are atomic at the single-event level.
 */
export class D1EventStore implements EventStore {
	private readonly db: D1Client;

	constructor(d1: D1Database) {
		this.db = new D1Client(d1);
	}

	async getEvent(id: string): Promise<EventData | null> {
		const row = await this.db.first<{ data: string }>(
			'SELECT data FROM events WHERE id = ?',
			[id]
		);

		if (!row) {
			return null;
		}

		try {
			return JSON.parse(row.data) as EventData;
		} catch {
			// Malformed JSON in database; return null to signal retrieval failure
			return null;
		}
	}

	async saveEvent(id: string, data: EventData): Promise<void> {
		const dataJson = JSON.stringify(data);

		// Upsert: insert if not exists, update if already present
		await this.db.run(
			`
				INSERT INTO events (id, data, created_at, updated_at)
				VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
				ON CONFLICT(id) DO UPDATE SET
					data = ?,
					updated_at = CURRENT_TIMESTAMP
			`,
			[id, dataJson, dataJson]
		);
	}
}

/**
 * Factory function to create a D1EventStore instance.
 *
 * @param d1 - The D1Database binding from Cloudflare Workers.
 * @returns An EventStore implementation backed by D1.
 *
 * @example
 * ```ts
 * export const POST: RequestHandler = async ({ platform }) => {
 *   const store = createD1EventStore(platform.env.DB);
 *   // ... use store.getEvent(id) and store.saveEvent(id, data)
 * };
 * ```
 */
export function createD1EventStore(d1: D1Database): EventStore {
	return new D1EventStore(d1);
}
