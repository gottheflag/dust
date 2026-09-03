import { Dust, Renderer } from "../src/index.js";
import {
	ConfettiRenderer,
	SnowRenderer,
	HeartRenderer,
	TextRenderer,
	ImageRenderer,
} from "../src/effects/index.js";

function getNumber(selector: string): number {
	return parseFloat((document.querySelector(selector) as HTMLInputElement)!.value);
}

type EffectName = "confetti" | "snow" | "heart" | "text" | "image";

function createRenderer(name: EffectName): Renderer {
	switch (name) {
		case "snow":
			return new SnowRenderer();
		case "heart":
			return new HeartRenderer();
		case "text":
			return new TextRenderer({
				texts: [ "✨", "🎉", "+1", "GG", "★" ],
				colors: [ "#FFD166", "#06D6A0", "#7B61FF", "#EF476F" ],
			});
		case "image":
			// swap in a real image URL to see it in action — falls back to
			// a broken image gracefully (ImageRenderer just skips drawing).
			return new ImageRenderer({ images: [
				"https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F030%2F557%2F577%2Foriginal%2Fbeautiful-blue-snowflake-on-transparent-background-winter-christmas-element-realistic-snow-flake-cut-out-crystal-of-snow-macro-view-ai-generated-png.png",
			] });
		case "confetti":
		default:
			return new ConfettiRenderer();
	}
}

let dust: Dust;
let currentEffect: EffectName = "confetti";

const statParticles = document.querySelector("#stat-particles")!;
const statFps = document.querySelector("#stat-fps")!;

function createDust(): void {
	dust?.destroy();

	dust = new Dust({
		renderer: createRenderer(currentEffect),
	});

	let smoothedFps = 0;

	dust.on("update", (dt) => {
		statParticles.textContent = String(dust.activeParticleCount);

		if (dt > 0) {
			const instantFps = 1 / dt;
			
			smoothedFps = smoothedFps === 0
				? instantFps
				: smoothedFps * 0.9 + instantFps * 0.1;
			statFps.textContent = Math.round(smoothedFps).toString();
		}
	});

	dust.on("end", () => {
		statParticles.textContent = "0";
		statFps.textContent = "–";
	});
}

createDust();

document.querySelectorAll<HTMLButtonElement>("#effect-picker button").forEach((btn) => {
	btn.addEventListener("click", () => {
		const effect = btn.dataset.effect as EffectName;
		if (effect === currentEffect) return;

		currentEffect = effect;

		document.querySelectorAll("#effect-picker button").forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");

		createDust();
	});
});

document.querySelector("#root")!.addEventListener("click", (event) => {
	const x = (event as MouseEvent).clientX;
	const y = (event as MouseEvent).clientY;

	const spread = getNumber("#spread");
	const speed = getNumber("#speed");
	const gravity = getNumber("#gravity");
	const count = getNumber("#count");
	const duration = getNumber("#duration");
	const angle = getNumber("#angle");

	dust.launch({
		origin: {
			x,
			y,
		},
		angle,
		spread,
		speed,
		gravity,
		count,
		duration,
	});
});
