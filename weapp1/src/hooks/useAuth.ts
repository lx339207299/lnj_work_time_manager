import Taro from '@tarojs/taro'
import { useEffect } from 'react'
import { useUserStore } from '../store/userStore'

export const useAuth = () => {
  const token = useUserStore((state) => state.token)
  
  const checkAuth = () => {
    // Whitelist
    const whitelist = [
        'pages/login/index',
        'pages/project/index',
        'pages/mine/index'
    ]
    
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

    // Check Token
    // In H5, Zustand persist might not have rehydrated yet on the very first render cycle of App.tsx
    // So we double check with localStorage if token in store is null
    let effectiveToken = token
    if (!effectiveToken && process.env.TARO_ENV === 'h5') {
         const storage = localStorage.getItem('user-storage')
         if (storage) {
             try {
                 const parsed = JSON.parse(storage)
                 if (parsed && parsed.state && parsed.state.token) {
                     effectiveToken = parsed.state.token
                 }
             } catch (e) {
                 console.error('Failed to parse user-storage', e)
             }
         }
    }

    if (!effectiveToken && route && !whitelist.includes(route)) {
      // Prevent redirect loop if we are already on login page (sometimes route check might fail slightly)
      if (!window.location.hash.includes('pages/login/index')) {
          Taro.redirectTo({ url: '/pages/login/index' })
      }
    }
  }

  return { token, checkAuth }
}

