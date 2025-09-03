module.exports = {
  plugins: [
    [
      'babel-plugin-react-compiler',
      {
        // React Compiler configuration
        runtimeModule: 'react/compiler-runtime',
      },
    ],
  ],
};
