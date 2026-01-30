import { request } from '../utils/request'

export interface Invitation {
    id: string
    code: string
    orgId: string
    inviterId: string
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
    return request({ url: '/invitations/accept', method: 'POST', data: { code } })
  }
}
