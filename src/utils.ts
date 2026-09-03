/**
 * Converts degrees to radians.
 * 
 * A full circle is 2π radians and 360°, so one degree is:
 * (2π / 360°) = π / 180 radians.
 */
export const DEG_TO_RAD = Math.PI / 180;

/**
 * Clears all own enumerable properties from an object in place,
 * without replacing the object reference. Used to reset a particle's
 * renderer-owned `data` when reused from the pool, avoiding an
 * allocation on every reuse.
 */
export function clearObject(obj: unknown): void {
	if (!obj || typeof obj !== "object") {
		return;
	}

	for (const key in obj as Record<string, unknown>) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			delete (obj as Record<string, unknown>)[ key ];
		}
	}
}

/** How long, in ms, particles take to fade out at the end of their life, by default. */
export const DEFAULT_FADE_MS = 250;

/**
 * Computes a 0–1 opacity multiplier that fades a particle out over the
 * last `fadeMs` milliseconds of its life. Multiply into any per-particle
 * opacity a renderer wants.
 */
export function fadeAlpha(
	life: number,
	fadeMs: number = DEFAULT_FADE_MS
): number {
	return Math.min(life / fadeMs, 1);
}
