import { Particle } from "../types.js";
import { Renderer } from "../renderer.js";
import { fadeAlpha } from "../utils.js";

export interface HeartData {
	color: string;
	size: number;
	rotation: number;
	rotationSpeed: number;
}

const DEFAULT_COLORS = [
	"#FF4D6D",
	"#FF758F",
	"#FF8FA3",
	"#C9184A",
	"#FFB3C1",
];

export type HeartRendererOptions = {
	colors?: string[];
	minSize?: number;
	maxSize?: number;
};

export class HeartRenderer implements Renderer<HeartData> {
	private colors: string[];
	private minSize: number;
	private maxSize: number;
	
	constructor(options: HeartRendererOptions = {}) {
		this.colors = options.colors ?? DEFAULT_COLORS;
		this.minSize = options.minSize ?? 10;
		this.maxSize = options.maxSize ?? 18;
	}

	private randomColor(): string {
		return this.colors[ Math.floor(Math.random() * this.colors.length) ];
	}

	init(particle: Particle<HeartData>): void {
		particle.data.color = this.randomColor();
		particle.data.size = this.minSize + Math.random() * (this.maxSize - this.minSize);
		particle.data.rotation = (Math.random() - 0.5) * 0.6;
		particle.data.rotationSpeed = (Math.random() - 0.5) * 3; // rad/sec
	}

	render(ctx: CanvasRenderingContext2D, particle: Particle<HeartData>, dt: number): void {
		const { color, size, rotationSpeed } = particle.data;

		particle.data.rotation += rotationSpeed * dt;

		ctx.save();

		ctx.globalAlpha = fadeAlpha(particle.life);
		ctx.translate(particle.x, particle.y);
		ctx.rotate(particle.data.rotation);
		ctx.fillStyle = color;

		const top = size * 0.3;

		ctx.beginPath();
		ctx.moveTo(0, top);
		
		ctx.bezierCurveTo(
			0,
			0,
			-size / 2,
			0,
			-size / 2,
			top
		);
		ctx.bezierCurveTo(
			-size / 2,
			(size + top) / 2,
			0,
			(size + top) / 2,
			0,
			size
		);
		ctx.bezierCurveTo(
			0,
			(size + top) / 2,
			size / 2,
			(size + top) / 2,
			size / 2,
			top
		);
		ctx.bezierCurveTo(
			size / 2,
			0,
			0,
			0,
			0,
			top
		);
		
		ctx.closePath();
		ctx.fill();

		ctx.restore();
	}
}
