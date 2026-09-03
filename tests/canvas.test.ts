import { describe, it, expect, beforeEach, vi } from "vitest";
import { Lifecycle } from "@gottheflag/lifecycle";
import { Canvas } from "../src/canvas.js";
import { stubCanvasContext } from "./mock-canvas.js";

describe("Canvas", () => {
	beforeEach(() => {
		stubCanvasContext();
	});

	describe("window mode (root === document.body)", () => {
		it("appends a canvas to document.body", () => {
			new Canvas(document.body, new Lifecycle());

			expect(document.body.querySelector("canvas")).not.toBeNull();
		});

		it("does not set inline position styles on the canvas", () => {
			const canvas = new Canvas(document.body, new Lifecycle());

			expect(canvas.el.style.position).toBe("");
		});

		it("sizes to window.innerWidth/innerHeight", () => {
			const canvas = new Canvas(document.body, new Lifecycle());

			expect(canvas.width).toBe(window.innerWidth);
			expect(canvas.height).toBe(window.innerHeight);
		});
	});

	describe("custom root mode", () => {
		let root: HTMLDivElement;

		beforeEach(() => {
			root = document.createElement("div");
			Object.defineProperty(root, "clientWidth", { value: 400, configurable: true });
			Object.defineProperty(root, "clientHeight", { value: 300, configurable: true });
			document.body.appendChild(root);
		});

		it("appends the canvas as a child of root, not document.body", () => {
			new Canvas(root, new Lifecycle());

			expect(root.querySelector("canvas")).not.toBeNull();
			expect(document.body.children).toContain(root);
		});

		it("sizes to the root element's clientWidth/clientHeight, not the window", () => {
			const canvas = new Canvas(root, new Lifecycle());

			expect(canvas.width).toBe(400);
			expect(canvas.height).toBe(300);
		});

		it("positions the canvas absolutely within root", () => {
			const canvas = new Canvas(root, new Lifecycle());

			expect(canvas.el.style.position).toBe("absolute");
			expect(canvas.el.style.top).toBe("0px");
			expect(canvas.el.style.left).toBe("0px");
		});

		it("sets root's position to relative if it was static", () => {
			// jsdom, unlike real browsers, doesn't resolve getComputedStyle's
			// *implicit* default for an unstyled element — it must be set
			// explicitly here to accurately simulate what a real browser
			// reports by default for a plain, unstyled element.
			root.style.position = "static";

			new Canvas(root, new Lifecycle());

			expect(root.style.position).toBe("relative");
		});

		it("does not override root's position if it's already positioned", () => {
			root.style.position = "absolute";

			new Canvas(root, new Lifecycle());

			expect(root.style.position).toBe("absolute");
		});
	});

	describe("resize()", () => {
		it("sets canvas pixel dimensions scaled by devicePixelRatio", () => {
			vi.stubGlobal("devicePixelRatio", 2);

			const root = document.createElement("div");
			Object.defineProperty(root, "clientWidth", { value: 400, configurable: true });
			Object.defineProperty(root, "clientHeight", { value: 300, configurable: true });
			document.body.appendChild(root);

			const canvas = new Canvas(root, new Lifecycle());

			expect(canvas.el.width).toBe(800);
			expect(canvas.el.height).toBe(600);
		});
	});

	describe("clear()", () => {
		it("calls clearRect on the context with the full canvas size", () => {
			const canvas = new Canvas(document.body, new Lifecycle());
			canvas.clear();

			expect(canvas.ctx.clearRect).toHaveBeenCalledWith(0, 0, canvas.el.width, canvas.el.height);
		});
	});
});
