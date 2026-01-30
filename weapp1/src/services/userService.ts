import { request } from '../utils/request'
import { UserInfo } from '../../types/global'

export const userService = {
  // Get user profile
  getUserInfo: async (): Promise<UserInfo> => {
    try {
      const res: any = await request({
        url: '/auth/profile',
        method: 'POST'
      })
      
      // Adapt server response to frontend UserInfo interface
      // Server returns { ...user, currentOrg: { id, name }, role }
      // We ensure orgId is available for frontend compatibility
      return {
        ...res,
        orgId: res.currentOrg?.id || res.currentOrgId || null
      }
    } catch (error) {
      throw new Error('获取用户信息失败')
    }
  }
}
