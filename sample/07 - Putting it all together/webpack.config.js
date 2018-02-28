const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  context: path.resolve(__dirname, '.'),
  entry: [
    'babel-polyfill',
    './index.js',
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
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/'),
    publicPath: '/dist/',
  },
  devServer: {
    contentBase: path.resolve(__dirname, '.'),
    publicPath: '/dist/',
    watchContentBase: true
  }
};
