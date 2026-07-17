# eventful

A reusable event-planning toolkit for SvelteKit + Cloudflare.

`eventful` provides:

- A generic, SSR-friendly data model for "an event" - locations, schedule blocks, and participants
- An animatable SVG UI for visualizing schedules and timelines (`Timeline`, `Gantt`)
- Thin client wrapper helpers for Cloudflare D1 and KV storage, including batch/bulk operations
- A strongly-typed `EventStore` contract (tRPC + Zod) with a ready-made D1-backed adapter, so
  consuming apps get a swappable storage boundary instead of hand-rolling their own persistence API

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
	import { Timeline, Gantt } from 'eventful';
	// Timeline: an animated "happening now" view of schedule blocks
	// Gantt: a day-by-day calendar-style visualization of the same schedule
</script>

<Timeline schedule={blocks} now={currentTime} />
<Gantt schedule={blocks} />
```

`Timeline` respects `prefers-reduced-motion` automatically, skipping/shortening its Tween and
Spring animations when the user has that preference set.

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

const db = new D1Client(platform.env.DB);
await db.all('SELECT * FROM my_table WHERE id = ?', [1]);
await db.batch([db.prepare('INSERT INTO t (a) VALUES (1)'), db.prepare('INSERT INTO t (a) VALUES (2)')]);

const kv = new KVClient<MyValue>(platform.env.KV);
await kv.getManyJSON(['key-a', 'key-b']); // parallel bulk get
await kv.putManyJSON({ 'key-a': valueA, 'key-b': valueB }); // parallel bulk put
await kv.listWithPrefix('some-prefix:'); // auto-paginates
```

- `D1Client`: thin wrapper for Cloudflare D1, with `all`/`first`/`run` for single queries and
  `prepare`/`batch` for atomic multi-statement writes.
- `KVClient`: thin wrapper for Cloudflare KV, with single-key `getJSON`/`putJSON`/`getText`/
  `putText`/`delete` plus bulk `getManyJSON`/`putManyJSON` and paginated `listWithPrefix`.

**EventStore contract** (strongly-typed, swappable persistence boundary):

```typescript
import { eventStoreRouter, createD1EventStore } from 'eventful';
import type { EventStore } from 'eventful';

// D1-backed implementation, ready to use:
const store: EventStore = createD1EventStore(platform.env.DB);

// Or implement EventStore against any other backend (Postgres, etc) —
// the interface is just { getEvent(id), saveEvent(id, data) }.

// Mount the tRPC router (Zod-validated getEvent/saveEvent procedures) in your app's API layer:
const router = eventStoreRouter; // wire into your tRPC context/handler
```

`createD1EventStore` expects a single `events(id TEXT PRIMARY KEY, data TEXT)` table in your app's
own D1 database — see the SQL comment at the top of `src/lib/store/d1-adapter.ts` for the exact
schema to include in your own migrations (eventful never creates this table for you, per the
"consuming apps own their schema" principle below).

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
bun run init      # Interactive provisioning wizard (creates D1, KV, R2 resources)
bun run dev       # Vite dev server with HMR
bun run build     # SvelteKit production build
bun run preview   # Build + run under Wrangler (closest to production)
bun run check     # svelte-check + TypeScript strict mode
bun run format    # Prettier
bun run package   # Build src/lib into a publishable package (dist/)
```

### Initial Setup: `bun run init`

To deploy eventful standalone, you first need to provision Cloudflare resources:

```sh
bun run init
```

This interactive wizard will:

1. **Check your Wrangler login** - Ensures you're authenticated with Cloudflare
2. **Create a D1 database** - Serverless SQL database for event data
3. **Create a KV namespace** - Edge cache for fast data access
4. **Create an R2 bucket** - Object storage for event assets

Each step asks for confirmation before creating real resources. The wizard prints the binding IDs
you need to paste into `wrangler.jsonc`.

After `bun run init`, update `wrangler.jsonc` with the printed binding IDs, then:

```sh
bun run build     # Compile SvelteKit to Workers
bun run deploy    # Deploy to Cloudflare
```

The standalone app deploys as the `eventful-demo` Cloudflare Worker (see `wrangler.jsonc`) - a
minimal demo/dev target, not a production customer-facing site.

## Tech stack

- SvelteKit 5 (SSR, TypeScript strict mode)
- Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- Tailwind CSS v4
- Bun for package management and scripts

## Project status & roadmap

Current state: the core data model, both visualization components (`Timeline`, `Gantt`),
Cloudflare storage clients (`D1Client`/`KVClient`, including batch/bulk operations), and the
`EventStore` contract (tRPC + Zod, with a D1-backed adapter) are built and documented above.
`bun run check` is clean.

The authoritative, up-to-date task list lives in [`todo.txt`](./todo.txt) (standard
[todo.txt](https://github.com/todotxt/todo.txt) format: `(priority)` letters, `+project`/
`@context` tags, `seq:N` for build order, `adr:NNN` cross-referencing architecture decisions
recorded in the sibling `my-website` repo's `docs/ADR-*.md`). Read that file for the exact,
current backlog rather than trusting a prose summary to stay in sync — but at a glance:

- **Near-term (testing gap)**: neither `Timeline` nor `D1Client`/`KVClient` have automated test
  coverage yet (`seq:8`, `seq:9`), nor does the new `EventStore` D1 adapter (`seq:18`). This is
  the most load-bearing gap — everything else in the library is currently correctness-by-manual-
  verification only, not test-verified. The sibling `trips` repo (which depends on this library)
  has an established high-confidence testing pattern worth mirroring here: real edge cases and
  security/correctness-relevant negative paths via `vitest`, run against real bindings where
  possible (Miniflare/`@cloudflare/vitest-pool-workers`) rather than mocks.
- **Polish, not urgent**: a scrubbing/drag UI for `Timeline` (`seq:13`), formalizing the
  `--eventful-*` CSS custom properties as a real theming API (`seq:14`).
- **Deferred until a real need exists**: richer `EventLocation` geo helpers like distance/bounding
  box (`seq:15`) — no consumer needs this yet, adding it speculatively would be premature; and
  cross-framework reach via Svelte custom elements (`seq:16`), which would let `Timeline`/`Gantt`
  render inside React/Vue apps as native web components, at the cost of losing SSR safety (shadow
  DOM content is invisible until JS loads) — explicitly parked until a genuine non-Svelte consumer
  shows up, since it's a real architectural tradeoff, not a free win.
- **Not planned / explicitly out of scope**: `eventful` will not grow app-specific schema,
  authentication, or encryption logic of its own — that's a hard boundary (see the "App-specific
  schemas and migrations" section above, and `adr:001` in `my-website`). If a future consumer
  needs something like the `trips` repo's envelope-encryption model, that stays in the consuming
  app, not here.

## License

MIT - see [LICENSE](./LICENSE). Free to use, fork, and adapt in your own projects.
