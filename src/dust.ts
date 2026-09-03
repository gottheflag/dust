import { Canvas } from "./canvas.js";
import { CanvasEvent, DustEvent } from "./events.js";
import { PHYSICS_REFERENCE_FPS, LaunchOptions, DustOptions } from "./options.js";
import { Renderer } from "./renderer.js";
import { Particle } from "./types.js";
import { DEG_TO_RAD, clearObject } from "./utils.js";
import {
	Lifecycle,
	type EventListener
} from "@gottheflag/lifecycle";

export class Dust {
	private lifecycle = new Lifecycle<DustEvent>();
	private canvas: Canvas;
	private renderer: Renderer;

	private particles: Particle[] = [];
	private pool: Particle[] = [];
	private maxPoolSize = 1000;
	private raf?: number;

	/**
	 * Timestamp of the previous simulation update (in ms).
	 */
	private lastTime = 0;

	private frameInterval: number;
	private lastFrameTime = 0;

	constructor(options: DustOptions) {
		this.renderer = options.renderer;
		this.frameInterval = options.fps ? 1000 / options.fps : 0;

		const childLifecycle = this.lifecycle.child<CanvasEvent>();
		
		/**
		 * We listen for resize events on the canvas lifecycle, but
		 * we also want to trigger a render on resize, so we can
		 * update the canvas size and clear the particles.
		 * 
		 * @remarks
		 * We're using `0` here because we want to do a repaint,
		 * without advancing in time.
		 */
		childLifecycle.on("resize", () => this.render(0));

		this.canvas = new Canvas(
			options.root ?? document.body,
			childLifecycle
		);
	}

	/**
	 * Spawns a burst of particles and starts (or continues) the simulation loop (animation).
	 * 
	 * @param options 
	 */
	launch(options: LaunchOptions = {}) {
		const wasIdle = this.particles.length === 0;

		const duration = options.duration ?? 1000;

		const count = options.count ?? 30;

		const originX = options.origin?.x ?? this.canvas.width / 2;
		const originY = options.origin?.y ?? this.canvas.height / 2;

		const baseAngle = (options.angle ?? 0) * DEG_TO_RAD;
		const spread = (options.spread ?? 360) * DEG_TO_RAD;

		const speedBase = options.speed ?? 4;
		const gravity = options.gravity ?? 0.1;

		for (let i = 0; i < count; i++) {
			const angle = baseAngle + (Math.random() - 0.5) * spread;
			const speed = speedBase * (0.5 + Math.random() * 0.5);

			const p = this.getParticle();

			p.x = originX;
			p.y = originY;
			/**
			 * Calculate the particle's velocity based on its angle and speed.
			 * 
			 * vx = cos(angle) * speed
			 * vy = sin(angle) * speed
			 * 
			 * @see {@link https://en.wikipedia.org/wiki/Projectile_motion}
			 * @see {@link https://en.wikipedia.org/wiki/Kinematics}
			 * 
			*/
			p.vx = Math.cos(angle) * speed;
			p.vy = Math.sin(angle) * speed;

			p.gravity = gravity;
			p.life = duration;
			clearObject(p.data);

			this.renderer.init?.(p);

			this.particles.push(p);
		}

		if (wasIdle) {
			this.lifecycle.emit("start");
		}

		if (!this.raf) {
			this.loop();
		}
	}

	private getParticle(): Particle {
		return this.pool.pop() ?? {
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			gravity: 0,
			life: 0,
			data: {},
		};
	}

	private loop = (): void => {
		if (this.particles.length === 0) {
			this.stop();
			return;
		}

		this.raf = requestAnimationFrame(this.loop);

		const now = performance.now();

		if (this.frameInterval > 0) {
			const sinceLastFrame = now - this.lastFrameTime;

			if (sinceLastFrame < this.frameInterval) {
				return;
			}

			this.lastFrameTime = now - (sinceLastFrame % this.frameInterval);
		}

		const dt = this.lastTime === 0
			? 0
			: (now - this.lastTime) / 1000;

		this.lastTime = now;

		this.update(dt);
		this.render(dt);
	};

	private update(dt: number): void {
		this.lifecycle.emit("update", dt);

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[ i ];

			p.x += p.vx * dt * PHYSICS_REFERENCE_FPS;
			p.y += p.vy * dt * PHYSICS_REFERENCE_FPS;

			p.vy += p.gravity * dt * PHYSICS_REFERENCE_FPS;

			p.vx *= Math.pow(0.98, dt * PHYSICS_REFERENCE_FPS);
			p.vy *= Math.pow(0.98, dt * PHYSICS_REFERENCE_FPS);

			p.life -= dt * 1000;

			if (p.life <= 0) {
				const lastIndex = this.particles.length - 1;

				if (i !== lastIndex) {
					this.particles[ i ] = this.particles[ lastIndex ];
				}

				this.particles.pop();

				if (this.pool.length < this.maxPoolSize) {
					this.pool.push(p);
				}
			}
		}

		if (this.particles.length === 0) {
			this.lifecycle.emit("end");
		}
	}

	private stop() {
		if (this.raf) {
			cancelAnimationFrame(this.raf);
			this.raf = undefined;
			this.lastTime = 0;
		}
	}

	/**
	 * Re-paints the canvas.
	 * 
	 * @param dt How much time we should advance this run.
	 */
	private render(dt: number) {
		const ctx = this.canvas.ctx;
		this.canvas.clear();

		for (const p of this.particles) {
			this.renderer.render(ctx, p, dt);
		}
	}

	/**
	 * Number of particles currently alive.
	 */
	get activeParticleCount(): number {
		return this.particles.length;
	}

	on<K extends keyof DustEvent>(
		event: K,
		listener: EventListener<DustEvent[ K ]>
	) {
		return this.lifecycle.on(event, listener);
	}

	destroy(): void {
		this.stop();

		this.particles.length = 0;
		this.pool.length = 0;

		this.renderer.destroy?.();
		this.lifecycle.destroy();
	}
}
