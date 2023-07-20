import glslPlugin from 'esbuild-plugin-spglsl';
import esbuild from 'esbuild';

const ctx = await esbuild.context({
    entryPoints: ['src/main.ts', 'src/app.css'],
    bundle: true,
    minify: true,
    charset: 'utf8',
    format: 'iife',
    outdir: 'app',
    mangleProps: /_$/,
    plugins: [glslPlugin({
        minify: true,
        mangle: true,
        // NOTE: if using this, remember to use correct names when setting
        //mangle_global_map: {
        //    uMat: 'uM',
        //    uPos: 'uP',
        //},
    })],
    loader: { '.png': 'dataurl' }
});

try {
    await ctx.rebuild();
} catch (e) {
    console.error('Error: ', e);
    process.exit(1);
}
process.exit(0);
