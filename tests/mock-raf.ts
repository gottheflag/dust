import { vi } from "vitest";

type FrameCallback = (time: number) => void;

/**
 * Stubs `requestAnimationFrame` / `cancelAnimationFrame` and mocks
 * `performance.now()` behind a fake, test-controlled clock.
 *
 * Real rAF timing would make tests slow and flaky (waiting on actual
 * animation frames) or force juggling vitest's fake-timer/performance
 * interplay. This is simpler: nothing runs until `tick()` is called,
 * so every frame in a test is explicit and deterministic.
 */
export function stubAnimationFrame() {
	let nextId = 0;
	let clock = 0;

	const callbacks = new Map<number, FrameCallback>();

	const raf = vi.fn((cb: FrameCallback): number => {
		const id = ++nextId;
		callbacks.set(id, cb);
		return id;
	});

	const caf = vi.fn((id: number): void => {
		callbacks.delete(id);
	});

	vi.stubGlobal("requestAnimationFrame", raf);
	vi.stubGlobal("cancelAnimationFrame", caf);

	vi.spyOn(performance, "now").mockImplementation(() => clock);

	return {
		requestAnimationFrame: raf,
		cancelAnimationFrame: caf,

		/**
		 * Advances the fake clock by `ms` and synchronously runs whatever
		 * frame(s) were pending — mirrors one real animation frame firing.
		 */
		tick(ms = 16): void {
			clock += ms;

			const pending = Array.from(callbacks.values());
			callbacks.clear();

			for (const cb of pending) {
				cb(clock);
			}
		},

		/** Advances by calling tick() `count` times, `ms` apart. */
		tickFrames(count: number, ms = 16): void {
			for (let i = 0; i < count; i++) {
				this.tick(ms);
			}
		},

		pendingFrameCount(): number {
			return callbacks.size;
		},

		now(): number {
			return clock;
		},
	};
}
