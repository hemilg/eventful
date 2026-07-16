(A) Merge project skeleton (package.json, svelte.config.js, wrangler.jsonc, app shell, demo page) with src/lib scaffolding, resolve any conflicts +setup @git
(A) Confirm @cloudflare/workers-types is wired into tsconfig so D1Client/KVClient ambient types resolve, then run a full svelte-check/tsc pass +setup @code
(A) Wire demo page to actually render Timeline against sample EventData to validate the component end-to-end +demo @code
(B) Build day-by-day Gantt/calendar-style schedule visualization component (deferred from Timeline work) +visualization @code
(B) Add more thorough D1 client features: batching helper (db.batch), transaction-style multi-statement helpers +db @code
(B) Add more thorough KV client features: bulk get/put helpers, list-with-prefix helper +db @code
(B) Write interactive `bun run init` provisioning wizard: walks a new user through creating their own D1 database + KV namespace + R2 bucket via wrangler CLI calls, warns before any resource-creating/billing-relevant command runs, plain script (no compiled binary) +init @code
(B) Add unit tests for Timeline's current-block detection and fraction math (Vitest) +testing @testing
(C) Add basic tests/harness for D1Client/KVClient against Miniflare or wrangler's local D1/KV emulation +testing @testing
(C) Write publishing/consumption docs: how another SvelteKit app adds eventful as a git dependency, what it exports, how to type the Cloudflare bindings it expects +docs @docs
(C) Document clearly that consuming apps (e.g. the planned "bachelor-trip" site) own their own app-specific D1 schema/migrations — eventful never bakes in app-specific tables or keys +docs @docs
(C) Add reduced-motion handling to Timeline (respect prefers-reduced-motion, skip/shorten Tween and Spring animations) +accessibility @code
(D) Add scrubbing UI (drag/slider) on top of Timeline's existing `now` override support +visualization @code
(D) Consider exposing themeable CSS custom properties more formally (currently ad hoc `--eventful-*` vars in Timeline) +design @code
(D) Evaluate whether EventLocation needs richer geo helpers (distance, bounding box) once a real consumer needs them +types @research
(D) Explore cross-framework reach via Svelte custom elements (`customElement: true` compiler option) — Timeline/Gantt could export as web components for use in React, Vue, etc., but this trades away SSR safety (shadow DOM is invisible until JS loads) for interop; defer until there's an actual non-Svelte consumer +interop @research
