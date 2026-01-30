import Taro from '@tarojs/taro'

const baseUrl = process.env.TARO_APP_API_URL || 'http://localhost:3000'

export const request = async (options: Taro.request.Option) => {
  const { url, header = {} } = options
  
  // Get token from storage or store (pseudo code)
  const token = Taro.getStorageSync('token')
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
      
      // Handle unified response format
      if (body && typeof body === 'object' && 'status' in body && 'data' in body) {
        const { status, data, property } = body
        
        if (status.code === 0) {
          // Success
          // Attach property to data if possible (for pagination etc.)
          if (property && typeof data === 'object' && data !== null) {
            try {
              Object.defineProperty(data, 'property', {
                value: property,
                enumerable: false,
                writable: true,
                configurable: true
              })
            } catch (e) {
              // Ignore if cannot attach
            }
          }
          return data
        } else if (status.code === 99) {
          // Auth fail
          Taro.removeStorageSync('token')
          Taro.reLaunch({ url: '/pages/login/index' })
          throw new Error(status.msg || '登录失效')
        } else {
          throw new Error(status.msg || '请求失败')
        }
      }
      
      return body
    }
  } catch (err: any) {
    // 如果是网络错误（Taro.request 抛出的异常）
    if (err.errMsg?.includes('fail') || err.errMsg?.includes('timeout')) {
      Taro.showToast({ title: '网络请求失败', icon: 'none' })
    }
    throw err
  }
}
