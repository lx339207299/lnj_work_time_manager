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
    const currentPages = Taro.getCurrentPages()
    const currentPage = currentPages[currentPages.length - 1]
    const route = currentPage?.route

    // Whitelist
    const whitelist = ['pages/login/index']
    
    if (!token && !whitelist.includes(route || '')) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }

  return { token, checkAuth }
}
