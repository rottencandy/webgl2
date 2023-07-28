import glslPlugin from 'esbuild-plugin-spglsl';
import esbuild from 'esbuild';

const ctx = await esbuild.context({
    entryPoints: ['src/index.html', 'src/main.ts', 'src/app.css'],
    bundle: true,
    charset: 'utf8',
    format: 'iife',
    outdir: 'app',
    loader: { '.png': 'dataurl', '.html' : 'file' },
    assetNames: '[name]',
    plugins: [glslPlugin({
        minify: false,
        mangle: false
    })],
    sourcemap: 'inline',
});

await ctx.watch();
const { host, port } = await ctx.serve({ servedir: 'app' });
console.log(`Serving: http://${host}:${port}`);

process.on('SIGINT', async () => {
    await ctx.dispose();
    process.exit();
});
