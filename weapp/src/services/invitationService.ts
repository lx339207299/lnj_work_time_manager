import { request } from '../utils/request'
import { userService } from './userService'

export interface Invitation {
    id: number
    code: string
    orgId: number
    inviterId: number
    status: string
    expiresAt: string
    organization?: {
        name: string
        owner: {
            name: string
        }
    }
    inviter?: {
        name: string
        phone: string
    }
}

export const invitationService = {
  // Create invitation
  create: async (): Promise<Invitation> => {
    const { data } = await request({ url: '/invitations/create', method: 'POST' }) as any
    return Array.isArray(data) ? data[0] : data
  },

  // Get invitation info
  get: async (code: string): Promise<Invitation> => {
    const { data } = await request({ url: '/invitations/detail', method: 'POST', data: { code } }) as any
    return Array.isArray(data) ? data[0] : data
  },

  // Accept invitation
  accept: async (code: string): Promise<any> => {
    const res = await request({ url: '/invitations/accept', method: 'POST', data: { code } })
    
    // 接受邀请后服务器已切换当前组织，同步本地缓存
    try {
      const profile = await userService.getUserInfo()
      if (profile?.currentOrg?.id) {
      }
    } catch (error) {
      console.warn('Failed to update org cache after accepting invitation:', error)
    }
    
    return res
  },

  // List invitations for current org
  list: async (): Promise<Invitation[]> => {
    const { data } = await request({ url: '/invitations/list', method: 'POST' }) as any
    return data
  },
}
