import React from 'react'
import { View } from '@tarojs/components'
import { Button, Input, Form } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/userStore'
import './index.scss'

function Login() {
  const setUserInfo = useUserStore((state) => state.setUserInfo)
  const setToken = useUserStore((state) => state.setToken)

  const handleLogin = () => {
    // Mock login
    const mockToken = 'mock_token_' + Date.now()
    const mockUser = { id: 1, name: 'Test User', role: 'admin' }
    
    setToken(mockToken)
    setUserInfo(mockUser)
    
    Taro.setStorageSync('token', mockToken)
    
    Taro.showToast({ title: '登录成功', icon: 'success' })
    
    setTimeout(() => {
      Taro.switchTab({ url: '/pages/project/index' })
    }, 1500)
  }

  return (
    <View className="login-container">
      <View className="login-header">
        <View className="title">欢迎回来</View>
        <View className="subtitle">工时管理系统</View>
      </View>
      
      <View className="login-form">
        <Button type="primary" block onClick={handleLogin}>
          一键登录 (模拟)
        </Button>
      </View>
    </View>
  )
}

export default Login
