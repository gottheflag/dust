import { describe, it, expect, vi, beforeEach } from "vitest";
import { Particle } from "../../src/types.js";
import { TextRenderer, TextData } from "../../src/effects/text.js";
import { createMockContext, stubCanvasContext } from "../mock-canvas.js";

beforeEach(() => {
	stubCanvasContext();
});

function makeParticle(life = 1000): Particle<TextData> {
	return { x: 0, y: 0, vx: 0, vy: 0, gravity: 0, life, data: {} as TextData };
}

describe("TextRenderer — init()", () => {
	it("uses the default text/color when no options are given", () => {
		const renderer = new TextRenderer();
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.text).toBe("#");
		expect(particle.data.color).toBe("#FFFFFF");
	});

	it("picks from custom texts and colors", () => {
		const renderer = new TextRenderer({ texts: [ "GG" ], colors: [ "#123456" ] });
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.text).toBe("GG");
		expect(particle.data.color).toBe("#123456");
	});

	it("rounds size and keeps it within minSize/maxSize", () => {
		const renderer = new TextRenderer({ minSize: 10, maxSize: 12 });

		for (let i = 0; i < 20; i++) {
			const particle = makeParticle();
			renderer.init(particle);

			expect(Number.isInteger(particle.data.size)).toBe(true);
			expect(particle.data.size).toBeGreaterThanOrEqual(10);
			expect(particle.data.size).toBeLessThanOrEqual(12);
		}
	});

	it("starts rotation at 0", () => {
		const renderer = new TextRenderer();
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.rotation).toBe(0);
	});
});

describe("TextRenderer — sprite caching", () => {
	it("rasterizes a given (text, color, size) combo only once, even across many particles", () => {
		const createElementSpy = vi.spyOn(document, "createElement");

		const renderer = new TextRenderer({ texts: [ "🎉" ], colors: [ "#FFFFFF" ], minSize: 20, maxSize: 20 });

		const ctx = createMockContext();

		for (let i = 0; i < 5; i++) {
			const particle = makeParticle();
			renderer.init(particle);
			renderer.render(ctx, particle, 0);
		}

		const canvasCreations = createElementSpy.mock.calls.filter((args) => args[ 0 ] === "canvas");
		expect(canvasCreations).toHaveLength(1);
	});

	it("rasterizes separately for each distinct (text, color, size) combo", () => {
		const createElementSpy = vi.spyOn(document, "createElement");

		const renderer = new TextRenderer({
			texts: [ "A", "B" ],
			colors: [ "#FFFFFF" ],
			minSize: 20,
			maxSize: 20,
		});

		const ctx = createMockContext();

		const a = makeParticle();
		a.data = { text: "A", color: "#FFFFFF", size: 20, rotation: 0, rotationSpeed: 0 };
		renderer.render(ctx, a, 0);

		const b = makeParticle();
		b.data = { text: "B", color: "#FFFFFF", size: 20, rotation: 0, rotationSpeed: 0 };
		renderer.render(ctx, b, 0);

		const canvasCreations = createElementSpy.mock.calls.filter((args) => args[ 0 ] === "canvas");
		expect(canvasCreations).toHaveLength(2);
	});

	it("clears the cache on destroy(), forcing re-rasterization afterward", () => {
		const createElementSpy = vi.spyOn(document, "createElement");

		const renderer = new TextRenderer({ texts: [ "X" ], colors: [ "#FFFFFF" ], minSize: 20, maxSize: 20 });
		const ctx = createMockContext();

		const particle = makeParticle();
		particle.data = { text: "X", color: "#FFFFFF", size: 20, rotation: 0, rotationSpeed: 0 };

		renderer.render(ctx, particle, 0);
		renderer.destroy?.();
		renderer.render(ctx, particle, 0);

		const canvasCreations = createElementSpy.mock.calls.filter((args) => args[ 0 ] === "canvas");
		expect(canvasCreations).toHaveLength(2);
	});
});

describe("TextRenderer — render()", () => {
	it("draws via drawImage on the main context, not fillText directly", () => {
		const renderer = new TextRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.drawImage).toHaveBeenCalled();
		expect(ctx.fillText).not.toHaveBeenCalled(); // fillText only happens on the offscreen sprite
	});

	it("applies fadeAlpha(life) as globalAlpha", () => {
		const renderer = new TextRenderer();
		const particle = makeParticle(30); // fadeAlpha(30) = 0.12
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.globalAlpha).toBeCloseTo(0.12);
	});

	it("advances rotation proportionally to dt", () => {
		const renderer = new TextRenderer();
		const particle = makeParticle();
		renderer.init(particle);

		const rotationSpeed = particle.data.rotationSpeed;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 2);

		expect(particle.data.rotation).toBeCloseTo(rotationSpeed * 2);
	});
});
