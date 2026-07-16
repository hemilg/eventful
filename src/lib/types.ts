/**
 * Generic event-planning data types.
 *
 * These types are intentionally generic (not tied to any specific kind of
 * event, e.g. a bachelor trip, wedding, conference) so this package can be
 * reused across different consuming apps. Consuming apps own their own
 * app-specific schema/naming on top of these shapes.
 */

/** A physical or virtual place associated with an event. */
export interface EventLocation {
	id: string;
	name: string;
	address?: string;
	/** Latitude in decimal degrees, if known. */
	lat?: number;
	/** Longitude in decimal degrees, if known. */
	lng?: number;
}

/** A single block of time in an event's schedule. */
export interface ScheduleBlock {
	id: string;
	title: string;
	description?: string;
	/** ISO 8601 timestamp. */
	startTime: string;
	/** ISO 8601 timestamp. */
	endTime: string;
	/** References an {@link EventLocation.id}, if this block happens at a known location. */
	locationId?: string;
}

/** A person attending or participating in an event. */
export interface Participant {
	id: string;
	name: string;
}

/** Top-level composed shape describing an entire event. */
export interface EventData {
	locations: EventLocation[];
	schedule: ScheduleBlock[];
	participants: Participant[];
}
