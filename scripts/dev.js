const glslxPlugin = require('@rottencandy/esbuild-plugin-glslx');
require('esbuild').build({
  entryPoints: ['src/main.js', 'src/app.css'],
  bundle: true,
  sourcemap: 'inline',
  charset: 'utf8',
  target: 'es6',
  format: 'iife',
  outdir: 'app',
  watch: {
    onRebuild(error) {
      if (error) console.error('watch build failed:', error.errors)
      else console.log('watch build succeeded!')
    },
  },
  plugins: [glslxPlugin({ prettyPrint: true, renaming: 'none' })],
}).catch(() => process.exit(1))
