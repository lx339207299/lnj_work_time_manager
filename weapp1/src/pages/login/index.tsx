import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button, Input } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { useUserStore } from '../../store/userStore'
import { authService } from '../../services/authService'
import './index.scss'

function Login() {
  const setUserInfo = useUserStore((state) => state.setUserInfo)
  const setToken = useUserStore((state) => state.setToken)
  
  // Form State
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Countdown State
  const [countdown, setCountdown] = useState(0)
  
  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendCode = async () => {
    if (!phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    try {
      await authService.sendCode(phone)
      Taro.showToast({ title: '验证码已发送', icon: 'success' })
      setCountdown(60)
    } catch (error) {
      Taro.showToast({ title: '发送失败，请重试', icon: 'error' })
    }
  }

  const handleLogin = async () => {
    if (!phone || !code) {
        Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        return
    }

    setLoading(true)
    try {
        const { token, user, isProfileComplete } = await authService.loginByPhone(phone, code)
        
        setToken(token)
        setUserInfo(user)
        
        Taro.showToast({ title: '登录成功', icon: 'success' })
        
        setTimeout(() => {
            if (isProfileComplete) {
                Taro.switchTab({ url: '/pages/project/index' })
            } else {
                Taro.showToast({ title: '请完善个人资料', icon: 'none' })
                setTimeout(() => {
                    Taro.navigateTo({ url: `/pages/mine/profile/index?isNew=true` })
                }, 500)
            }
        }, 1500)
    } catch (error: any) {
        Taro.showToast({ title: error.message || '登录失败', icon: 'error' })
    } finally {
        setLoading(false)
    }
  }

  return (
    <View className="login-container">
      <View className="login-header">
        <View className="title">欢迎回来</View>
        <View className="subtitle">用工管理系统 - 手机号登录</View>
      </View>
      
      <View className="login-form">
        <View className="input-group">
            <Input 
                placeholder="请输入手机号" 
                value={phone} 
                onChange={(val) => setPhone(val)}
                type="number"
                maxLength={11}
            />
        </View>

        <View className="input-group has-button">
            <Input 
                placeholder="请输入验证码" 
                value={code} 
                onChange={(val) => setCode(val)}
                type="number"
                maxLength={6}
            />
            <View 
                className={`code-btn ${countdown > 0 ? 'disabled' : ''}`}
                onClick={countdown > 0 ? undefined : handleSendCode}
            >
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
            </View>
        </View>

        <Button 
            type="primary" 
            block 
            className="submit-btn"
            loading={loading}
            onClick={handleLogin}
            disabled={!phone || !code}
        >
          登录
        </Button>
      </View>
    </View>
  )
}

export default Login
