import { useState, useEffect } from 'react'
import { View, Text, Button, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { authService } from '../../services/authService'
import { orgManager } from '../../utils/orgManager'
import './index.scss'

type Step = 'login' | 'profile'

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>('login')
  const [loginMethod, setLoginMethod] = useState<'wechat' | 'phone'>('wechat')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [userName, setUserName] = useState('')
  const [phone, setPhone] = useState('') // deprecated state, leaving as is just in case, but replaced by profilePhone
  
  // Phone Login State
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isNewOrNoPassword, setIsNewOrNoPassword] = useState(false)

  // Profile Form State
  const [profilePhone, setProfilePhone] = useState('')
  const [isPhoneDisabled, setIsPhoneDisabled] = useState(false)

  // Step 1: 微信一键登录
  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      const loginRes = await Taro.login()
      if (!loginRes.code) {
        Taro.showToast({ title: '获取微信授权失败', icon: 'none' })
        return
      }

      const res = await authService.wechatLogin(loginRes.code)
      saveTokenAndGo(res.token, res.isNewUser, res.user)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async () => {
    if (!/^1\d{10}$/.test(loginPhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    
    // 1. 检查用户是否存在以及是否有密码
    if (!isNewOrNoPassword) {
      setLoading(true)
      try {
        const statusRes = await authService.checkUserStatus(loginPhone)
        if (!statusRes.exists || !statusRes.hasPassword) {
          setIsNewOrNoPassword(true)
          setLoading(false)
          return
        }
      } catch (err: any) {
        setLoading(false)
        Taro.showToast({ title: '检查状态失败', icon: 'none' })
        return
      }
    }

    // 2. 校验密码
    if (!loginPassword) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }

    if (isNewOrNoPassword && loginPassword !== confirmPassword) {
      Taro.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
    }
    
    setLoading(true)
    try {
      const res = await authService.registerWithPassword(loginPhone, loginPassword)
      // 如果是通过手机号登录的，进入完善资料页时手机号应该填好且不可修改
      if (!res.isProfileComplete || !res.user.name) {
         setProfilePhone(loginPhone)
         setIsPhoneDisabled(true)
      }
      saveTokenAndGo(res.token, !res.isProfileComplete, res.user)
    } catch (err: any) {
      Taro.showToast({ title: err.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // Step 3: 完善资料（手机号和姓名）
  const handleCompleteProfile = async () => {
    if (!/^1\d{10}$/.test(profilePhone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!userName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      // 如果手机号没有被禁用（微信登录未绑定手机号的情况），才需要绑定
      if (!isPhoneDisabled) {
        await authService.bindPhoneManual(profilePhone, token)
      }
      // 更新个人资料
      await authService.updateProfile({ name: userName.trim() }, token)
      
      Taro.setStorageSync('token', token)
      Taro.switchTab({ url: '/pages/project/index' })
    } catch (err: any) {
      Taro.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const saveTokenAndGo = (newToken: string, isNew: boolean, user?: any) => {
    setToken(newToken)
    if (user?.currentOrg?.id) {
      orgManager.setCurrentOrgId(user.currentOrg.id)
    }

    if (isNew || !user?.phone || !user?.name) {
      // 新用户或没有手机号/姓名：去完善资料
      setStep('profile')
    } else {
      // 完全注册的用户：直接进入项目列表
      Taro.setStorageSync('token', newToken)
      Taro.switchTab({ url: '/pages/project/index' })
    }
  }

  // 返回登录
  const handleBackToLogin = () => {
    setStep('login')
    setToken('')
    Taro.removeStorageSync('token')
  }

  return (
    <View className='login-container'>
      {step === 'login' && (
        <>
          <View className='login-header'>
            <Text className='title'>LNJ 工时管理</Text>
            <Text className='subtitle'>
              {loginMethod === 'wechat' ? '微信授权登录，快速体验' : '手机号快捷登录/注册'}
            </Text>
          </View>

          {loginMethod === 'wechat' ? (
            <View className='wechat-login-area'>
              {/* <View className='logo-wrapper'>
                <View className='logo-icon'>⏱️</View>
              </View> */}
              <Button
                className='wechat-btn'
                loading={loading}
                disabled={loading}
                onClick={handleWechatLogin}
              >
                微信一键登录
              </Button>
              <View className='toggle-method' onClick={() => setLoginMethod('phone')}>
                <Text>手机号登录</Text>
              </View>
              {/* <Text className='agree-text'>
                登录即表示同意《用户协议》和《隐私政策》
              </Text> */}
            </View>
          ) : (
            <View className='phone-login-area'>
              <View className='input-group'>
                <Input
                  className='phone-input'
                  type='number'
                  placeholder='请输入手机号'
                  maxlength={11}
                  value={loginPhone}
                  onInput={(e) => setLoginPhone(e.detail.value)}
                />
              </View>
              <View className='input-group'>
                <Input
                  className='code-input'
                  type='text'
                  password
                  placeholder='请输入密码'
                  maxlength={20}
                  value={loginPassword}
                  onInput={(e) => setLoginPassword(e.detail.value)}
                />
              </View>
              {isNewOrNoPassword && (
                <View className='input-group'>
                  <Input
                    className='code-input'
                    type='text'
                    password
                    placeholder='请再次输入密码'
                    maxlength={20}
                    value={confirmPassword}
                    onInput={(e) => setConfirmPassword(e.detail.value)}
                  />
                </View>
              )}
              <Button
                className='login-btn'
                loading={loading}
                onClick={handlePhoneLogin}
              >
                登录 / 注册
              </Button>
              <View className='toggle-method' onClick={() => setLoginMethod('wechat')}>
                <Text>微信一键登录</Text>
              </View>
              {/* <Text className='agree-text'>
                登录即表示同意《用户协议》和《隐私政策》
              </Text> */}
            </View>
          )}
        </>
      )}

      {step === 'profile' && (
        <>
          <View className='login-header'>
            <Text className='title'>完善资料</Text>
            <Text className='subtitle'>请输入您的手机号和姓名</Text>
          </View>

          <View className='profile-form'>
            <View className='input-group'>
              <Input
                className='phone-input'
                type='number'
                placeholder='请输入手机号（必填）'
                maxlength={11}
                value={profilePhone}
                disabled={isPhoneDisabled}
                onInput={(e) => setProfilePhone(e.detail.value)}
              />
            </View>

            <View className='input-group'>
              <Input
                className='name-input'
                placeholder='请输入姓名（必填）'
                value={userName}
                onInput={(e) => setUserName(e.detail.value)}
              />
            </View>

            <Button
              className='submit-btn'
              onClick={handleCompleteProfile}
              loading={loading}
            >
              完成
            </Button>

            <View className='back-btn' onClick={handleBackToLogin}>
              <Text>返回</Text>
            </View>
          </View>
        </>
      )}
    </View>
  )
}

export default LoginPage
