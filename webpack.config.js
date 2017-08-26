const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: [
    'babel-polyfill',
    './engine.js',
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            plugins: ['transform-async-to-generator']
          },
        }],
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'tie.bundle.js',
  },
};
