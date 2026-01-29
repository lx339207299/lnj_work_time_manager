import Taro from '@tarojs/taro'
import { useOrgStore } from '../store/orgStore'

const baseUrl = process.env.TARO_APP_API_URL || 'http://localhost:3000'

export const request = async (options: Taro.request.Option) => {
  const { url, header = {} } = options
  
  // Get token from storage or store (pseudo code)
  const token = Taro.getStorageSync('token')
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  // Get current orgId from store state directly (Zustand)
  // Note: We need to access the store outside of React components
  const currentOrg = useOrgStore.getState().currentOrg
  if (currentOrg?.id) {
      header['x-org-id'] = currentOrg.id
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

    if (res.statusCode >= 400) {
      const errorMessage = res.data?.message || `请求失败 (${res.statusCode})`
      throw new Error(errorMessage)
    }

    return res.data
  } catch (err: any) {
    // 如果是网络错误（Taro.request 抛出的异常）
    if (err.errMsg?.includes('fail') || err.errMsg?.includes('timeout')) {
      Taro.showToast({ title: '网络请求失败', icon: 'none' })
    }
    throw err
  }
}
