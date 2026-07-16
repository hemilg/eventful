/**
 * Shared motion configuration for Svelte 5 rune-based animation primitives.
 *
 * Components should use `Tween`/`Spring` from `svelte/motion` (not the
 * legacy `tweened`/`spring` stores) together with these presets, and should
 * only animate transform/opacity (never layout-affecting properties like
 * `top`/`left`) so animations stay off the main thread where possible.
 */
import type { SpringOptions, TweenOptions } from 'svelte/motion';

/** Snappy, low-overshoot spring for small UI highlights (e.g. active timeline marker). */
export const HIGHLIGHT_SPRING: SpringOptions = {
	stiffness: 0.2,
	damping: 0.6
};

/** Gentler spring for larger layout shifts (e.g. moving between day views). */
export const LAYOUT_SPRING: SpringOptions = {
	stiffness: 0.08,
	damping: 0.8
};

/** Default tween for scrubber/progress style animations. */
export const SCRUB_TWEEN: TweenOptions<number> = {
	duration: 200,
	easing: (t) => t * (2 - t) // ease-out-quad
};

/**
 * CSS transition helper factory for use with Svelte's `css` transition
 * parameter. `css` callbacks compile to the Web Animations API and run off
 * the main thread, unlike `tick`-based custom transitions.
 *
 * Only animates `transform`/`opacity` by design.
 */
export function fadeScale(t: number, { fromScale = 0.96 }: { fromScale?: number } = {}) {
	const scale = fromScale + (1 - fromScale) * t;
	return `transform: scale(${scale}); opacity: ${t};`;
}

/** Clamp a fractional position (0-1) used for translateX-based marker positioning. */
export function clampFraction(value: number): number {
	if (Number.isNaN(value)) return 0;
	return Math.min(1, Math.max(0, value));
}
