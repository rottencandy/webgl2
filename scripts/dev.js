const glslxPlugin = require('@rottencandy/esbuild-plugin-glslx');
const esbuild = require('esbuild');

esbuild.serve({
    servedir: 'app',
}, {
    entryPoints: ['src/main.js', 'src/app.css'],
    bundle: true,
    sourcemap: 'inline',
    charset: 'utf8',
    target: 'es6',
    format: 'iife',
    outdir: 'app',
    //watch: {
    //    onRebuild(error) {
    //        if (error) console.error('Build failed:', error.errors)
    //        else console.log('Build succeeded!')
    //    },
    //},
    plugins: [glslxPlugin({ prettyPrint: true, renaming: 'none' })],
    loader: { '.png': 'dataurl' }
})
    .then(server => console.log(`Serving at: http://localhost:${server.port}`))
    .catch(() => process.exit(1));
