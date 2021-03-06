const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const util = require("./util");

/**
 * 在[dev/prod.config.js]中公用的配置
 */
module.exports = {
  entry: {
    main: util.entry(),
  },
  output: {
    filename: "kstream.js",
    path: util.output(),

    library: "kstream",
    libraryTarget: "umd",
    globalObject: "this",
  },

  rules: [
    {
      // See also: https://github.com/microsoft/TypeScript-Babel-Starter
      // 如果你想要.d.ts文件，那么ts-loader可能来的更直接点
      test: /\.tsx?$/,
      exclude: /(node_modules|bower_components)/,
      use: [
        {
          loader: "ts-loader",
          options: {
            configFile: path.join(
              util.rootPath(),
              process.env.NODE_ENV === "production"
                ? "tsconfig.build.json"
                : "tsconfig.json"
            ),
          },
        },
      ],
    },
  ],

  resolve: {
    // 导入此类文件时，不用添加文件后缀
    extensions: [".tsx", ".ts", ".js"],

    // 如果要配置路径别名，就在/tsconfig.json里面配置
    alias: {
      ...util.alias(),
    },
    fallback: {
      fs: false,
    },
  },

  // 优化: https://webpack.js.org/configuration/optimization/
  optimization: {
    minimizer: [],
  },

  // 插件: https://webpack.js.org/configuration/plugins/#plugins
  plugins: [new CleanWebpackPlugin()],

  // 实验性支持: https://webpack.js.org/configuration/experiments/
  experiments: {
    topLevelAwait: true,
  },
};
