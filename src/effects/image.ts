import { Particle } from "../types.js";
import { Renderer } from "../renderer.js";
import { fadeAlpha } from "../utils.js";

export interface ImageData {
	image: HTMLImageElement;
	size: number;
	rotation: number;
	rotationSpeed: number;
}

export interface ImageRendererOptions {
	images: (string | HTMLImageElement)[];
	minSize?: number;
	maxSize?: number;
}

export class ImageRenderer implements Renderer<ImageData> {
	private images: HTMLImageElement[];
	private minSize: number;
	private maxSize: number;

	constructor(options: ImageRendererOptions) {
		this.images = options.images.map((img) => {
			if (typeof img === "string") {
				const el = new Image();
				el.src = img;
				return el;
			}

			return img;
		});

		this.minSize = options.minSize ?? 24;
		this.maxSize = options.maxSize ?? 24;
	}

	private random<T>(arr: T[]): T {
		return arr[ Math.floor(Math.random() * arr.length) ];
	}

	init(particle: Particle<ImageData>): void {
		particle.data.image = this.random(this.images);
		particle.data.size = this.minSize + Math.random() * (this.maxSize - this.minSize);
		particle.data.rotation = 0;
		particle.data.rotationSpeed = (Math.random() - 0.5) * 3; // rad/sec
	}

	render(ctx: CanvasRenderingContext2D, particle: Particle<ImageData>, dt: number): void {
		const {
			image,
			size,
			rotationSpeed
		} = particle.data;

		particle.data.rotation += rotationSpeed * dt;

		if (!image.complete || image.naturalWidth === 0) {
			return;
		}

		const aspect = image.naturalHeight / image.naturalWidth;
		const width = size;
		const height = size * aspect;

		ctx.save();

		ctx.globalAlpha = fadeAlpha(particle.life);
		ctx.translate(particle.x, particle.y);
		ctx.rotate(particle.data.rotation);
		ctx.drawImage(
			image,
			-width / 2,
			-height / 2,
			width,
			height
		);

		ctx.restore();
	}
}
