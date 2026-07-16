/**
 * EventStore tRPC router contract and implementation.
 *
 * The EventStore interface defines a strongly-typed contract that any backend
 * can implement (D1, Postgres, etc.). The tRPC router wraps this contract for
 * network-safe procedure invocation with automatic Zod validation.
 */

import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import type { EventData } from '../types.js';
import { EventDataSchema } from './schema.js';

/**
 * The EventStore interface defines the contract that all event data backends must implement.
 *
 * @remarks
 * - All methods are async to support both local and remote data sources.
 * - `getEvent` returns null if the event does not exist, never throws.
 * - `saveEvent` overwrites any existing event with the same ID.
 */
export interface EventStore {
	/**
	 * Retrieve an event by ID.
	 * @param id - The unique identifier for the event.
	 * @returns The EventData if found, or null if not found.
	 */
	getEvent(id: string): Promise<EventData | null>;

	/**
	 * Save or update an event.
	 * @param id - The unique identifier for the event.
	 * @param data - The complete EventData to persist.
	 */
	saveEvent(id: string, data: EventData): Promise<void>;
}

/**
 * Context object passed to tRPC procedures.
 */
export interface EventStoreContext {
	store: EventStore;
}

/** Create a tRPC instance configured for EventStore operations. */
const t = initTRPC.context<EventStoreContext>().create();

/**
 * The EventStore tRPC router.
 *
 * Exposes two public procedures:
 * - `getEvent`: Retrieve an event by ID (returns null if not found).
 * - `saveEvent`: Save or update an event.
 *
 * All inputs are validated with Zod schemas before reaching the context store.
 */
export const eventStoreRouter = t.router({
	getEvent: t.procedure
		.input(z.object({ id: z.string() }))
		.output(EventDataSchema.nullable())
		.query(async ({ ctx, input }) => {
			return ctx.store.getEvent(input.id);
		}),

	saveEvent: t.procedure
		.input(z.object({ id: z.string(), data: EventDataSchema }))
		.output(z.void())
		.mutation(async ({ ctx, input }) => {
			await ctx.store.saveEvent(input.id, input.data);
		})
});

/** Type helper to extract types from the eventStoreRouter for client generation. */
export type EventStoreRouter = typeof eventStoreRouter;
