const glslxPlugin = require('@rottencandy/esbuild-plugin-glslx');

require('esbuild').build({
    entryPoints: ['src/main.js', 'src/app.css'],
    bundle: true,
    minify: true,
    charset: 'utf8',
    target: 'es6',
    format: 'iife',
    outdir: 'app',
    mangleProps: /_$/,
    plugins: [glslxPlugin({ prettyPrint: false, renaming: 'all' })],
    loader: { '.png': 'dataurl' }
}).catch(() => process.exit(1))
