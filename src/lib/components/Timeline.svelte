<script lang="ts">
	// TODO: this is the "live happening now" timeline only. A day-by-day
	// Gantt/calendar-style view is a deliberate follow-up — see TODO.md.

	import { Tween, Spring, prefersReducedMotion } from 'svelte/motion';
	import { HIGHLIGHT_SPRING } from '../motion.js';
	import type { ScheduleBlock } from '../types.js';

	interface Props {
		schedule: ScheduleBlock[];
		/** Injectable clock for testing/storybook scrubbing; defaults to the real current time. */
		now?: Date;
	}

	let { schedule, now = new Date() }: Props = $props();

	// Sort defensively so out-of-order input doesn't break the timeline math.
	let sortedSchedule = $derived(
		[...schedule].sort(
			(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
		)
	);

	let rangeStart = $derived(
		sortedSchedule.length ? new Date(sortedSchedule[0].startTime).getTime() : 0
	);
	let rangeEnd = $derived(
		sortedSchedule.length
			? new Date(sortedSchedule[sortedSchedule.length - 1].endTime).getTime()
			: 0
	);
	let rangeDuration = $derived(Math.max(1, rangeEnd - rangeStart));

	function fractionFor(time: string): number {
		const t = new Date(time).getTime();
		return Math.min(1, Math.max(0, (t - rangeStart) / rangeDuration));
	}

	let currentBlock = $derived(
		sortedSchedule.find((block) => {
			const start = new Date(block.startTime).getTime();
			const end = new Date(block.endTime).getTime();
			return now.getTime() >= start && now.getTime() < end;
		}) ?? null
	);

	// The highlight marker's horizontal position (0-1 fraction), animated
	// with a Tween so it glides between blocks instead of jumping.
	// `Tween` is SSR-safe: it just holds a value until the browser animates it.
	// Respects prefers-reduced-motion by skipping animation when enabled.
	const markerPosition = new Tween(0, { duration: 400, easing: (t) => t * (2 - t) });

	$effect(() => {
		const target = currentBlock ? fractionFor(currentBlock.startTime) : 0;
		if (prefersReducedMotion.current) {
			markerPosition.set(target, { duration: 0 });
		} else {
			markerPosition.target = target;
		}
	});

	// Highlight "pulse" scale, driven by a Spring for a subtle organic feel.
	// Skips animation if user prefers reduced motion.
	const highlightScale = new Spring(1, HIGHLIGHT_SPRING);

	$effect(() => {
		// Nudge the scale on block change to draw attention; the spring
		// settles back to 1 on its own thanks to its target/damping.
		currentBlock;
		if (prefersReducedMotion.current) {
			highlightScale.set(1, { instant: true });
		} else {
			highlightScale.set(1.08, { instant: true });
			highlightScale.target = 1;
		}
	});
</script>

<div class="eventful-timeline" role="list" aria-label="Event schedule timeline">
	<div class="eventful-timeline__track">
		{#each sortedSchedule as block (block.id)}
			{@const isCurrent = currentBlock?.id === block.id}
			<div
				class="eventful-timeline__block"
				class:is-current={isCurrent}
				role="listitem"
				style:left="{fractionFor(block.startTime) * 100}%"
				style:width="{(fractionFor(block.endTime) - fractionFor(block.startTime)) * 100}%"
			>
				<span class="eventful-timeline__title">{block.title}</span>
			</div>
		{/each}

		<div
			class="eventful-timeline__marker"
			style:transform="translateX({markerPosition.current * 100}%) scale({highlightScale.current})"
			aria-hidden="true"
		></div>
	</div>
</div>

<style>
	.eventful-timeline {
		position: relative;
		width: 100%;
		padding: 1rem 0;
	}

	.eventful-timeline__track {
		position: relative;
		height: 3rem;
		background: var(--eventful-track-bg, rgba(0, 0, 0, 0.06));
		border-radius: 999px;
	}

	.eventful-timeline__block {
		position: absolute;
		top: 0;
		height: 100%;
		border-radius: 999px;
		display: flex;
		align-items: center;
		padding-inline: 0.5rem;
		overflow: hidden;
		white-space: nowrap;
		background: var(--eventful-block-bg, rgba(0, 0, 0, 0.12));
		/* Only transform/opacity animate — no layout-affecting transitions here. */
		transition:
			transform 200ms ease,
			opacity 200ms ease;
	}

	.eventful-timeline__block.is-current {
		background: var(--eventful-block-active-bg, rgba(59, 130, 246, 0.9));
		color: var(--eventful-block-active-fg, white);
		transform: scale(1.03);
	}

	.eventful-timeline__title {
		font-size: 0.75rem;
		text-overflow: ellipsis;
		overflow: hidden;
	}

	.eventful-timeline__marker {
		position: absolute;
		top: -0.25rem;
		left: 0;
		width: 0.5rem;
		height: calc(100% + 0.5rem);
		border-radius: 999px;
		background: var(--eventful-marker-bg, rgba(239, 68, 68, 0.9));
		transform-origin: center;
		will-change: transform;
		pointer-events: none;
	}
</style>
