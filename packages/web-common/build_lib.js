const webpack = require('webpack');
const path = require('path');
const shelljs = require('shelljs');

shelljs.exec('rsync ./src/styles/variables.scss ./es/styles/');

function buildWithWebpack() {
  webpack(
    {
      mode: 'development',
      // mode: 'production',
      entry: './src/index.ts',
      devtool: 'inline-source-map',
      output: {
        path: path.join(__dirname, './lib'),
        filename: 'lib.umd.js',
        libraryTarget: 'umd',
      },
      devtool: 'none',
      // devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.(tsx|jsx|ts)?$/,
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
        },
      },
      // optimization: {
      //   runtimeChunk: 'single',
      //   splitChunks: {
      //     cacheGroups: {
      //       vendor: {
      //         test: /[\\/]node_modules[\\/]/,
      //         name: 'vendors',
      //         chunks: 'all'
      //       }
      //     }
      //   }
      // }
    },
    (err, stats) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(
        stats.toString({
          chunks: false, // Makes the build much quieter
          colors: true, // Shows colors in the console
        })
      );
    }
  );
}
