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

Add it to another SvelteKit project with Bun:

```sh
bun add github:hemilg/eventful
```

Then import the pieces you need, e.g.:

```svelte
<script lang="ts">
	import { Timeline } from 'eventful';
</script>
```

Exact exports live under `src/lib` and are built into a publishable package via
`@sveltejs/package` (see `bun run package`).

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
