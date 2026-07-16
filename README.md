# eventful

A reusable event-planning toolkit for SvelteKit + Cloudflare.

`eventful` provides:

- A generic, SSR-friendly data model for "an event" - locations, schedule blocks, and participants
- An animatable SVG UI for visualizing schedules and timelines
- Thin client wrapper helpers for Cloudflare D1 and KV storage

It's designed to be consumed two ways:

1. **As a git dependency** inside another SvelteKit app, importing components and helpers from
   `eventful` directly.
2. **Cloned and deployed standalone** as a minimal demo/dev Cloudflare Worker, useful for
   developing the library itself or as a starting point for a new event site.

## Using eventful as a dependency

### Installation

Add eventful to another SvelteKit project with Bun:

```sh
bun add github:hemilg/eventful
```

Eventful exports are built via `@sveltejs/package` and published to a `dist/` folder when you run `bun run package`.

### Exported types and components

Eventful exports the following from its public API:

**Types** (for use in your app's data model):

```typescript
import type {
	EventLocation,    // Geographic location with coordinates
	ScheduleBlock,    // Time-bounded event (startTime, endTime, title, id)
	Participant,      // Event attendee (name, email, optional notes)
	EventData         // Top-level event container with locations, schedule, participants
} from 'eventful';
```

**Components** (SSR-safe Svelte 5 components):

```svelte
<script lang="ts">
	import { Timeline } from 'eventful';
	// An animated timeline showing the current moment and schedule blocks
</script>

<Timeline schedule={blocks} now={currentTime} />
```

**Motion helpers** (for custom animations):

```typescript
import {
	HIGHLIGHT_SPRING,   // SpringOptions preset for UI highlights
	LAYOUT_SPRING,      // SpringOptions preset for larger layout shifts
	SCRUB_TWEEN,        // TweenOptions preset for scrubber/progress animations
	fadeScale,          // CSS transition helper for fade+scale effects
	clampFraction       // Utility to clamp fractional positions (0-1)
} from 'eventful';
```

**Cloudflare storage clients** (for backend integration):

```typescript
import { D1Client, KVClient } from 'eventful';
import type { KVPutOptions } from 'eventful';
// D1Client: Thin wrapper for Cloudflare D1 (SQLite) database
// KVClient: Thin wrapper for Cloudflare KV (key-value) storage
```

### Cloudflare bindings in consuming apps

If your consuming app needs to access Cloudflare D1 or KV storage alongside eventful's clients, you must wire up the Cloudflare bindings yourself.

In your consuming app's `wrangler.jsonc`:

```jsonc
{
	"env": {
		"production": {
			"d1_databases": [
				{
					"binding": "DB",
					"database_name": "your-app-db",
					"database_id": "your-id"
				}
			],
			"kv_namespaces": [
				{
					"binding": "KV",
					"id": "your-kv-namespace-id"
				}
			]
		}
	}
}
```

Type these bindings in your app via `@cloudflare/workers-types` and Wrangler's generated `worker-configuration.d.ts`:

```typescript
// In your +server.ts or other server code
import type { PlatformProxy } from 'wrangler';

declare global {
	var platform: Readonly<PlatformProxy<Env>>;
}

export async function GET({ platform }) {
	const db = platform?.env?.DB;      // D1Database
	const kv = platform?.env?.KV;      // KVNamespace
	// Use eventful's D1Client and KVClient to wrap these bindings
}
```

### App-specific schemas and migrations

**Critical:** Consuming apps own their own app-specific D1 schema and migrations.

Eventful provides generic, backend-agnostic storage clients (`D1Client` and `KVClient`) but does **not** bake in app-specific database tables, keys, or migrations. This ensures eventful remains composable and doesn't dictate your app's data model.

When you use eventful in a new site (e.g., a "bachelor-trip" planner):

1. Create your own D1 migrations (e.g., `migrations/001_create_trips.sql`)
2. Define your own schema for your use case
3. Use eventful's `D1Client` to query; use `KVClient` for simple key-value caching
4. Eventful's components and types remain available regardless of your app's database design

This separation keeps eventful reusable across many different event-planning contexts.

## Running standalone

Clone the repo and use Bun for all tooling (not npm/pnpm):

```sh
bun install
bun run dev       # Vite dev server with HMR
bun run build     # SvelteKit production build
bun run preview   # Build + run under Wrangler (closest to production)
bun run check     # svelte-check + TypeScript strict mode
bun run format    # Prettier
bun run package   # Build src/lib into a publishable package (dist/)
```

The standalone app deploys as the `eventful-demo` Cloudflare Worker (see `wrangler.jsonc`) - a
minimal demo/dev target, not a production customer-facing site.

## Tech stack

- SvelteKit 5 (SSR, TypeScript strict mode)
- Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- Tailwind CSS v4
- Bun for package management and scripts

## License

MIT - see [LICENSE](./LICENSE). Free to use, fork, and adapt in your own projects.
