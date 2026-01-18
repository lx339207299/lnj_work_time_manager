import Taro from '@tarojs/taro'

const baseUrl = process.env.TARO_APP_API_URL || 'https://api.example.com'

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
      Taro.reLaunch({ url: '/pages/login/index' }) // Assuming login page exists
    }

    return res.data
  } catch (err) {
    Taro.showToast({ title: '网络请求失败', icon: 'none' })
    throw err
  }
}
