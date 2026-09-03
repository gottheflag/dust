/**
 * Converts degrees to radians.
 * 
 * A full circle is 2π radians and 360°, so one degree is:
 * (2π / 360°) = π / 180 radians.
 */
export const DEG_TO_RAD = Math.PI / 180;

/**
 * Reference frame rate used to interpret per-frame physics units
 * (`speed`, `gravity`, drag) as real-world units, regardless of the
 * actual render rate.
 *
 * This is a fixed conversion constant, not a runtime setting —
 * see `DustOptions.fps` to cap the actual simulation/render loop.
 */
export const PHYSICS_REFERENCE_FPS = 60;