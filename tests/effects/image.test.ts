import { describe, it, expect } from "vitest";
import { Particle } from "../../src/types.js";
import { ImageRenderer, ImageData } from "../../src/effects/image.js";
import { createMockContext } from "../mock-canvas.js";

function makeParticle(life = 1000): Particle<ImageData> {
	return {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		gravity: 0,
		life,
		data: {} as ImageData
	};
}

function makeMockImage(overrides: Partial<HTMLImageElement> = {}): HTMLImageElement {
	return {
		complete: true,
		naturalWidth: 100,
		naturalHeight: 50,
		...overrides,
	} as HTMLImageElement;
}

describe("ImageRenderer — constructor", () => {
	it("wraps a string URL in a real Image element", () => {
		const renderer = new ImageRenderer({ images: [ "https://example.com/logo.png" ] });
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.image).toBeInstanceOf(HTMLImageElement);
		expect(particle.data.image.src).toBe("https://example.com/logo.png");
	});

	it("passes through an already-constructed image element unchanged", () => {
		const img = makeMockImage();
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.image).toBe(img);
	});
});

describe("ImageRenderer — init()", () => {
	it("keeps size within minSize/maxSize", () => {
		const img = makeMockImage();
		const renderer = new ImageRenderer({ images: [ img ], minSize: 10, maxSize: 14 });

		for (let i = 0; i < 20; i++) {
			const particle = makeParticle();
			renderer.init(particle);

			expect(particle.data.size).toBeGreaterThanOrEqual(10);
			expect(particle.data.size).toBeLessThanOrEqual(14);
		}
	});

	it("defaults minSize and maxSize to 24 when omitted", () => {
		const img = makeMockImage();
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle();

		renderer.init(particle);

		expect(particle.data.size).toBe(24);
	});
});

describe("ImageRenderer — render()", () => {
	it("skips drawing when the image hasn't finished loading", () => {
		const img = makeMockImage({ complete: false });
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.1);

		expect(ctx.drawImage).not.toHaveBeenCalled();
		expect(ctx.save).not.toHaveBeenCalled();
	});

	it("skips drawing when naturalWidth is 0 (broken image)", () => {
		const img = makeMockImage({ complete: true, naturalWidth: 0 });
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.1);

		expect(ctx.drawImage).not.toHaveBeenCalled();
	});

	it("still advances rotation even while waiting for the image to load", () => {
		const img = makeMockImage({ complete: false });
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle();
		renderer.init(particle);

		const rotationSpeed = particle.data.rotationSpeed;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 1);

		expect(particle.data.rotation).toBeCloseTo(rotationSpeed);
	});

	it("draws once loaded, preserving aspect ratio", () => {
		const img = makeMockImage({ complete: true, naturalWidth: 100, naturalHeight: 50 }); // 2:1
		const renderer = new ImageRenderer({ images: [ img ], minSize: 40, maxSize: 40 });
		const particle = makeParticle();
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.drawImage).toHaveBeenCalledWith(img, -20, -10, 40, 20); // width 40, height 20 (half, matching 2:1)
	});

	it("applies fadeAlpha(life) as globalAlpha", () => {
		const img = makeMockImage();
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle(210); // fadeAlpha(210) = 0.84
		renderer.init(particle);

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0);

		expect(ctx.globalAlpha).toBeCloseTo(0.84);
	});

	it("advances rotation proportionally to dt", () => {
		const img = makeMockImage();
		const renderer = new ImageRenderer({ images: [ img ] });
		const particle = makeParticle();
		renderer.init(particle);

		const rotationSpeed = particle.data.rotationSpeed;

		const ctx = createMockContext();
		renderer.render(ctx, particle, 0.5);

		expect(particle.data.rotation).toBeCloseTo(rotationSpeed * 0.5);
	});
});
