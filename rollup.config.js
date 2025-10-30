import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.js',
  output: {
    dir: '.', 
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default', 
  },
  external: ['obsidian'],
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs(),
  ],
};
