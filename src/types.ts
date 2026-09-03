export interface Particle<T = unknown> {
	/**
	 * (Horizontal) position of the particle.
	 */
	x: number;
	
	/**
	 * (Vertical) position of the particle.
	 */
	y: number;

	/**
	 * Velocity of the particle, on the `x` axis.
	 */
	vx: number;
	
	/**
	 * Velocity of the particle, on the `y` axis.
	 */
	vy: number;

	gravity: number;
	life: number;
	data: T;
}

export interface Position {
	x: number;
	y: number;
}