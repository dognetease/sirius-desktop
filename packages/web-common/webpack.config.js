const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: './dev/main.tsx',
  devtool: 'inline-source-map',
  output: {
    path: path.join(__dirname, './build'),
    filename: 'bundle.[hash:5].js',
  },
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
          // ,{
          //   loader: 'swc-loader',

          // }
          // 'ts-loader'
        ],
      },
      {
        test: /\.module.s[ac]ss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              localIdentName: '[name]--[local]--[hash:base64:5]',
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
          'style-loader',
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
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.jsx', '.ts', '.tsx', '.js'],
    alias: {
      '@': path.join(__dirname, '../web/src'),
      '@web-setting': path.join(__dirname, '../web-setting/src'),
      '@web-common': path.join(__dirname, '../web-common/src'),
      '@web-edm': path.join(__dirname, '../web-edm/src'),
    },
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './dev/index.html',
    }),
  ],
};
