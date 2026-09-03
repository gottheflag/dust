import { describe, it, expect } from "vitest";
import { Particle } from "../../src/types.js";
import { SnowRenderer, SnowData } from "../../src/effects/snow.js";
import { createMockContext } from "../mock-canvas.js";

function makeParticle(life = 1000): Particle<SnowData> {
	return {
		x: 100,
		y: 50,
		vx: 0,
		vy: 0,
		gravity: 0,
		life,
		data: {
			radius: 2,
			opacity: 0.5,
			sway: {
				current: 0,
				speed: 1,
				amplitude: 10,
			},
		} as SnowData
	};
}

describe("SnowRenderer — init()", () => {
	it("assigns radius, opacity, and sway parameters within documented ranges", () => {
		const renderer = new SnowRenderer();

		for (let i = 0; i < 20; i++) {
			const particle = makeParticle();
			renderer.init(particle);

			expect(particle.data.radius).toBeGreaterThanOrEqual(1);
			expect(particle.data.radius).toBeLessThanOrEqual(3);

			expect(particle.data.opacity).toBeGreaterThanOrEqual(0.5);
			expect(particle.data.opacity).toBeLessThanOrEqual(1);

			expect(particle.data.sway.speed).toBeGreaterThanOrEqual(1);
			expect(particle.data.sway.speed).toBeLessThanOrEqual(2.5);

			expect(particle.data.sway.amplitude).toBeGreaterThanOrEqual(10);
			expect(particle.data.sway.amplitude).toBeLessThanOrEqual(25);
		}
	});
});

describe("SnowRenderer — render()", () => {
	it("combines per-particle opacity with the shared life-based fade", () => {
		const renderer = new SnowRenderer();
		const particle = makeParticle(150); // fadeAlpha(150) = 0.6
		renderer.init(particle);
		particle.data.opacity = 0.8;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.globalAlpha).toBeCloseTo(0.8 * 0.6);
	});

	it("fades out instead of popping — globalAlpha reaches 0 as life approaches 0", () => {
		const renderer = new SnowRenderer();
		const particle = makeParticle(0);
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.globalAlpha).toBe(0);
	});

	it("advances sway proportionally to dt", () => {
		const renderer = new SnowRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const startSway = particle.data.sway.current;
		const swaySpeed = particle.data.sway.speed;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.5);

		expect(particle.data.sway.current).toBeCloseTo(startSway + swaySpeed * 0.5);
	});

	it("draws a circle via arc + fill", () => {
		const renderer = new SnowRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.arc).toHaveBeenCalled();
		expect(ctx.fill).toHaveBeenCalled();
	});

	it("offsets the drawn x by the sway, without mutating particle.x itself", () => {
		const renderer = new SnowRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.data.sway.current = 0;
		particle.data.sway.speed = 0; // freeze sway so the offset is predictable
		particle.data.sway.amplitude = 10;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		const arcCall = (ctx.arc as any).mock.calls[ 0 ];
		const drawnX = arcCall[ 0 ];

		expect(drawnX).toBe(particle.x + Math.sin(0) * 10);
		expect(particle.x).toBe(100); // untouched
	});

	it("never writes to particle position/velocity/gravity fields", () => {
		const renderer = new SnowRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.3);

		expect(particle.x).toBe(100);
		expect(particle.y).toBe(50);
		expect(particle.vx).toBe(0);
		expect(particle.vy).toBe(0);
		expect(particle.gravity).toBe(0);
	});
});
