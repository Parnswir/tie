const path = require('path');
const webpack = require('webpack');

module.exports = {
  context: path.resolve(__dirname, '.'),
  entry: {
    app: './index.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: { presets: ['es2015'] },
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
