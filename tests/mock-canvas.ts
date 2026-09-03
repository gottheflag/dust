import { vi } from "vitest";

/**
 * A minimal, fully-spied CanvasRenderingContext2D stand-in.
 *
 * jsdom doesn't implement canvas 2D drawing at all — every method here
 * is a vi.fn() that records the call and does nothing else. Tests assert
 * against these spies (e.g. `ctx.fillRect` was called, `ctx.globalAlpha`
 * was set to X) instead of inspecting actual pixels.
 */
export function createMockContext(): CanvasRenderingContext2D {
	const ctx = {
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		scale: vi.fn(),
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		strokeRect: vi.fn(),
		beginPath: vi.fn(),
		closePath: vi.fn(),
		arc: vi.fn(),
		fill: vi.fn(),
		stroke: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		quadraticCurveTo: vi.fn(),
		bezierCurveTo: vi.fn(),
		setTransform: vi.fn(),
		drawImage: vi.fn(),
		fillText: vi.fn(),
		measureText: vi.fn(() => ({ width: 20 }) as TextMetrics),

		fillStyle: "",
		strokeStyle: "",
		globalAlpha: 1,
		lineWidth: 1,
		lineCap: "butt",
		font: "",
		textAlign: "start",
		textBaseline: "alphabetic",
	};

	return ctx as unknown as CanvasRenderingContext2D;
}

/**
 * Stubs `HTMLCanvasElement.prototype.getContext` so every canvas created
 * during a test — the engine's own canvas, or an effect's offscreen
 * sprite canvases — gets a fresh mock context. Returns the list of every
 * context created, in creation order, so tests can inspect a specific one.
 */
export function stubCanvasContext(): CanvasRenderingContext2D[] {
	const created: CanvasRenderingContext2D[] = [];

	HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) {
		const ctx = createMockContext();
		created.push(ctx);
		return ctx;
	}) as typeof HTMLCanvasElement.prototype.getContext;

	return created;
}
