const chalk = require('chalk')
const config = require('../vue.config.js')

const port = 9526
const publicPath = config.publicPath

const connect = require('connect')
const serveStatic = require('serve-static')
const app = connect()

app.use(
  publicPath,
  serveStatic('./dist', {
    index: ['index.html', '/']
  })
)

app.listen(port, function () {
  console.log(chalk.green(`> Preview at  http://localhost:${port}${publicPath}`))
})
