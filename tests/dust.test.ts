import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { Dust, Renderer } from "../src/index.js";
import { stubCanvasContext } from "./mock-canvas.js";
import { stubAnimationFrame } from "./mock-raf.js";

interface MockRenderer extends Renderer<any> {
	init: Mock;
	render: Mock;
	destroy: Mock;
}

function createMockRenderer(): MockRenderer {
	return {
		init: vi.fn((p) => { p.data.touched = true; }),
		render: vi.fn(),
		destroy: vi.fn(),
	};
}

let rafCtl: ReturnType<typeof stubAnimationFrame>;

beforeEach(() => {
	stubCanvasContext();
	rafCtl = stubAnimationFrame();

	// Dust treats `lastTime === 0` as "no frame processed yet" (see dust.ts),
	// so a clock that legitimately starts at 0 would collide with that
	// sentinel and force an extra dt=0 frame — something that can't happen
	// in a real browser (performance.now() is essentially never exactly 0
	// by the time launch() is first called). Nudge the clock off 0 so tests
	// see the same timing behavior real usage would.
	rafCtl.tick(1);
});

describe("Dust — constructor", () => {
	it("creates a canvas scoped to document.body by default", () => {
		new Dust({ renderer: createMockRenderer() });

		expect(document.body.querySelector("canvas")).not.toBeNull();
	});

	it("creates a canvas scoped to a custom root", () => {
		const root = document.createElement("div");
		Object.defineProperty(root, "clientWidth", { value: 300, configurable: true });
		Object.defineProperty(root, "clientHeight", { value: 200, configurable: true });
		document.body.appendChild(root);

		new Dust({ root, renderer: createMockRenderer() });

		expect(root.querySelector("canvas")).not.toBeNull();
	});
});

describe("Dust — launch()", () => {
	it("spawns 30 particles by default", () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		dust.launch();

		expect(dust.activeParticleCount).toBe(30);
	});

	it("respects a custom count", () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		dust.launch({ count: 7 });

		expect(dust.activeParticleCount).toBe(7);
	});

	it("calls renderer.init exactly once per spawned particle", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });
		dust.launch({ count: 12 });

		expect(renderer.init).toHaveBeenCalledTimes(12);
	});

	it("defaults origin to the canvas center", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });
		dust.launch({ count: 1 });

		const [ , particle ] = renderer.render.mock.calls[ 0 ];
		expect(particle.x).toBe(window.innerWidth / 2);
		expect(particle.y).toBe(window.innerHeight / 2);
	});

	it("uses a custom origin when given", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });
		dust.launch({ count: 1, origin: { x: 123, y: 456 } });

		const [ , particle ] = renderer.render.mock.calls[ 0 ];
		expect(particle.x).toBe(123);
		expect(particle.y).toBe(456);
	});

	it("clears particle.data before init, even for particles reused from the pool", () => {
		const seenKeysPerInit: string[][] = [];

		const renderer: Renderer<any> = {
			init: vi.fn((p) => {
				seenKeysPerInit.push(Object.keys(p.data));
				p.data.tag = "batch";
			}),
			render: vi.fn(),
		};

		const dust = new Dust({ renderer });

		dust.launch({ count: 1, duration: 50 });
		rafCtl.tick(60); // particle dies, gets recycled into the pool

		dust.launch({ count: 1, duration: 50 }); // should reuse the pooled particle

		expect(seenKeysPerInit).toEqual([ [], [] ]);
	});
});

describe("Dust — physics", () => {
	it("moves a particle by speed * dt * reference fps, frame-rate independent", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5); // removes angle jitter and speed randomization variance

		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });

		// angle 0 = rightward, speed 4 * (0.5 + 0.5*0.5) = 3, gravity 0 (no vertical drift)
		dust.launch({ count: 1, angle: 0, spread: 90, speed: 4, gravity: 0, duration: 10000 });

		const [ , startParticle ] = renderer.render.mock.calls.at(-1)!;
		const startX = startParticle.x;

		rafCtl.tick(1000); // exactly 1 second — dt * 60 = 60, so dx = 3 * 60 = 180

		const [ , afterParticle ] = renderer.render.mock.calls.at(-1)!;
		expect(afterParticle.x - startX).toBeCloseTo(180, 0);
	});

	it("removes a particle once its duration elapses and stops the loop", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });

		dust.launch({ count: 1, duration: 100 });

		rafCtl.tick(60); // 60ms elapsed, still alive
		expect(dust.activeParticleCount).toBe(1);

		rafCtl.tick(60); // 120ms elapsed, should have died
		expect(dust.activeParticleCount).toBe(0);

		rafCtl.tick(16); // the one extra already-scheduled frame runs stop()
		expect(rafCtl.pendingFrameCount()).toBe(0);
	});
});

