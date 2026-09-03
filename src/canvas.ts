import { Lifecycle } from "@gottheflag/lifecycle";
import { CanvasEvent } from "./events.js";

export class Canvas {
	public readonly el: HTMLCanvasElement;
	public readonly ctx: CanvasRenderingContext2D;

	private readonly root: HTMLElement;
	private readonly isWindow: boolean;
	private hasResizedOnce = false;

	constructor(
		root: HTMLElement,
		private readonly lifecycle: Lifecycle<CanvasEvent>
	) {
		this.root = root;
		this.isWindow = root === document.body;

		this.el = document.createElement("canvas");
		const ctx = this.el.getContext("2d")!;

		if (!ctx) {
			throw new Error(
				"[DUST]: failed to create 2D canvas context"
			);
		}

		this.ctx = ctx;

		if (!this.isWindow) {
			this.el.style.position = "absolute";
			this.el.style.top = "0";
			this.el.style.left = "0";

			if (getComputedStyle(root).position === "static") {
				root.style.position = "relative";
			}
		}

		root.appendChild(this.el);

		this.resize();

		const resize = () => this.resize();

		if (this.isWindow) {
			window.addEventListener("resize", resize);
			this.lifecycle.defer(() => window.removeEventListener("resize", resize));
		} else {
			const observer = new ResizeObserver(resize);
			observer.observe(root);
			this.lifecycle.defer(() => observer.disconnect());
		}

		this.lifecycle.defer(() => this.el.remove());
	}

	get width(): number {
		return this.isWindow ? window.innerWidth : this.root.clientWidth;
	}

	get height(): number {
		return this.isWindow ? window.innerHeight : this.root.clientHeight;
	}

	private resize(): void {
		const dpr = window.devicePixelRatio || 1;
		const pixelWidth = Math.round(this.width * dpr);
		const pixelHeight = Math.round(this.height * dpr);

		if (this.el.width === pixelWidth && this.el.height === pixelHeight) {
			return;
		}

		this.el.width = pixelWidth;
		this.el.height = pixelHeight;

		this.el.style.width = `${this.width}px`;
		this.el.style.height = `${this.height}px`;

		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		if (this.hasResizedOnce) {
			this.lifecycle.emit("resize");
		}
		this.hasResizedOnce = true;
	}

	clear(): void {
		this.ctx.clearRect(0, 0, this.el.width, this.el.height);
	}
}
