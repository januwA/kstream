process.env.NODE_ENV = "production";

// 最小化生产
const TerserJSPlugin = require("terser-webpack-plugin");

const shared = require("./shared");

const prodConfig = {
  target: 'node', // 如果你只想打包在nodejs环境中运行的代码，就开启这个
  mode: process.env.NODE_ENV,
  module: {
    rules: shared.rules,
  },
  resolve: shared.resolve,
  optimization: {
    // 压缩js
    minimizer: [new TerserJSPlugin({})],
    // 删除空的块
    removeEmptyChunks: true,
    // 合并包含相同模块的块
    mergeDuplicateChunks: true,
  },
  plugins: [...shared.plugins],
  experiments: shared.experiments,
};

module.exports = [
  {
    entry: shared.entry,
    output: shared.output,
    ...prodConfig,
  },
];
