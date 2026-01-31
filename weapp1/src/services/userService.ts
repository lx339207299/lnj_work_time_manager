import { request } from '../utils/request'
import { UserInfo } from '../../types/global'

export const userService = {
  // Get user profile
  getUserInfo: async (token?: string): Promise<UserInfo> => {
    try {
      const res: any = await request({
        url: '/auth/profile',
        method: 'POST',
        token
      })
      
      const resData = res.data
      const data = Array.isArray(resData) ? resData[0] : resData

      // Adapt server response to frontend UserInfo interface
      // Server returns { ...user, currentOrg: { id, name }, role }
      // We ensure orgId is available for frontend compatibility
      return {
        ...data,
        orgId: data.currentOrg?.id || data.currentOrgId || null
      }
    } catch (error) {
      throw new Error('获取用户信息失败')
    }
  },

  // Update user profile
  updateUserInfo: async (data: Partial<UserInfo>, token?: string): Promise<UserInfo> => {
    const { data: resData } = (await request({ url: '/auth/update-profile', method: 'POST', data, token })) as any
    return Array.isArray(resData) ? resData[0] : resData
  }
}
