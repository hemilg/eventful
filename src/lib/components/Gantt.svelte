<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { ScheduleBlock } from '../types.js';

	interface Props {
		schedule: ScheduleBlock[];
	}

	let { schedule }: Props = $props();

	// Sort defensively so out-of-order input doesn't break the layout.
	let sortedSchedule = $derived(
		[...schedule].sort(
			(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
		)
	);

	/**
	 * Group blocks by day. Returns a Map<dateString, ScheduleBlock[]> where
	 * dateString is the ISO date (YYYY-MM-DD) derived from each block's startTime.
	 */
	function groupByDay(blocks: ScheduleBlock[]): Map<string, ScheduleBlock[]> {
		const groups = new Map<string, ScheduleBlock[]>();

		for (const block of blocks) {
			const date = new Date(block.startTime);
			// Use UTC to avoid timezone-related day boundary issues.
			const dateString = date.toISOString().split('T')[0];

			if (!groups.has(dateString)) {
				groups.set(dateString, []);
			}
			groups.get(dateString)?.push(block);
		}

		return groups;
	}

	let dayGroups = $derived(groupByDay(sortedSchedule));

	// Derive a sorted list of days for stable iteration.
	let sortedDays = $derived(Array.from(dayGroups.keys()).sort());

	/**
	 * Calculate the position and width of a block within its day.
	 * Returns {left, width} as percentages (0-100) of the day's 24h span.
	 */
	function getBlockPosition(block: ScheduleBlock) {
		const start = new Date(block.startTime);
		const end = new Date(block.endTime);

		// Get the day boundary in UTC to match our grouping logic.
		const dayStart = new Date(start.toISOString().split('T')[0]);
		const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

		const dayDuration = dayEnd.getTime() - dayStart.getTime();
		const blockStart = Math.max(start.getTime(), dayStart.getTime());
		const blockEnd = Math.min(end.getTime(), dayEnd.getTime());

		const left = ((blockStart - dayStart.getTime()) / dayDuration) * 100;
		const width = ((blockEnd - blockStart) / dayDuration) * 100;

		return { left: Math.max(0, left), width: Math.max(0, width) };
	}

	/**
	 * Format a date string (YYYY-MM-DD) into a human-readable day label.
	 */
	function formatDayLabel(dateString: string): string {
		const date = new Date(dateString + 'T00:00:00Z');
		const formatter = new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
		return formatter.format(date);
	}
</script>

<div class="eventful-gantt" role="region" aria-label="Event schedule by day">
	{#each sortedDays as day (day)}
		{@const dayBlocks = dayGroups.get(day) ?? []}
		<div
			class="eventful-gantt__day"
			transition:fade={{ duration: 200 }}
		>
			<div class="eventful-gantt__day-label">
				<span class="eventful-gantt__day-date">{formatDayLabel(day)}</span>
			</div>
			<div class="eventful-gantt__day-track">
				{#each dayBlocks as block (block.id)}
					{@const { left, width } = getBlockPosition(block)}
					<div
						class="eventful-gantt__block"
						style:left="{left}%"
						style:width="{width}%"
						title="{block.title}"
						role="listitem"
					>
						<span class="eventful-gantt__block-title">{block.title}</span>
						{#if block.description}
							<span class="eventful-gantt__block-description">{block.description}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.eventful-gantt {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		padding: 1rem 0;
	}

	.eventful-gantt__day {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 1rem;
		align-items: flex-start;
	}

	.eventful-gantt__day-label {
		padding-top: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--eventful-day-label-fg, rgba(0, 0, 0, 0.7));
	}

	.eventful-gantt__day-date {
		display: block;
	}

	.eventful-gantt__day-track {
		position: relative;
		height: 4rem;
		background: var(--eventful-track-bg, rgba(0, 0, 0, 0.06));
		border-radius: 0.375rem;
		overflow: hidden;
	}

	.eventful-gantt__block {
		position: absolute;
		top: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0.5rem;
		background: var(--eventful-block-bg, rgba(0, 0, 0, 0.12));
		border-radius: 0.375rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		/* Only transform/opacity animate — no layout-affecting transitions. */
		transition:
			transform 200ms ease,
			opacity 200ms ease,
			background-color 200ms ease;
		cursor: pointer;
		overflow: hidden;
	}

	.eventful-gantt__block:hover {
		background: var(--eventful-block-hover-bg, rgba(0, 0, 0, 0.18));
		transform: scale(1.02);
	}

	.eventful-gantt__block-title {
		font-size: 0.75rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.2;
	}

	.eventful-gantt__block-description {
		font-size: 0.65rem;
		color: var(--eventful-block-description-fg, rgba(0, 0, 0, 0.6));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-top: 0.125rem;
	}
</style>
