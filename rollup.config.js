import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import nodePolyfills from 'rollup-plugin-polyfill-node';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'main.js',
    output: {
        file: 'bundle.js'
    },
    plugins: [
        nodePolyfills(),
        nodeResolve({ preferBuiltins: false }),
        commonjs(),
        serve(), // index.html should be in root of project
        livereload(),
    ],
} 