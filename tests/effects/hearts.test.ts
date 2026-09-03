import { describe, it, expect } from "vitest";
import { Particle } from "../../src/types.js";
import { HeartRenderer, HeartData } from "../../src/effects/heart.js";
import { createMockContext } from "../mock-canvas.js";

function makeParticle(life = 1000): Particle<HeartData> {
	return { x: 0, y: 0, vx: 0, vy: 0, gravity: 0, life, data: {} as HeartData };
}

describe("HeartRenderer — init()", () => {
	it("picks a color from the default palette", () => {
		const renderer = new HeartRenderer();
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.color).toMatch(/^#[0-9A-F]{6}$/i);
	});

	it("picks a color from a custom palette when given one", () => {
		const renderer = new HeartRenderer({
			colors: [ "#FFAAAA" ]
		});
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.color).toBe("#FFAAAA");
	});

	it("keeps size within the documented 10–18 range", () => {
		const renderer = new HeartRenderer();

		for (let i = 0; i < 20; i++) {
			const particle = makeParticle();
			renderer.init(particle);

			expect(particle.data.size).toBeGreaterThanOrEqual(10);
			expect(particle.data.size).toBeLessThanOrEqual(18);
		}
	});
});

describe("HeartRenderer — render()", () => {
	it("applies fadeAlpha(life) as globalAlpha", () => {
		const renderer = new HeartRenderer();
		const particle = makeParticle(75); // fadeAlpha(75) = 0.3
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.globalAlpha).toBeCloseTo(0.3);
	});

	it("advances rotation proportionally to dt, not by a fixed amount per call", () => {
		const renderer = new HeartRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const rotationSpeed = particle.data.rotationSpeed;
		const startRotation = particle.data.rotation;

		const ctx = createMockContext();

		renderer.render(ctx, particle, 1); // 1 second
		expect(particle.data.rotation).toBeCloseTo(startRotation + rotationSpeed * 1);

		renderer.render(ctx, particle, 2); // 2 more seconds
		expect(particle.data.rotation).toBeCloseTo(startRotation + rotationSpeed * 3);
	});

	it("produces the same total rotation over the same elapsed time regardless of frame count", () => {
		const renderer = new HeartRenderer();

		const oneStep = makeParticle();
		renderer.init(oneStep);
		oneStep.data.rotationSpeed = 2; // fix the speed so both particles are directly comparable
		oneStep.data.rotation = 0;

		const manySteps = makeParticle();
		manySteps.data = { ...oneStep.data };

		const ctx = createMockContext();

		renderer.render(ctx, oneStep, 1); // one big step

		for (let i = 0; i < 10; i++) {
			renderer.render(ctx, manySteps, 0.1); // ten small steps, same total time
		}

		expect(manySteps.data.rotation).toBeCloseTo(oneStep.data.rotation);
	});

	it("draws a closed bezier path and fills it", () => {
		const renderer = new HeartRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.bezierCurveTo).toHaveBeenCalledTimes(4);
		expect(ctx.closePath).toHaveBeenCalled();
		expect(ctx.fill).toHaveBeenCalled();
	});

	it("never writes to particle position/velocity/gravity fields", () => {
		const renderer = new HeartRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.x = 5;
		particle.y = 6;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.2);

		expect(particle.x).toBe(5);
		expect(particle.y).toBe(6);
		expect(particle.vx).toBe(0);
		expect(particle.vy).toBe(0);
		expect(particle.gravity).toBe(0);
	});
});
