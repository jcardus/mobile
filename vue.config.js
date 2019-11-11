'use strict'
const path = require('path')
const defaultSettings = require('./src/settings.js')
const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0
const webpack = require('webpack')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const name = defaultSettings.title || '' // page title

// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, Mac: sudo npm run
// You can change the port by the following method:
// port = 9527 npm run dev OR npm run dev --port = 9527
const port = 8080

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  pwa: {
    name: 'Pinme',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    iconPaths:
      {
        favicon32: 'img/favicon/pinme64.png',
        favicon16: 'img/favicon/pinme64.png',
        appleTouchIcon: 'img/favicon/pinme152.png',
        maskIcon: 'img/favicon/pinme152.png',
        msTileImage: 'img/favicon/pinme144.png'
      },
    // configure the workbox plugin
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      // swSrc is required in InjectManifest mode.
      swSrc: 'src/service-worker.js'
    },
    manifestOptions: {
      'icons': [{
        'src': '/img/favicon/pinme128.png',
        'sizes': '128x128',
        'type': 'image/png'
      }, {
        'src': '/img/favicon/pinme144.png',
        'sizes': '144x144',
        'type': 'image/png'
      }, {
        'src': '/img/favicon/pinme152.png',
        'sizes': '152x152',
        'type': 'image/png'
      }, {
        'src': '/img/favicon/pinme192.png',
        'sizes': '192x192',
        'type': 'image/png'
      }, {
        'src': '/img/favicon/pinme256.png',
        'sizes': '256x256',
        'type': 'image/png'
      }, {
        'src': '/img/favicon/pinme512.png',
        'sizes': '512x512',
        'type': 'image/png'
      }],
      'start_url': '/index.html',
      'display': 'standalone',
      'background_color': '#3E4EB8',
      'theme_color': '#2F3BA2'
    }
  },

  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  devServer: {
    disableHostCheck: true,
    https: true,
    port: port,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    }
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          PACKAGE_VERSION: '"' + version + '"' }})
    ],
    // plugins: [new BundleAnalyzerPlugin()],
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name: name,
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  },
  chainWebpack(config) {
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('eval-source-map')
      )

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
            // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })
          config.optimization.runtimeChunk('single')
        }
      )
  }
}
