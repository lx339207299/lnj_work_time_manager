
import React, { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAuth } from '../../hooks/useAuth'
import { useAppStore } from '../../store/appStore'
import './index.scss'

export default function LoadingPage() {
  const { checkAuth } = useAuth()
  const { isInitialized } = useAppStore()

  useEffect(() => {
    // Start auth check / sync
    checkAuth()
  }, [])

  useDidShow(() => {
      if (isInitialized) {
          redirectToTarget()
      }
  })

  // Watch for initialization complete
  useEffect(() => {
      if (isInitialized) {
          redirectToTarget()
      }
  }, [isInitialized])

  const redirectToTarget = () => {
      // Logic to decide where to go
      const token = Taro.getStorageSync('token')
      
      // If we have token, we should have synced profile by now (in useAuth)
      // So we can check useUserStore().userInfo to be sure
      // But for now, token is enough indicator of "logged in"
      
      if (token) {
          Taro.switchTab({ url: '/pages/project/index' })
      } else {
          // If no token, go to login
          Taro.redirectTo({ url: '/pages/login/index' })
      }
  }

  return (
    <View className="loading-container" style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fff'
    }}>
      <View className="loading-spinner" />
      <Text style={{ marginTop: 20, color: '#999', fontSize: 14 }}>正在同步数据...</Text>
    </View>
  )
}
