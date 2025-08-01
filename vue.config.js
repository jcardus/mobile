'use strict'
const path = require('path')
const defaultSettings = require('./src/settings.js')
const fs = require('fs')
const packageJson = fs.readFileSync('./package.json')
const version = JSON.parse(packageJson).version || 0
const webpack = require('webpack')
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const SentryPlugin = require('@sentry/webpack-plugin')

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
console.log('ENVIRONMENT:', process.env.ENVIRONMENT)
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('ENV:', process.env.ENV)
console.log('COGNITO_CLIENT_ID:', process.env.COGNITO_CLIENT_ID)
console.log('SERVER_HOST:', process.env.SERVER_HOST)
console.log('SENTRY_AUTH_TOKEN:', process.env.SENTRY_AUTH_TOKEN)
console.log('SENTRY_DSN:', process.env.SENTRY_DSN)
console.log('MAPBOX_TOKEN:', process.env.MAPBOX_TOKEN)
console.log('APP_NAME:', process.env.APP_NAME)

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  pwa: {
    name: name,
    themeColor: '#F8F9FE',
    msTileColor: '#F8F9FE',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
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
      // exclude: [/OneSignal.*\.js$/],
      // swSrc is required in InjectManifest mode.
      swSrc: 'src/service-worker.js'
      // swSrc: 'public/OneSignalSDKWorker.js'
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
      'start_url': '/mobile/index.html',
      'display': 'standalone',
      'background_color': '#F8F9FE',
      'theme_color': '#F8F9FE',
      'permissions': [
        'cookies'
      ]
    }
  },

  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  publicPath: `/${process.env.ENV !== 'capacitor' ? 'mobile/' : ''}`,
  outputDir: 'dist',
  assetsDir: 'staticmobile',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: true,
  devServer: {
    disableHostCheck: true,
    https: false,
    port: port,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      '/backend': {
        pathRewrite: { '^/backend': 'backend' },
        target: 'https://api.pinme.io',
        logLevel: 'debug'
      },
      '/api': {
        pathRewrite: { '^/api': 'api' },
        target: 'https://api.pinme.io',
        logLevel: 'debug'
      }
    }
  },
  configureWebpack: () => {
    return {
      name: name,
      resolve: {
        alias: {
          '@': resolve('src')
        }
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.mode': '"' + process.env.ENV + '"',
          'process.env': {
            SENTRY_DSN: `"${process.env.SENTRY_DSN}"`,
            SENTRY_ORG: `"${process.env.SENTRY_ORG}"`,
            WEB_SOCKET_HOST: `"${process.env.WEB_SOCKET_HOST}"`,
            SERVER_HOST: `"${process.env.SERVER_HOST}"`,
            PACKAGE_NAME: `"${process.env.PACKAGE_NAME}"`,
            MAPBOX_TOKEN: `"${process.env.MAPBOX_TOKEN}"`,
            COGNITO_CLIENT_ID: `"${process.env.COGNITO_CLIENT_ID}"`,
            AUTH_DOMAIN: `"${process.env.AUTH_DOMAIN}"`,
            REDIRECT_SIGNIN: `"${process.env.REDIRECT_SIGNIN}"`,
            SOCIAL_SIGN_IN: `"${process.env.SOCIAL_SIGN_IN}"`,
            USER_POOL_ID: `"${process.env.USER_POOL_ID}"`,
            ID_POOL_ID: `"${process.env.ID_POOL_ID}"`,
            PACKAGE_VERSION: '"' + version + '"',
            accessKeyId: `"${process.env.accessKeyId}"`,
            secretAccessKey: `"${process.env.secretAccessKey}"`
          }}),
        new MomentLocalesPlugin({ localesToKeep: ['pt', 'es'] }),
        ...(process.env.NODE_ENV === 'development' || !process.env.SENTRY_AUTH_TOKEN ? [] : [
          new SentryPlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT || 'javascript-vue',
            release: version + '_' + (process.env.PACKAGE_NAME || 'mobile_web'),
            include: './dist'
          }),
          new ReplaceInFileWebpackPlugin([{
            dir: 'dist',
            files: ['OneSignalSDKWorker.js', 'OneSignalSDKUpdaterWorker.js', 'index.html'],
            rules: [{
              search: /version/ig,
              replace: version
            }]
          }])
        ])
      ]
    }
  },
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    }
  }
}
