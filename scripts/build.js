import { htmlPlugin } from '@craftamap/esbuild-plugin-html';
import glslPlugin from 'esbuild-plugin-spglsl';
import esbuild from 'esbuild';

const ctx = await esbuild.context({
    entryPoints: ['src/main.ts', 'src/app.css'],
    bundle: true,
    metafile: true,
    charset: 'utf8',
    format: 'iife',
    outdir: 'app',
    loader: { '.png': 'dataurl' },
    assetNames: '[name]',
    plugins: [
        glslPlugin({
            minify: true,
            mangle: true,
            // NOTE: if using this, remember to use correct names when setting
            //mangle_global_map: {
            //    uMat: 'uM',
            //    uPos: 'uP',
            //},
        }),
        htmlPlugin({
            files: [{
                filename: 'index.html',
                entryPoints: ['src/main.ts', 'src/app.css'],
                title: 'ENGINE',
                inline: {
                    js: true,
                    css: true,
                },
                htmlTemplate: 'src/index.html',
            }],
        }),
    ],
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
