/** Public API surface of the eventful package. */

export type { EventLocation, ScheduleBlock, Participant, EventData } from './types.js';

export { HIGHLIGHT_SPRING, LAYOUT_SPRING, SCRUB_TWEEN, fadeScale, clampFraction } from './motion.js';

export { D1Client, KVClient } from './db.js';
export type { KVPutOptions } from './db.js';

export { default as Timeline } from './components/Timeline.svelte';
export { default as Gantt } from './components/Gantt.svelte';
