const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const copyPlugin = require('copy-webpack-plugin');
const esmRequire = require('esm')(module);

const IS_IN_NODE_MODULES = path.resolve(__dirname).includes('node_modules');

const nodeModulesPath = IS_IN_NODE_MODULES
  ? path.resolve(__dirname, '../')
  : path.resolve(__dirname, './node_modules');
const userProjectRoot = IS_IN_NODE_MODULES ? path.resolve(__dirname, '../../') : __dirname;
const userDataPath = IS_IN_NODE_MODULES
  ? path.resolve(userProjectRoot, './.fragy')
  : path.resolve(__dirname, './.fragy');
const userConfigPath = IS_IN_NODE_MODULES
  ? path.resolve(userProjectRoot, './fragy.config.js')
  : path.resolve(__dirname, './fragy.config.js');

// check user config path
if (!fs.existsSync(userConfigPath)) {
  throw new Error('Cannot locate user configuration (fragy.config.js), please check your project.');
}

const { formatConfig } = esmRequire('./src/utils/config');
const fragyConfig = formatConfig(esmRequire(userConfigPath).default);
const themeFuncs = {};

const context = {
  frameworkRoot: __dirname,
  siteTitle: fragyConfig.title,
  themePkg: fragyConfig.theme.package,
  themeConfigPath: path.resolve(nodeModulesPath, `./${fragyConfig.theme.package}/config.js`),
  themeEntryPath: path.resolve(nodeModulesPath, `./${fragyConfig.theme.package}/entry.vue`),
  // config objs
  fragyConfig,
};

const themeConfig = esmRequire(context.themeConfigPath).default;
const userThemeConfig = fragyConfig.theme.config;
if (userThemeConfig) {
  Object.assign(themeConfig, userThemeConfig);
}
context.themeConfig = themeConfig;

const chainWebpack = (config) => {
  // theme flags
  config.plugin('fragy-flags').use(webpack.DefinePlugin, [
    {
      __FAVICON_URL__: JSON.stringify(fragyConfig.icon),
      __FRAGY_TITLE__: JSON.stringify(context.siteTitle),
      __FRAGY_LOCALE__: JSON.stringify(context.fragyConfig.locale),
      __FRAGY_THEME_PKG__: JSON.stringify(context.themePkg),
      __FRAGY_USER_CONFIG_PATH__: JSON.stringify(userConfigPath),
      __FRAGY_THEME_CONFIG_PATH__: JSON.stringify(context.themeConfigPath),
      __FRAGY_THEME_ENTRY_PATH__: JSON.stringify(context.themeEntryPath),
    },
  ]);

  // copy public files
  const publicPath = path.resolve(userDataPath, './public');
  if (fs.existsSync(publicPath)) {
    config.plugin('public-files').use(copyPlugin, [
      {
        patterns: [
          {
            from: publicPath,
          },
        ],
      },
    ]);
  }

  // copy posts and feed data
  const { feed: articleFeed } = fragyConfig.articles;
  if (articleFeed && !/^https?\/\//.test(articleFeed)) {
    const articlesSource = `${path.resolve(userDataPath, './posts').replace(/\\/g, '/')}/**/*.md`;
    config.plugin('fragy-articles').use(copyPlugin, [
      {
        patterns: [
          {
            from: articlesSource,
            to: `${articleFeed.substr(1)}/[name].md`,
          },
        ],
      },
    ]);
  }

  const { output: articleListPath, feed: articleListFeed } = fragyConfig.articleList;
  if (articleListFeed && !/^https?\/\//.test(articleListFeed)) {
    config.plugin('fragy-article-list').use(copyPlugin, [
      {
        patterns: [
          {
            from: path.resolve(userDataPath, articleListPath),
            to: articleListFeed.substr(1),
          },
        ],
      },
    ]);
  }

  config.optimization.splitChunks({
    cacheGroups: {
      theme: {
        name: 'theme',
        chunks: 'async',
        test: new RegExp(context.themePkg.replace(/\//g, '[\\\\/]')),
        priority: 20,
      },
      themeVendors: {
        name: 'theme-vendors',
        chunks: 'async',
        test: /[\\/]node_modules[\\/]/,
        priority: 10,
      },
      defaultVendors: {
        name: `chunk-vendors`,
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        chunks: 'initial',
      },
    },
  });

  if (process.env.BUNDLE_ANALYZE === 'true') {
    config.plugin('bundle-analyzer').use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
  }
  if (themeFuncs.chainWebpack) {
    themeFuncs.chainWebpack(config);
  }
};

const configureWebpack = (config) => {
  if (themeFuncs.configureWebpack) {
    themeFuncs.configureWebpack(config);
  }
};

const vueConfig = {
  outputDir: IS_IN_NODE_MODULES ? path.resolve(userProjectRoot, './dist') : 'dist',
  chainWebpack,
  configureWebpack,
};

// merge theme vue.config.js
const themeFilePath = path.resolve(nodeModulesPath, `./${fragyConfig.theme.package}/vue.config.js`);

if (fs.existsSync(themeFilePath)) {
  let exported = require(themeFilePath);
  // if exported item is a function, get the return.
  if (typeof exported === 'function') {
    exported = exported.call(null, context);
  }
  if (exported.chainWebpack) {
    themeFuncs.chainWebpack = exported.chainWebpack;
  }
  if (exported.configureWebpack) {
    themeFuncs.configureWebpack = exported.configureWebpack;
  }
  // assign static properties
  const staticExported = JSON.parse(JSON.stringify(exported));
  Object.assign(vueConfig, staticExported);
}

module.exports = vueConfig;
