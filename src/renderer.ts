import { Particle } from "./types.js";

export interface Renderer<T = unknown> {
	/**
	 * Initiate a particle's data, if needed.
	 * 
	 * @optional
	 * 
	 * @param particle the particle to initialize
	 */
	init?(particle: Particle<T>): void;
	
	/**
	 * Draw a particle to the canvas.
	 * 
	 * @param ctx the canvas context to draw to
	 * @param particle the particle to draw
	 * @param dt how much time has passed since the last frame
	 */
	render(
		ctx: CanvasRenderingContext2D,
		particle: Particle<T>,
		dt: number
	): void;

	/**
	 * Clean up any resources allocated by this renderer,
	 * or anything on engine disposal.
	 * 
	 * @optional
	 */
	destroy?(): void;
}