describe("Dust — events", () => {
	it('fires "start" exactly once for a single burst', () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		const onStart = vi.fn();
		dust.on("start", onStart);

		dust.launch({ count: 1, duration: 200 });

		expect(onStart).toHaveBeenCalledTimes(1);
	});

	it('does not re-fire "start" for an overlapping launch while already active', () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		const onStart = vi.fn();
		dust.on("start", onStart);

		dust.launch({ count: 1, duration: 200 });
		dust.launch({ count: 1, duration: 200 });

		expect(onStart).toHaveBeenCalledTimes(1);
	});

	it('fires "end" only once every particle from overlapping launches has died', () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		const onEnd = vi.fn();
		dust.on("end", onEnd);

		dust.launch({ count: 1, duration: 100 }); // t=0, dies ~t=100
		rafCtl.tick(60); // t=60, first burst still alive (life ~40)

		dust.launch({ count: 1, duration: 100 }); // second burst starts at t=60, dies ~t=160

		rafCtl.tick(60); // t=120 — first burst has died, second (life ~40) hasn't
		expect(onEnd).not.toHaveBeenCalled();

		rafCtl.tick(60); // t=180 — second burst has now died too
		expect(onEnd).toHaveBeenCalledTimes(1);
	});

	it('emits "update" with the elapsed dt in seconds', () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		const onUpdate = vi.fn();
		dust.on("update", onUpdate);

		dust.launch({ count: 1, duration: 10000 });
		rafCtl.tick(250);

		const lastCall = onUpdate.mock.calls.at(-1)!;
		expect(lastCall[ 0 ]).toBeCloseTo(0.25);
	});
});

describe("Dust — multiple launches", () => {
	it("does not duplicate the render loop when launch() is called while already running", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });

		dust.launch({ count: 3, duration: 10000 });
		const rendersAfterFirst = renderer.render.mock.calls.length;

		dust.launch({ count: 2, duration: 10000 }); // overlapping — raf is already scheduled
		expect(renderer.render.mock.calls.length).toBe(rendersAfterFirst); // no extra synchronous render

		rafCtl.tick(16);

		const rendersThisTick = renderer.render.mock.calls.length - rendersAfterFirst;
		expect(rendersThisTick).toBe(5); // 3 + 2 particles, each rendered exactly once — not 10
	});

	it("does not lose particles from either launch", () => {
		const dust = new Dust({ renderer: createMockRenderer() });

		dust.launch({ count: 3, duration: 10000 });
		dust.launch({ count: 2, duration: 10000 });

		expect(dust.activeParticleCount).toBe(5);
	});
});

describe("Dust — fps cap", () => {
	it("throttles update/render to roughly the configured fps", () => {
		rafCtl.tick(500); // advance the clock off exactly 0 first, matching real page-load timing

		const renderer = createMockRenderer();
		const dust = new Dust({ renderer, fps: 10 }); // frameInterval = 100ms

		dust.launch({ count: 1, duration: 10000 });
		const rendersAfterLaunch = renderer.render.mock.calls.length;

		rafCtl.tickFrames(6, 16); // 96ms of native-rate ticks — under the 100ms threshold
		expect(renderer.render.mock.calls.length).toBe(rendersAfterLaunch);

		rafCtl.tick(16); // now past 100ms since the last processed frame
		expect(renderer.render.mock.calls.length).toBeGreaterThan(rendersAfterLaunch);
	});

	it("still moves particles the same real-world distance regardless of the cap", () => {
		vi.spyOn(Math, "random").mockReturnValue(0.5);
		rafCtl.tick(500);

		const renderer = createMockRenderer();
		const dust = new Dust({ renderer, fps: 10 });

		dust.launch({ count: 1, angle: 0, spread: 90, speed: 4, gravity: 0, duration: 10000 });
		const [ , startParticle ] = renderer.render.mock.calls.at(-1)!;
		const startX = startParticle.x;

		rafCtl.tick(1000); // a full second later, regardless of how many native frames that spans

		const [ , afterParticle ] = renderer.render.mock.calls.at(-1)!;
		expect(afterParticle.x - startX).toBeCloseTo(180, 0); // same as the uncapped physics test
	});
});

describe("Dust — destroy()", () => {
	it("stops the loop, clears particles, and destroys the renderer", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });

		dust.launch({ count: 5, duration: 10000 });
		expect(dust.activeParticleCount).toBe(5);

		dust.destroy();

		expect(dust.activeParticleCount).toBe(0);
		expect(renderer.destroy).toHaveBeenCalledOnce();
		expect(rafCtl.pendingFrameCount()).toBe(0);
	});

	it("processes no further frames after destroy, even if a stray tick occurs", () => {
		const renderer = createMockRenderer();
		const dust = new Dust({ renderer });

		dust.launch({ count: 1, duration: 10000 });
		const rendersBeforeDestroy = renderer.render.mock.calls.length;

		dust.destroy();
		rafCtl.tick(16);

		expect(renderer.render.mock.calls.length).toBe(rendersBeforeDestroy);
	});

	it("removes the canvas from the DOM", () => {
		const dust = new Dust({ renderer: createMockRenderer() });
		dust.destroy();

		expect(document.body.querySelector("canvas")).toBeNull();
	});
});
