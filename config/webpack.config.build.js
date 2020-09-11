const path = require('path');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpackConfig = require('./webpack.config');

module.exports = merge(webpackConfig, {

    // devtool: 'source-map',
    devtool: false,

    output: {
      publicPath: '',
      path: path.join(__dirname, '../build'),
      filename: '[name].[chunkhash].js'
    },

    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          sourceMap: true,
          uglifyOptions: {
            ie8: true,
            keep_quoted_props: true,
            quote_keys: true
          }
        })
      ]
    },

    plugins: [
      new CleanWebpackPlugin(),

      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../public/index.html'),
        title: 'Reading Pagination',
        filename: 'index.html',
      }),
    ]

});
