/** Public API surface of the eventful package. */

export type { EventLocation, ScheduleBlock, Participant, EventData } from './types.js';

export { HIGHLIGHT_SPRING, LAYOUT_SPRING, SCRUB_TWEEN, fadeScale, clampFraction } from './motion.js';

export { D1Client, KVClient } from './db.js';
export type { KVPutOptions } from './db.js';

export { default as Timeline } from './components/Timeline.svelte';

// EventStore: strongly-typed data persistence with tRPC
export { eventStoreRouter } from './store/router.js';
export type { EventStore, EventStoreRouter } from './store/router.js';
export { createD1EventStore } from './store/d1-adapter.js';
export {
	EventLocationSchema,
	ScheduleBlockSchema,
	ParticipantSchema,
	EventDataSchema
} from './store/schema.js';
export type {
	EventLocationZod,
	ScheduleBlockZod,
	ParticipantZod,
	EventDataZod
} from './store/schema.js';
