import { request } from '../utils/request'
import Taro from '@tarojs/taro'

export interface User {
  id: string
  name: string
  phone: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
}

export const authService = {
  // Send verification code (Mock for now, or real API if implemented)
  sendCode: async (phone: string): Promise<boolean> => {
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
            data: { phone, password: code }
        })
        
        // Save token
        Taro.setStorageSync('token', res.access_token)
        
        return {
            token: res.access_token,
            user: res.user,
            isProfileComplete: !res.isNewUser && !!res.user.name
        }
    } catch (error) {
        throw new Error('登录失败')
    }
  }
}
