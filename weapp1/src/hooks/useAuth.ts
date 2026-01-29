import Taro from '@tarojs/taro'
import { useUserStore } from '../store/userStore'
import { request } from '../utils/request'

export const useAuth = () => {
  const { token, userInfo, setUserInfo } = useUserStore()
  
  const checkAuth = async () => {
    // ... whitelist ...
    const whitelist = [
        'pages/login/index',
        'pages/project/index',
        'pages/mine/index'
    ]
    
    // ... route detection ...
    let route = ''
    const currentPages = Taro.getCurrentPages()
    if (currentPages.length > 0) {
      const currentPage = currentPages[currentPages.length - 1]
      route = currentPage?.route || ''
    } else if (process.env.TARO_ENV === 'h5') {
      const hash = window.location.hash
      route = hash.replace(/^#/, '').split('?')[0]
    }
    route = route.replace(/^\//, '')

    // ... token retrieval ...
    let effectiveToken = token
    if (!effectiveToken && process.env.TARO_ENV === 'h5') {
         const storage = localStorage.getItem('user-storage')
         if (storage) {
             try {
                 const parsed = JSON.parse(storage)
                 if (parsed && parsed.state && parsed.state.token) {
                     effectiveToken = parsed.state.token
                 }
             } catch (e) {}
         }
    }

    // Redirect if no token
    if (!effectiveToken) {
      if (route && !whitelist.includes(route)) {
        if (process.env.TARO_ENV === 'h5') {
          if (!window.location.hash.includes('pages/login/index')) {
            Taro.redirectTo({ url: '/pages/login/index' })
          }
        } else {
          Taro.redirectTo({ url: '/pages/login/index' })
        }
      }
      return
    }
    if (effectiveToken && !Taro.getStorageSync('token')) {
      Taro.setStorageSync('token', effectiveToken)
    }

    // Sync Profile Logic
    const now = Date.now()
    const lastSyncTime = Taro.getStorageSync('last_sync_time') || 0
    const shouldSync = !userInfo || (now - lastSyncTime > 10 * 1000)

    if (shouldSync) {
      try {
        const user: any = await request({ url: '/auth/profile', method: 'GET' })
        setUserInfo(user)
        Taro.setStorageSync('last_sync_time', now)
      } catch (e) {
        console.error('Sync profile failed', e)
      }
    }

  }
  return { token, checkAuth }
}
