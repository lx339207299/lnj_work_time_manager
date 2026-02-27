import { request } from '../utils/request'
import Taro from '@tarojs/taro'
import { orgManager } from '../utils/orgManager'
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

        // 缓存组织ID
        if (data.user?.currentOrg?.id) {
          orgManager.setCurrentOrgId(data.user.currentOrg.id)
        }

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
    return res.data
  },

  loginWithPassword: async (phone: string, password: string): Promise<{ token: string, user: User, isProfileComplete: boolean }> => {
    try {
      const res: any = await request({
        url: '/auth/login-password',
        method: 'POST',
        data: { phone, password }
      })
      const data = res.data[0]
      if (data.user?.currentOrg?.id) {
        orgManager.setCurrentOrgId(data.user.currentOrg.id)
      }
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
      if (data.user?.currentOrg?.id) {
        orgManager.setCurrentOrgId(data.user.currentOrg.id)
      }
      return {
        token: data.access_token,
        user: data.user,
        isProfileComplete: !data.isNewUser && !!data.user.name
      }
    } catch (error: any) {
      throw new Error(error.message || '注册失败')
    }
  }
}
