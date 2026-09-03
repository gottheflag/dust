import { Particle } from "../types.js";
import { Renderer } from "../renderer.js";
import { fadeAlpha } from "../utils.js";

export interface SnowData {
	/**
	 * Radius the snow flake (in px).
	 */
	radius: number;
	
	opacity: number;

	/**
	 * Sway effect.
	 */
	sway: {
		/**
		 * Current phase of the sway (in rad).
		 */
		current: number;
		/**
		 * How fast the sway phase advances (in rad/sec).
		 */
		speed: number;
		/**
		 * Maximum horizontal displacement caused by the sway (in px).
		 */
		amplitude: number;
	};
}

export interface SnowRendererOptions {
	color?: string;
	minSize?: number;
	maxSize?: number;
}

export class SnowRenderer implements Renderer<SnowData> {
	private color: string;
	private minSize: number;
	private maxSize: number;

	constructor(options: SnowRendererOptions = {}) {
		this.color = options.color ?? "#fffafa";
		this.minSize = options.minSize ?? 1;
		this.maxSize = options.maxSize ?? 3;
	}

	init(particle: Particle<SnowData>): void {
		particle.data.radius = this.minSize + Math.random() * (this.maxSize - this.minSize);
		particle.data.opacity = 0.5 + Math.random() * 0.5;

		particle.data.sway = {
			current: Math.random() * Math.PI * 2,
			speed: 1 + Math.random() * 1.5,
			amplitude: 10 + Math.random() * 15
		};
	}

	render(ctx: CanvasRenderingContext2D, particle: Particle<SnowData>, dt: number): void {
		particle.data.sway.current += particle.data.sway.speed * dt;

		/**
		 * Sinusoidal oscillation formula:
		 * x(t) = x₀ + A * sin(φ)
		 * 
		 * Where:
		 * x₀ = base x position
		 *  A = sway amplitude
		 *  φ = current phase (in radians)
		 * 
		 * The phase advances over time:
		 * φ += ω * dt
		 * 
		 * Where ω is the sway speed (in radians/sec).
		 * 
		 * @see {@link https://en.wikipedia.org/wiki/Sine_wave}
		 */
		const drawX = particle.x + Math.sin(
			particle.data.sway.current
		) * particle.data.sway.amplitude;

		ctx.save();

		ctx.globalAlpha = particle.data.opacity * fadeAlpha(particle.life);
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(
			drawX,
			particle.y,
			particle.data.radius,
			0,
			Math.PI * 2
		);
		ctx.fill();

		ctx.restore();
	}
}
