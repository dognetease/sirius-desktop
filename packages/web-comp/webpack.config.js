const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './dev/main.tsx',
  devtool: 'inline-source-map',
  output: {
    path: path.join(__dirname, './build'),
    filename: 'bundle.[hash:5].js',
  },
  // eslint-disable-next-line no-dupe-keys
  devtool: 'inline-source-map',
  devServer: {
    port: 9000,
    hot: true,
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.(tsx|jsx|ts|js)?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/env', '@babel/preset-react', '@babel/preset-typescript'],
            },
          },
        ],
      },
      {
        test: /\.module.s[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // localIdentName: '[name]--[local]--[hash:base64:5]',
              modules: {
                auto: true,
                mode: 'local',
              },
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/,
        exclude: /\.module.s[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: false,
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.jsx', '.ts', '.tsx', '.js'],
    alias: {},
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './dev/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'style.[hash:5].css',
    }),
    new webpack.DefinePlugin({
      'process.env.BUILD_ENV': JSON.stringify(process.env.BUILD_ENV),
    }),
  ],
};
