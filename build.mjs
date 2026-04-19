import { build } from 'esbuild';
import { builtinModules } from 'node:module';

// Externalize Node built-ins to avoid "Dynamic require of node:X" errors in ESM
const nodeExternals = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
];

await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/commitlog.mjs',
    minify: true,
    sourcemap: true,
    external: nodeExternals,
});

console.log('✅ Build complete → dist/commitlog.mjs');
