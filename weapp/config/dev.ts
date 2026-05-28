module.exports = {
  env: {
    NODE_ENV: '"development"',
    TARO_APP_API_URL: JSON.stringify(process.env.TARO_APP_API_URL || 'http://192.168.1.122:3000/api')
  },
  defineConstants: {
  },
  mini: {},
  h5: {}
}
