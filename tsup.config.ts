import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		effects: 'src/effects/index.ts',
	},
	format: [ 'esm', 'cjs' ],
	dts: true,
	sourcemap: true,
	clean: true,
	minify: true,
	splitting: true,
	target: 'es2022',
	outDir: 'dist',
});
