import { Particle } from "../types.js";
import { Renderer } from "../renderer.js";
import { fadeAlpha } from "../utils.js";

type ConfettiShape = "rect" | "circle" | "ribbon";

export interface ConfettiData {
	color: string;
	highlight: string;
	shape: ConfettiShape;

	width: number;
	height: number;

	rotation: number;
	rotationSpeed: number; // rad/sec

	flip: number;
	flipSpeed: number; // rad/sec — simulated 3D tumble

	swayPhase: number;
	swaySpeed: number; // rad/sec
	swayAmplitude: number; // px — visual-only, doesn't touch particle.x

	weight: number; // 0.5 (light, flutters a lot) – 1.5 (heavy, falls straighter)
}

const DEFAULT_COLORS = [
	"#EF476F",
	"#F78C2B",
	"#FFD166",
	"#06D6A0",
	"#118AB2",
	"#7B61FF",
];

const SHAPES: ConfettiShape[] = [ "rect", "rect", "circle", "ribbon" ]; // rect weighted more common

/**
 * Blends a hex color toward white — used for the edge-on "glint" as a piece flips. \
 * Computed once per particle in init(), never per frame.
 */
function lighten(hex: string, amount: number): string {
	const num = parseInt(hex.slice(1), 16);
	const r = (num >> 16) & 0xff;
	const g = (num >> 8) & 0xff;
	const b = num & 0xff;

	const mix = (c: number) => Math.round(c + (255 - c) * amount);

	return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export class ConfettiRenderer implements Renderer<ConfettiData> {
	constructor(private colors: string[] = DEFAULT_COLORS) { }

	private randomColor(): string {
		return this.colors[ Math.floor(Math.random() * this.colors.length) ];
	}

	init(particle: Particle<ConfettiData>): void {
		const color = this.randomColor();

		particle.data.color = color;
		particle.data.highlight = lighten(color, 0.65);
		particle.data.shape = SHAPES[ Math.floor(Math.random() * SHAPES.length) ];

		particle.data.width = 6 + Math.random() * 4;
		particle.data.height = 10 + Math.random() * 6;

		particle.data.weight = 0.5 + Math.random();

		particle.data.rotation = Math.random() * Math.PI * 2;
		particle.data.rotationSpeed = (Math.random() - 0.5) * 4 / particle.data.weight;

		particle.data.flip = Math.random() * Math.PI * 2;
		particle.data.flipSpeed = (2 + Math.random() * 4) / particle.data.weight;

		particle.data.swayPhase = Math.random() * Math.PI * 2;
		particle.data.swaySpeed = 1.5 + Math.random() * 2;
		particle.data.swayAmplitude = (6 + Math.random() * 10) / particle.data.weight;
	}

	render(ctx: CanvasRenderingContext2D, particle: Particle<ConfettiData>, dt: number): void {
		const d = particle.data;

		d.rotation += d.rotationSpeed * dt;
		d.flip += d.flipSpeed * dt;
		d.swayPhase += d.swaySpeed * dt;

		const flipScale = Math.cos(d.flip);
		const sway = Math.sin(d.swayPhase) * d.swayAmplitude;

		ctx.save();

		ctx.globalAlpha = fadeAlpha(particle.life);
		ctx.translate(particle.x + sway, particle.y);
		ctx.rotate(d.rotation);
		ctx.scale(flipScale, 1);

		ctx.fillStyle = Math.abs(flipScale) < 0.15 ? d.highlight : d.color;

		switch (d.shape) {
			case "circle":
				ctx.beginPath();
				ctx.arc(
					0,
					0,
					d.width / 2,
					0, Math.PI * 2
				);
				ctx.fill();
				break;

			case "ribbon":
				ctx.strokeStyle = ctx.fillStyle;
				ctx.lineWidth = d.width / 2;
				ctx.lineCap = "round";
				ctx.beginPath();
				ctx.moveTo(
					-d.height / 2,
					0
				);
				ctx.quadraticCurveTo(
					0,
					-d.height * 0.6,
					d.height / 2,
					0
				);
				ctx.stroke();
				break;

			case "rect":
			default:
				ctx.fillRect(
					-d.width / 2,
					-d.height / 2,
					d.width,
					d.height
				);
				break;
		}

		ctx.restore();
	}
}
