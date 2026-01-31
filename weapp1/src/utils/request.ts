import Taro from '@tarojs/taro'

export class CustomError extends Error {
  code: number
  data?: any
  property?: any
  
  constructor(code: number, message: string, extra?: { data?: any, property?: any }) {
    super(message)
    this.code = code
    this.data = extra?.data
    this.property = extra?.property
  }
}

const baseUrl = process.env.TARO_APP_API_URL || 'http://localhost:3000'

export interface RequestOptions extends Taro.request.Option {
  token?: string
}

export const request = async (options: RequestOptions) => {
  const { url, header = {}, token: manualToken } = options
  
  // Get token from storage or manual param
  const token = manualToken || Taro.getStorageSync('token')
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  try {
    const res = await Taro.request({
      ...options,
      url: url.startsWith('http') ? url : `${baseUrl}${url}`,
      header
    })

    // Handle global errors
    if (res.statusCode === 401) {
      // Redirect to login
      Taro.reLaunch({ url: '/pages/login/index' })
      throw new Error('未授权，请重新登录')
    }

    if (res.statusCode === 404) {
      throw new Error(`接口不存在: ${options.method || 'GET'} ${options.url}`)
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const body = res.data
      console.log(body);
      // Handle unified response format
        const { status, data, property } = body
        if (status.code == 0) {
          return body
        }
        if (status.code === 99) {
          // Auth fail
          Taro.removeStorageSync('token')
          Taro.reLaunch({ url: '/pages/login/index' })
          throw new Error(status.msg || '登录失效')
        }
        throw new CustomError(status.code, status.msg || '登录失效', {data, property})
    }
  } catch (err: any) {
    // 如果是网络错误（Taro.request 抛出的异常）
    if (err.errMsg?.includes('fail') || err.errMsg?.includes('timeout')) {
      Taro.showToast({ title: '网络请求失败', icon: 'none' })
    }
    throw err
  }
}
