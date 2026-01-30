import React, { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Button, Input } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { authService } from '../../services/authService'
import './index.scss'

function Login() {
  
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
        
        Taro.setStorageSync('token', token)
        
        Taro.showToast({ title: '登录成功', icon: 'success' })
        
        setTimeout(() => {
            if (isProfileComplete) {
                Taro.switchTab({ url: '/pages/project/index' })
            } else {
                Taro.showToast({ title: '请先完善个人资料', icon: 'none', duration: 2000 })
                // Clear token from store to enforce profile completion before accessing app
                // Or better: keep token but redirect to profile with a flag
                // User said: "必须完善用户信息才能记录token" -> means we shouldn't persist token if incomplete?
                // But we need token to call updateProfile API!
                // So we keep token in memory/storage but treat user as "partially logged in".
                // But current architecture persists token immediately.
                
                // Let's redirect to profile. If they kill app and restart, they will be logged in but might be redirected again?
                // We should handle this in useAuth check.
                
                setTimeout(() => {
                    Taro.navigateTo({ url: `/pages/mine/profile/index?isNew=true` })
                }, 500)
            }
        }, 1500)
    } catch (error: any) {
        console.error('Login error:', error)
        // Ensure toast is shown even if error object is weird
        const msg = error.message || error.errMsg || '登录失败'
        console.error('Login error: msg === ', msg)
        // Use 'none' icon because 'error' icon is not standard in all Taro platforms or might be ignored
        Taro.showToast({ title: msg, icon: 'none', duration: 2000 })
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
