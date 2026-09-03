import { afterEach, beforeEach, vi } from "vitest";

/**
 * jsdom has no ResizeObserver. Dust only needs it to exist and not throw —
 * actual resize behavior can't be meaningfully simulated without a real
 * layout engine, so this stub never fires on its own. Tests that care about
 * resize behavior drive `Canvas`'s public width/height instead, by
 * overriding `clientWidth`/`clientHeight` directly on the root element.
 */
class MockResizeObserver implements ResizeObserver {
	observe(): void { }
	unobserve(): void { }
	disconnect(): void { }
}

beforeEach(() => {
	// @ts-expect-error — jsdom doesn't ship a ResizeObserver type/impl
	globalThis.ResizeObserver = MockResizeObserver;
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.body.innerHTML = "";
});
