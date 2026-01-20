import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import { useUserStore } from '../store/userStore'

export const useAuth = () => {
  const token = useUserStore((state) => state.token)
  const setToken = useUserStore((state) => state.setToken)
  const setUserInfo = useUserStore((state) => state.setUserInfo)

  // Initialize auth state from storage
  useEffect(() => {
    const storedToken = Taro.getStorageSync('token')
    if (storedToken && !token) {
      setToken(storedToken)
      // TODO: Fetch user info using token
    }
  }, [])

  const checkAuth = () => {
    let route = ''
    const currentPages = Taro.getCurrentPages()

    if (currentPages.length > 0) {
      const currentPage = currentPages[currentPages.length - 1]
      route = currentPage?.route || ''
    } else if (process.env.TARO_ENV === 'h5') {
      // H5 Fallback when currentPages is empty (e.g. initial load)
      const hash = window.location.hash
      // Remove # and query params
      route = hash.replace(/^#/, '').split('?')[0]
    }

    // Normalize route: remove leading slash
    route = route.replace(/^\//, '')

    // Whitelist
    const whitelist = ['pages/login/index']
    
    // If route is empty, it might be launching, assume it's home page (which needs auth) unless it's explicitly login
    // But if we can't determine route, defaulting to login check is safer
    if (!token && route && !whitelist.includes(route)) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }

  return { token, checkAuth }
}
