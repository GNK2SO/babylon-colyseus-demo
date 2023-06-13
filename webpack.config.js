const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  entry: path.resolve(__dirname, "src/app"),
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devServer: {
    port: 8787,
    static: [
      {
        directory: path.join(__dirname, 'src/public'),
        publicPath: '/**',
      },
      {
        directory: path.join(__dirname, 'src/assets'),
        publicPath: '/**',
      },
    ]
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',                
        exclude: [
          path.join(__dirname, 'server'),
          path.join(__dirname, 'node_modules'),
        ],
      },
    ]
  }, 
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src/public/index.html"),
    })
  ],   
  mode: "development",
};