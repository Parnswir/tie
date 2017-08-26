const path = require('path');
const webpack = require('webpack');

module.exports = {
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
    path: 'dist',
    publicPath: 'dist'
  },
  devServer: {
    contentBase: __dirname,
    watchContentBase: true
  }
};
