import { Particle } from "../types.js";
import { Renderer } from "../renderer.js";
import { fadeAlpha } from "../utils.js";

export interface TextData {
	text: string;
	color: string;
	size: number;
	rotation: number;
	rotationSpeed: number;
}

export interface TextRendererOptions {
	/**
	 * Strings to randomly pick from per particle — plain text or emoji.
	 */
	texts?: string[];
	colors?: string[];
	font?: string;
	minSize?: number;
	maxSize?: number;
}

const DEFAULT_TEXTS = [ "#" ];
const DEFAULT_COLORS = [ "#FFFFFF" ];

export class TextRenderer implements Renderer<TextData> {
	private texts: string[];
	private colors: string[];
	private font: string;
	private minSize: number;
	private maxSize: number;

	private sprites = new Map<string, HTMLCanvasElement>();

	constructor(options: TextRendererOptions = {}) {
		this.texts = options.texts ?? DEFAULT_TEXTS;
		this.colors = options.colors ?? DEFAULT_COLORS;
		this.font = options.font ?? "sans-serif";
		this.minSize = options.minSize ?? 16;
		this.maxSize = options.maxSize ?? 28;
	}

	private random<T>(arr: T[]): T {
		return arr[ Math.floor(Math.random() * arr.length) ];
	}

	init(particle: Particle<TextData>): void {
		particle.data.text = this.random(this.texts);
		particle.data.color = this.random(this.colors);
		particle.data.size = Math.round(this.minSize + Math.random() * (this.maxSize - this.minSize));
		particle.data.rotation = 0;
		particle.data.rotationSpeed = (Math.random() - 0.5) * 3; // rad/sec
	}

	private getSprite(text: string, color: string, size: number): HTMLCanvasElement {
		const key = `${text}|${color}|${size}`;

		const cached = this.sprites.get(key);

		if (cached) {
			return cached;
		}

		const sprite = document.createElement("canvas");
		const ctx = sprite.getContext("2d")!;

		ctx.font = `${size}px ${this.font}`;

		const padding = size * 0.2;
		const metrics = ctx.measureText(text);

		// sizing the canvas resets its context,
		// so font must be reapplied after
		sprite.width = metrics.width + padding * 2;
		sprite.height = size * 1.4 + padding * 2;

		ctx.font = `${size}px ${this.font}`;
		ctx.fillStyle = color;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(text, sprite.width / 2, sprite.height / 2);

		this.sprites.set(key, sprite);

		return sprite;
	}

	render(ctx: CanvasRenderingContext2D, particle: Particle<TextData>, dt: number): void {
		const { text, color, size, rotationSpeed } = particle.data;

		particle.data.rotation += rotationSpeed * dt;

		const sprite = this.getSprite(text, color, size);

		ctx.save();

		ctx.globalAlpha = fadeAlpha(particle.life);
		ctx.translate(particle.x, particle.y);
		ctx.rotate(particle.data.rotation);
		ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);

		ctx.restore();
	}

	destroy(): void {
		this.sprites.clear();
	}
}
