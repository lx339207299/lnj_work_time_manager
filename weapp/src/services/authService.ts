import { request } from '../utils/request'
import Taro from '@tarojs/taro'
import { log } from 'console'

export interface User {
  id: number
  name: string
  phone: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
  currentOrg?: {
    id: number
    name: string
  }
  isWechatBound?: boolean
}

export const authService = {
  // Send verification code (Mock for now, or real API if implemented)
  sendCode: async (_phone: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        Taro.showToast({ title: '验证码: 123456', icon: 'none' })
        resolve(true)
      }, 500)
    })
  },

  // Login (Using password for now as backend supports it)
  loginByPhone: async (phone: string, code: string): Promise<{ token: string, user: User, isProfileComplete: boolean }> => {
    try {
        const res: any = await request({
            url: '/auth/login-or-register',
            method: 'POST',
            data: { phone, code }
        })
        
        const resData = res.data
        const data = Array.isArray(resData) ? resData[0] : resData



        return {
            token: data.access_token,
            user: data.user,
            isProfileComplete: !data.isNewUser && !!data.user.name
        }
    } catch (error) {
        throw new Error('登录失败')
    }
  },

  checkUserStatus: async (phone: string): Promise<{ exists: boolean, hasPassword: boolean }> => {
    const res: any = await request({
      url: '/auth/check-status',
      method: 'POST',
      data: { phone }
    })
    const resData = res.data
    return Array.isArray(resData) ? resData[0] : resData
  },

  loginWithPassword: async (phone: string, password: string): Promise<{ token: string, user: User, isProfileComplete: boolean }> => {
    try {
      const res: any = await request({
        url: '/auth/login-password',
        method: 'POST',
        data: { phone, password }
      })
      const data = res.data[0]

      return {
        token: data.access_token,
        user: data.user,
        isProfileComplete: !data.isNewUser && !!data.user.name
      }
    } catch (error: any) {
      throw new Error(error.message || '登录失败')
    }
  },

  registerWithPassword: async (phone: string, password: string): Promise<{ token: string, user: User, isProfileComplete: boolean }> => {
    try {
      const res: any = await request({
        url: '/auth/register-password',
        method: 'POST',
        data: { phone, password }
      })
      const data = res.data[0]

      return {
        token: data.access_token,
        user: data.user,
        isProfileComplete: !data.isNewUser && !!data.user.name
      }
    } catch (error: any) {
      throw new Error(error.message || '注册失败')
    }
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await request({
        url: '/auth/change-password',
        method: 'POST',
        data: { oldPassword, newPassword }
      })
    } catch (error: any) {
      throw new Error(error.message || '修改失败')
    }
  },

  // --- WeChat Login ---

  wechatLogin: async (code: string): Promise<{ token: string, user: any, isNewUser: boolean }> => {
    const res: any = await request({
      url: '/auth/wechat-login',
      method: 'POST',
      data: { code },
      token: '', // 不需要 token
    })
    const data = res.data[0]
    return {
      token: data.access_token,
      user: data.user,
      isNewUser: data.isNewUser,
    }
  },

  bindPhone: async (phoneCode: string, token: string): Promise<{ token: string, user: any }> => {
    const res: any = await request({
      url: '/auth/bind-phone',
      method: 'POST',
      data: { code: phoneCode },
      token,
    })
    const data = res.data[0]
    return {
      token: data.access_token,
      user: data.user,
    }
  },

  bindPhoneManual: async (phone: string, token: string): Promise<{ token: string, user: any }> => {
    const res: any = await request({
      url: '/auth/bind-phone-manual',
      method: 'POST',
      data: { phone },
      token,
    })
    const data = res.data[0]
    return {
      token: data.access_token,
      user: data.user,
    }
  },

  updateProfile: async (profile: { name?: string, avatar?: string }, token: string): Promise<void> => {
    await request({
      url: '/auth/update-profile',
      method: 'POST',
      data: profile,
      token,
    })
  },

  bindWechat: async (code: string): Promise<void> => {
    await request({
      url: '/auth/bind-wechat',
      method: 'POST',
      data: { code },
    })
  },
}
