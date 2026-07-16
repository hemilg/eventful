/**
 * Zod runtime validation schemas for EventData and its nested types.
 *
 * These schemas mirror the shapes defined in ../types.ts and provide runtime
 * validation at tRPC procedure boundaries. The z.infer types should structurally
 * match the TypeScript interfaces in types.ts.
 */

import { z } from 'zod';

/** Zod schema for EventLocation. */
export const EventLocationSchema = z.object({
	id: z.string(),
	name: z.string(),
	address: z.string().optional(),
	lat: z.number().optional(),
	lng: z.number().optional()
});

export type EventLocationZod = z.infer<typeof EventLocationSchema>;

/** Zod schema for ScheduleBlock. */
export const ScheduleBlockSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	startTime: z.string(), // ISO 8601 timestamp
	endTime: z.string(), // ISO 8601 timestamp
	locationId: z.string().optional()
});

export type ScheduleBlockZod = z.infer<typeof ScheduleBlockSchema>;

/** Zod schema for Participant. */
export const ParticipantSchema = z.object({
	id: z.string(),
	name: z.string()
});

export type ParticipantZod = z.infer<typeof ParticipantSchema>;

/** Zod schema for EventData. */
export const EventDataSchema = z.object({
	locations: z.array(EventLocationSchema),
	schedule: z.array(ScheduleBlockSchema),
	participants: z.array(ParticipantSchema)
});

export type EventDataZod = z.infer<typeof EventDataSchema>;
