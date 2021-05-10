var path = require('path');
var webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    'cdcts-sipjs': './src/cdcts-sipjs.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'cdcts-sipjs',
    // names the amd module:
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
        exclude: /(node_modules)/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      SIP: 'sip.js',
    }),
  ],
};
