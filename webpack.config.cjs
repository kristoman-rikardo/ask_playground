const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/injectionScript.ts',
  output: {
    filename: 'chat-injector.min.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      name: 'ChatInjector',
      type: 'var',
      export: 'default'
    }
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
          compress: {
            drop_console: false, // Behold konsollmeldinger for debugging
          },
        },
        extractComments: false,
      }),
    ],
  },
}; 