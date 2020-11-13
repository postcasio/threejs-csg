import nodeResolve from '@rollup/plugin-node-resolve';

export default [
  {
    watch: {
      include: 'src/**',
    },
    input: 'src/index.js',
    plugins: [
      nodeResolve({
        mainFields: ['module'],
      }),
    ],
    treeshake: {
      moduleSideEffects: false,
    },
    output: [
      // {
      //   format: 'umd',
      //   name: 'CSG',
      //   noConflict: true,
      //   file: 'build/csg.js',
      //   indent: '\t',
      // },
      {
        format: 'es',
        file: 'build/csg.module.js',
        indent: '\t',
      },
      {
        format: 'cjs',
        file: 'build/csg.cjs.js',
        indent: '\t',
      },
    ],
  },
  // {
  //   input: "src/index.js",
  //   plugins: [
  //   nodeResolve({
  //     mainFields: ["module"],
  //   }),
  //   terser()
  // ],
  //   output: [
  //     {
  //       format: "umd",
  //       name: "ECSY",
  //       noConflict: true,
  //       file: "build/csg.min.js",
  //       indent: "\t"
  //     }
  //   ]
  // }
];
