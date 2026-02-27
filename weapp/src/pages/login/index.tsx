import React, { useState, useEffect } from 'react'
import { View } from '@tarojs/components'
import { Button, Input } from '@nutui/nutui-react-taro'
import Taro from '@tarojs/taro'
import { authService } from '../../services/authService'
import { orgManager } from '../../utils/orgManager'
import './index.scss'

function Login() {
  
  // Form State
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // New login flow states
  const [step, setStep] = useState(1) // 1: phone only, 2: password fields
  const [userStatus, setUserStatus] = useState<{ exists: boolean, hasPassword: boolean } | null>(null)
  
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

  const handleCheckStatus = async () => {
    if (!phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '手机号格式不正确', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const status = await authService.checkUserStatus(phone)
      setUserStatus(status[0])
      setStep(2)
    } catch (error: any) {
      Taro.showToast({ title: error.message || '检查用户状态失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmLogin = async () => {
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    if (userStatus && (!userStatus.exists || !userStatus.hasPassword)) {
      if (!confirmPassword) {
        Taro.showToast({ title: '请确认密码', icon: 'none' })
        return
      }
      if (password !== confirmPassword) {
        Taro.showToast({ title: '两次输入的密码不一致', icon: 'none' })
        return
      }
    }

    setLoading(true)
    try {
      let result: { token: string, user: any, isProfileComplete: boolean }
      if (userStatus?.hasPassword) {
        result = await authService.loginWithPassword(phone, password)
      } else {
        result = await authService.registerWithPassword(phone, password)
      }

      const { token, user, isProfileComplete } = result
      
      if (isProfileComplete) {
        Taro.setStorageSync('token', token)
        if (user?.currentOrg?.id) {
          orgManager.setCurrentOrgId(user.currentOrg.id)
        }
        
        setTimeout(() => {
          Taro.showToast({ title: '登录成功', icon: 'success' })
          Taro.switchTab({ url: '/pages/project/index' })
        }, 500)
      } else {
        Taro.showToast({ title: '请先完善个人资料', icon: 'none', duration: 2000 })
        setTimeout(() => {
          Taro.navigateTo({ url: `/pages/mine/profile/index?isNew=true&token=${encodeURIComponent(token)}` })
        }, 500)
      }
    } catch (error: any) {
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // Original handleLogin (verification code) - kept for internal use if needed
  const handleLoginByCode = async () => {
    if (!phone || !code) {
        Taro.showToast({ title: '请填写完整信息', icon: 'none' })
        return
    }

    setLoading(true)
    try {
        const { token, user, isProfileComplete } = await authService.loginByPhone(phone, code)
        if (isProfileComplete) {
            Taro.setStorageSync('token', token)
            if (user?.currentOrg?.id) {
              orgManager.setCurrentOrgId(user.currentOrg.id)
            }
            setTimeout(() => {
                    Taro.showToast({ title: '登录成功', icon: 'success' })
                    Taro.switchTab({ url: '/pages/project/index' })
                }, 500)
        } else {
            Taro.showToast({ title: '请先完善个人资料', icon: 'none', duration: 2000 })
            setTimeout(() => {
                Taro.navigateTo({ url: `/pages/mine/profile/index?isNew=true&token=${encodeURIComponent(token)}` })
            }, 500)
        }
    } catch (error: any) {
        Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
        setLoading(false)
    }
  }

  return (
    <View className="login-container">
      <View className="login-header">
        <View className="title">欢迎回来</View>
        <View className="subtitle">用工管理系统 - 密码登录</View>
      </View>
      
      <View className="login-form">
        <View className="input-group">
            <Input 
                placeholder="请输入手机号" 
                value={phone} 
                onChange={(val) => setPhone(val)}
                type="number"
                maxLength={11}
                disabled={step === 2}
            />
        </View>

        {/* Verification code login - hidden but kept as requested */}
        {false && (
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
        )}

        {step === 2 && (
          <>
            <View className="input-group">
                <Input 
                    placeholder={userStatus?.hasPassword ? "请输入密码" : "请设置密码"} 
                    value={password} 
                    onChange={(val) => setPassword(val)}
                    type="password"
                />
            </View>
            
            {(!userStatus?.exists || !userStatus?.hasPassword) && (
              <View className="input-group">
                  <Input 
                      placeholder="请再次确认密码" 
                      value={confirmPassword} 
                      onChange={(val) => setConfirmPassword(val)}
                      type="password"
                  />
              </View>
            )}
          </>
        )}

        <Button 
            type="primary" 
            block 
            className="submit-btn"
            loading={loading}
            onClick={step === 1 ? handleCheckStatus : handleConfirmLogin}
            disabled={!phone || (step === 2 && !password)}
        >
          {step === 1 ? '登录' : '确认登录'}
        </Button>

        {step === 2 && (
          <View 
            className="back-btn" 
            onClick={() => {
              setStep(1)
              setPassword('')
              setConfirmPassword('')
            }}
          >
            返回修改手机号
          </View>
        )}
      </View>
    </View>
  )
}

export default Login
