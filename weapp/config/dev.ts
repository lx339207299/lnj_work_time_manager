module.exports = {
  env: {
    NODE_ENV: '"development"',
    TARO_APP_API_URL: JSON.stringify(process.env.TARO_APP_API_URL || 'https://test-yggl.bear0811.cn/api')
  },
  defineConstants: {
  },
  mini: {},
  h5: {}
}
