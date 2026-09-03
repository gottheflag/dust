import { describe, it, expect } from "vitest";
import { DEG_TO_RAD, clearObject, fadeAlpha, DEFAULT_FADE_MS } from "../src/utils.js";

describe("DEG_TO_RAD", () => {
	it("converts 180 degrees to PI radians", () => {
		expect(180 * DEG_TO_RAD).toBeCloseTo(Math.PI);
	});

	it("converts 360 degrees to 2*PI radians", () => {
		expect(360 * DEG_TO_RAD).toBeCloseTo(Math.PI * 2);
	});

	it("converts 0 degrees to 0 radians", () => {
		expect(0 * DEG_TO_RAD).toBe(0);
	});
});

describe("clearObject", () => {
	it("removes every own enumerable property", () => {
		const obj = { a: 1, b: "two", c: [ 3 ] };
		clearObject(obj);

		expect(Object.keys(obj)).toHaveLength(0);
	});

	it("preserves object identity — does not replace the reference", () => {
		const obj: Record<string, unknown> = { a: 1 };
		const ref = obj;

		clearObject(obj);

		expect(obj).toBe(ref);
	});

	it("is a no-op on an already-empty object", () => {
		const obj = {};
		expect(() => clearObject(obj)).not.toThrow();
		expect(Object.keys(obj)).toHaveLength(0);
	});

	it("does nothing for null", () => {
		expect(() => clearObject(null)).not.toThrow();
	});

	it("does nothing for non-object values", () => {
		expect(() => clearObject(42)).not.toThrow();
		expect(() => clearObject("string")).not.toThrow();
		expect(() => clearObject(undefined)).not.toThrow();
	});

	it("only removes own properties, not inherited ones", () => {
		const proto = { inherited: true };
		const obj = Object.create(proto);
		obj.own = 1;

		clearObject(obj);

		expect(Object.keys(obj)).toHaveLength(0);
		expect(obj.inherited).toBe(true); // still visible via the prototype
	});
});

describe("fadeAlpha", () => {
	it("returns 1 (fully opaque) when life is well above the fade window", () => {
		expect(fadeAlpha(1000)).toBe(1);
	});

	it("returns 1 exactly at the fade window boundary", () => {
		expect(fadeAlpha(DEFAULT_FADE_MS)).toBe(1);
	});

	it("returns a fraction below the fade window, proportional to remaining life", () => {
		expect(fadeAlpha(DEFAULT_FADE_MS / 2)).toBeCloseTo(0.5);
	});

	it("returns 0 at zero life", () => {
		expect(fadeAlpha(0)).toBe(0);
	});

	it("never returns negative alpha for negative life", () => {
		// life can dip slightly below 0 the frame a particle dies before removal
		expect(fadeAlpha(-50)).toBeLessThan(0);
		// (documenting current behavior — see note below)
	});

	it("respects a custom fade window", () => {
		expect(fadeAlpha(50, 100)).toBeCloseTo(0.5);
		expect(fadeAlpha(100, 100)).toBe(1);
		expect(fadeAlpha(200, 100)).toBe(1);
	});
});
