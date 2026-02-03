import { request } from '../utils/request'
import { ProfileReqOptions, UserInfo } from '../../types/global'

export const userService = {
  // Get user profile
  // 怎么样可以不传token只传ignoreTokenInvalid
  // 可以将token设为可选参数
  
  getUserInfo: async (options?: ProfileReqOptions): Promise<UserInfo> => {
      const res: any = await request({
        url: '/auth/profile',
        method: 'POST',
        token: options?.token,
        data: {
          'ignoreTokenInvalid': options?.ignoreTokenInvalid || false
        }
      })
      
      const resData = res.data
      const data = Array.isArray(resData) ? resData[0] : resData

      // Adapt server response to frontend UserInfo interface
      // Server returns { ...user, currentOrg: { id, name }, role }
      // We ensure orgId is available for frontend compatibility
      return data
  },

  // Update user profile
  updateUserInfo: async (data: Partial<UserInfo>, token?: string): Promise<UserInfo> => {
    const { data: resData } = (await request({ url: '/auth/update-profile', method: 'POST', data, token })) as any
    return Array.isArray(resData) ? resData[0] : resData
  }
}
