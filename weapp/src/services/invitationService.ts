import { request } from '../utils/request'
import { orgManager } from '../utils/orgManager'

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
    return request({ url: '/invitations/create', method: 'POST' })
  },

  // Get invitation info
  get: async (code: string): Promise<Invitation> => {
    return request({ url: '/invitations/detail', method: 'POST', data: { code } })
  },

  // Accept invitation
  accept: async (code: string): Promise<any> => {
    const res = await request({ url: '/invitations/accept', method: 'POST', data: { code } })
    
    // 如果邀请被接受，可能切换到了新的组织，尝试获取新的组织信息
    try {
      const profileRes = await request({ url: '/auth/profile', method: 'POST' })
      if (profileRes?.currentOrgId) {
        orgManager.setCurrentOrgId(profileRes.currentOrgId)
      }
    } catch (error) {
      console.warn('Failed to update org cache after accepting invitation:', error)
    }
    
    return res
  }
}
