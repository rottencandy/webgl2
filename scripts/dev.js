import glslPlugin from 'esbuild-plugin-spglsl';
import esbuild from 'esbuild';

const ctx = await esbuild.context({
    entryPoints: ['src/main.ts', 'src/app.css'],
    bundle: true,
    sourcemap: 'inline',
    charset: 'utf8',
    target: 'es6',
    format: 'iife',
    outdir: 'app',
    plugins: [glslPlugin({
        minify: false,
        mangle: false
    })],
    loader: { '.png': 'dataurl' }
});

await ctx.watch();
const { host, port } = await ctx.serve({ servedir: 'app' });
await Bun.write(Bun.stdout, `Serving: http://${host}:${port}`);

process.on('SIGINT', async () => {
    await ctx.dispose();
    process.exit();
});
