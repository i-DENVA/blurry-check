import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './lib',
        rootDir: './src'
      }),
      production && terser()
    ]
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
      production && terser()
    ]
  },
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.umd.js',
      format: 'umd',
      name: 'BlurryCheck',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
      production && terser()
    ]
  }
];