# Effects

Built-in `Renderer` implementations for `@gottheflag/dust`, importable from `@gottheflag/dust/effects`.

| Renderer           | Look                                                 |
| ------------------ | ---------------------------------------------------- |
| `ConfettiRenderer` | Rotating rectangles, random colors from a palette.   |
| `SnowRenderer`     | Soft circles that drift side to side as they fall.   |
| `HeartRenderer`    | Rotating heart shapes (bezier path), random colors.  |
| `TextRenderer`     | Any string(s) you supply — plain text *or* emoji.    |
| `ImageRenderer`    | Your own images, aspect-ratio preserved.             |

```ts
import { ConfettiRenderer, TextRenderer } from "@gottheflag/dust/effects";

new ConfettiRenderer(["#EF476F", "#06D6A0"]); // custom palette, optional
new TextRenderer({ texts: ["🎉", "+1"], colors: ["#FFD166"] });
```

Every effect fades out over its last ~250ms of life (`fadeAlpha()` in `../utils.ts`) so particles never pop out of existence — reuse it in your own renderers instead of writing your own fade math.

## Writing a custom renderer

A `Renderer` is three things, only one of which is required:

```ts
interface Renderer<T = unknown> {
	init?(particle: Particle<T>): void;
	render(ctx: CanvasRenderingContext2D, particle: Particle<T>, dt: number): void;
	destroy?(): void;
}
```

- **`init`** — called once when a particle is (re)spawned. Set up whatever your renderer needs on `particle.data` — color, size, rotation, whatever *your* effect cares about. Dust already resets `data` to `{}` before calling this, even for particles reused from the pool, so you never see stale fields from a previous effect.
- **`render`** — called every frame for every live particle. Draw based on `particle.x` / `particle.y` (Dust already moved them for you) and whatever you stashed in `particle.data`. `dt` is real elapsed seconds since the last frame — use it for animation that isn't tied to particle physics, like a sway or a rotation.
- **`destroy`** — called once when `dust.destroy()` runs. Clean up anything your renderer allocated outside of particle data (caches, loaded images, etc).

**Dust owns physics. Your renderer owns *everything visual*** — color, shape, rotation, scale, opacity, easing. Never write to `particle.x`, `particle.y`, `particle.vx`, `particle.vy`, `particle.gravity`, or `particle.life` from a renderer; Dust manages those.

### Minimal example

```ts
import { Particle, Renderer } from "@gottheflag/dust";
import { fadeAlpha } from "../utils.js"; // if working inside this package

interface SparkleData {
	radius: number;
}

export class SparkleRenderer implements Renderer<SparkleData> {
	init(particle: Particle<SparkleData>): void {
		particle.data.radius = 2 + Math.random() * 3;
	}

	render(ctx: CanvasRenderingContext2D, particle: Particle<SparkleData>): void {
		ctx.save();
		ctx.globalAlpha = fadeAlpha(particle.life);
		ctx.fillStyle = "#fff";
		ctx.beginPath();
		ctx.arc(particle.x, particle.y, particle.data.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}
```

### Patterns worth copying from the built-ins

- **Random pick per particle** — Confetti/Heart/Text all take a `colors` (or `texts`) array and pick randomly in `init`. Simple, cheap, and gives visual variety for free.
- **Options object for anything beyond a color list** — `TextRenderer`/`ImageRenderer` take a constructor options object (`{ texts, colors, font, minSize, maxSize }`) rather than positional args, once there's more than one or two knobs.
- **Cache expensive draws** — `TextRenderer` rasterizes each distinct (text, color, size) to an offscreen canvas once and blits it with `drawImage` afterward, instead of calling `fillText` every particle every frame. Do this for anything expensive to draw repeatedly (color emoji, complex paths, gradients).
- **Async-safe drawing** — `ImageRenderer` checks `image.complete` before drawing, since images load asynchronously. If your renderer depends on something that isn't ready yet, skip that frame's draw rather than throwing.

### Making it a built-in

If you want your renderer shipped alongside these, add `your-effect.ts` here and export it from `index.ts`:

```ts
export { SparkleRenderer } from "./sparkle.js";
export type { SparkleData } from "./sparkle.js";
```

Otherwise, it doesn't need to live in this package at all — any object satisfying `Renderer<T>` works with `new Dust({ renderer })`, whether it's here, in your app, or in its own package.
