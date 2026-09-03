import { Renderer } from "./renderer.js";
import { Position } from "./types.js";

export type DustOptions = {
	/**
	 * Root element to append the canvas to.
	 * 
	 * If omitted, the effect operates against the window: the canvas
	 * fills the viewport, and default coordinates (like `origin`) are
	 * relative to the window.
	 */
	root?: HTMLElement;

	/**
	 * Renderer used to draw this particles instance.
	 */
	renderer: Renderer;

	/**
	 * Caps how often the simulation/render loop actually runs, in fps.
	 * Physics is always based on real elapsed time, so this only
	 * affects smoothness/CPU cost — not particle speed or gravity.
	 *
	 * Leave unset to run uncapped, at the display's native refresh rate.
	 */
	fps?: number;
};

export interface LaunchOptions {
	/**
	 * Number of particles to spawn.
	 * 
	 * @default 30
	 */
	count?: number;

	/**
	 * Point particles spawn from. 
	 * 
	 * Defaults to the **center** of the canvas (the window, or the
	 * `root` element passed to the `Dust` constructor).
	 */
	origin?: Position;

	/**
	 * Base movement speed, in pixels per frame.
	 * 
	 * @see{@link PHYSICS_REFERENCE_FPS}
	 * 
	 * Defaults to **4**
	 */
	speed?: number;

	/**
	 * Direction particles travel, in degrees.
	 * 0 = right, 90 = down, 180 = left, 270 = up.
	 * 
	 * Defaults to **0**
	 */
	angle?: number;

	/**
	 * Width of the cone particles spread across, in degrees.
	 * Centered on `angle` 360 spreads particles in every direction.
	 * 
	 * Defaults to **360**
	 */
	spread?: number;

	/**
	 * Downward pull applied to particles each frame.
	 * 
	 * Defaults to **0.1**
	 */
	gravity?: number;

	/**
	 * How long the burst runs, in milliseconds.
	 * 
	 * Defaults to **1000**
	 */
	duration?: number;
}

/**
 * Reference frame rate used to interpret per-frame physics units
 * (`speed`, `gravity`, drag) as real-world units, regardless of the
 * actual render rate.
 *
 * This is a fixed conversion constant, not a runtime setting —
 * see `DustOptions.fps` to cap the actual simulation/render loop.
 */
export const PHYSICS_REFERENCE_FPS = 60;
