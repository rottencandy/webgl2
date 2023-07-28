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
        minify: true,
        mangle: true,
        // NOTE: if using this, remember to use correct names when setting
        //mangle_global_map: {
        //    uMat: 'uM',
        //    uPos: 'uP',
        //},
    })],
    minify: true,
    mangleProps: /_$/,
});

try {
    await ctx.rebuild();
} catch (e) {
    console.error('Error: ', e);
    process.exit(1);
}
process.exit(0);
