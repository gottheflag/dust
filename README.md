# @gottheflag/dust

Lightweight, canvas-based particle effects engine for TypeScript.

Dust owns particle simulation (physics, lifetime, pooling). You own how particles look, through a small `Renderer` interface. Confetti, snow, heart, text/emoji, and images ship as built-in renderers — write your own for anything else.

📖 **[Full documentation →](https://gottheflag.github.io/dust)**

## Install

```bash
npm install @gottheflag/dust
```

## Quick start

```ts
import { Dust } from "@gottheflag/dust";
import { ConfettiRenderer } from "@gottheflag/dust/effects";

const dust = new Dust({
	renderer: new ConfettiRenderer(),
});

document.addEventListener("click", (e) => {
	dust.launch({
		origin: { x: e.clientX, y: e.clientY },
		count: 40,
	});
});
```

That's it — `Dust` fills the window with a canvas and starts animating on the first `launch()`.

## Core concepts

- **`Dust`** — one instance per canvas. Owns the simulation loop, the particle pool, and a `Renderer`. Created once, `launch()`ed as many times as you like.
- **`Renderer`** — a small interface (`init?`, `render`, `destroy?`) that controls how a particle looks. Dust never decides color, shape, rotation, or opacity — that's entirely up to the renderer.
- **`Particle`** — the simulation's own shape: position, velocity, gravity, remaining life, and a `data` field the renderer owns and fully controls.

```ts
interface Particle<T = unknown> {
	x: number; y: number;
	vx: number; vy: number;
	gravity: number;
	life: number;
	data: T;
}

interface Renderer<T = unknown> {
	init?(particle: Particle<T>): void;
	render(ctx: CanvasRenderingContext2D, particle: Particle<T>, dt: number): void;
	destroy?(): void;
}
```

## `Dust`

```ts
new Dust({
	root?: HTMLElement,   // defaults to the window
	renderer: Renderer,
	fps?: number,          // caps update/render frequency; physics stays real-time regardless
})
```

| Method                 | Description                                                        |
| ---------------------- | -------------------------------------------------------------------|
| `launch(options?)`     | Spawns a burst of particles and starts/continues the simulation.   |
| `on(event, listener)`  | Subscribe to `"start"`, `"update"` (per-frame, receives `dt`), or `"end"`. |
| `destroy()`            | Stops the loop, clears particles, tears down the renderer and canvas. |

### `launch(options)`

| Option     | Default              | Description                                          |
| ---------- | --------------------- | ----------------------------------------------------|
| `count`    | `30`                  | Particles to spawn.                                  |
| `origin`   | canvas center          | Spawn point, `{ x, y }`.                             |
| `speed`    | `4`                    | Base speed, in px/frame at a 60fps reference rate.   |
| `angle`    | `0`                    | Direction in degrees (`0` = right, `90` = down).     |
| `spread`   | `360`                  | Angular spread, centered on `angle`.                 |
| `gravity`  | `0.1`                  | Downward pull per frame.                             |
| `duration` | `1000`                 | Lifetime in ms.                                      |

## Root & coordinates

Pass `root` to scope Dust to an element instead of the window — the canvas sizes to that element and tracks its resizes, and default `origin` is relative to it, not the page.

```ts
new Dust({ root: document.querySelector("#hero")!, renderer: new SnowRenderer() });
```

## Built-in effects

```ts
import {
	ConfettiRenderer,
	SnowRenderer,
	HeartRenderer,
	TextRenderer,
	ImageRenderer,
} from "@gottheflag/dust/effects";
```

See **[src/effects/README.md](./src/effects/README.md)** for each renderer's options, and how to build your own.

## Development

```bash
npm install
npm run test       # opens the local playground (tests/)
npm run typecheck
npm run build
```

## License

Apache-2.0 — see [LICENSE](./LICENSE).
