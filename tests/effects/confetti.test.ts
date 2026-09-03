import { describe, it, expect, vi } from "vitest";
import { Particle } from "../../src/types.js";
import { ConfettiRenderer, ConfettiData } from "../../src/effects/confetti.js";
import { createMockContext } from "../mock-canvas.js";

function makeParticle(life = 1000): Particle<ConfettiData> {
	return { x: 0, y: 0, vx: 0, vy: 0, gravity: 0, life, data: {} as ConfettiData };
}

describe("ConfettiRenderer — init()", () => {
	it("picks a color from the default palette", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.color).toMatch(/^#[0-9A-F]{6}$/i);
	});

	it("picks a color from a custom palette when given one", () => {
		const renderer = new ConfettiRenderer([ "#111111" ]);
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.color).toBe("#111111");
	});

	it("computes a lightened highlight color distinct from the base color", () => {
		const renderer = new ConfettiRenderer([ "#000000" ]);
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.highlight).not.toBe(particle.data.color);
		expect(particle.data.highlight).toMatch(/^rgb\(/);
	});

	it("assigns a shape from the known set", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();

		renderer.init(particle);

		expect([ "rect", "circle", "ribbon" ]).toContain(particle.data.shape);
	});

	it("keeps weight within the documented 0.5–1.5 range", () => {
		const renderer = new ConfettiRenderer();

		for (let i = 0; i < 20; i++) {
			const particle = makeParticle();
			renderer.init(particle);

			expect(particle.data.weight).toBeGreaterThanOrEqual(0.5);
			expect(particle.data.weight).toBeLessThanOrEqual(1.5);
		}
	});

	it("gives heavier particles slower rotation and flip speeds than lighter ones", () => {
		vi.spyOn(Math, "random")
			// first particle (light): weight = 0.5 + 0 = 0.5
			.mockReturnValueOnce(0.9) // color pick
			.mockReturnValueOnce(0.9) // shape pick
			.mockReturnValueOnce(0)   // width
			.mockReturnValueOnce(0)   // height
			.mockReturnValueOnce(0)   // weight -> 0.5
			.mockReturnValueOnce(1)   // rotation phase
			.mockReturnValueOnce(1)   // rotationSpeed magnitude
			.mockReturnValueOnce(0)   // flip phase
			.mockReturnValueOnce(1);  // flipSpeed magnitude

		const renderer = new ConfettiRenderer();
		const light = makeParticle();
		renderer.init(light);

		vi.spyOn(Math, "random")
			.mockReturnValueOnce(0.9)
			.mockReturnValueOnce(0.9)
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(1)   // weight -> 1.5 (heavy)
			.mockReturnValueOnce(1)
			.mockReturnValueOnce(1)
			.mockReturnValueOnce(0)
			.mockReturnValueOnce(1);

		const heavy = makeParticle();
		renderer.init(heavy);

		expect(Math.abs(heavy.data.flipSpeed)).toBeLessThan(Math.abs(light.data.flipSpeed));
	});
});

describe("ConfettiRenderer — render()", () => {
	it("applies fadeAlpha(life) as globalAlpha", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle(150); // within the default fade window
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.globalAlpha).toBeCloseTo(0.6);
	});

	it("advances rotation, flip, and sway proportionally to dt — not a fixed per-call step", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const { rotationSpeed, flipSpeed, swaySpeed } = particle.data;
		const start = { ...particle.data };

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.5); // half a second

		expect(particle.data.rotation).toBeCloseTo(start.rotation + rotationSpeed * 0.5);
		expect(particle.data.flip).toBeCloseTo(start.flip + flipSpeed * 0.5);
		expect(particle.data.swayPhase).toBeCloseTo(start.swayPhase + swaySpeed * 0.5);
	});

	it("does not advance rotation/flip/sway when dt is 0 (e.g. a resize repaint)", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const before = { ...particle.data };
		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(particle.data.rotation).toBe(before.rotation);
		expect(particle.data.flip).toBe(before.flip);
		expect(particle.data.swayPhase).toBe(before.swayPhase);
	});

	it("draws a rect shape with fillRect", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.data.shape = "rect";
		particle.data.flip = 0; // face-on, avoids the highlight-color branch complicating this check

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.fillRect).toHaveBeenCalled();
	});

	it("draws a circle shape via arc + fill, not fillRect", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.data.shape = "circle";
		particle.data.flip = 0;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.arc).toHaveBeenCalled();
		expect(ctx.fill).toHaveBeenCalled();
		expect(ctx.fillRect).not.toHaveBeenCalled();
	});

	it("draws a ribbon shape via a curved stroke, not a fill", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.data.shape = "ribbon";
		particle.data.flip = 0;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.quadraticCurveTo).toHaveBeenCalled();
		expect(ctx.stroke).toHaveBeenCalled();
	});

	it("swaps to the highlight color when the piece is near edge-on", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.data.flip = Math.PI / 2; // cos(flip) ≈ 0 — edge-on

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.fillStyle).toBe(particle.data.highlight);
	});

	it("uses the base color when facing the camera", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.data.flip = 0; // cos(flip) = 1 — fully face-on

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.fillStyle).toBe(particle.data.color);
	});

	it("never writes to particle position/velocity/gravity fields", () => {
		const renderer = new ConfettiRenderer();
		const particle = makeParticle();
		renderer.init(particle);
		particle.x = 10;
		particle.y = 20;
		particle.vx = 1;
		particle.vy = 2;
		particle.gravity = 0.1;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.1);

		expect(particle.x).toBe(10);
		expect(particle.y).toBe(20);
		expect(particle.vx).toBe(1);
		expect(particle.vy).toBe(2);
		expect(particle.gravity).toBe(0.1);
	});
});
