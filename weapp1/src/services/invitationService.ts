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
  create: async (orgId: string): Promise<Invitation> => {
    return request({ url: '/invitations', method: 'POST', data: { orgId } })
  },

  // Get invitation info
  get: async (code: string): Promise<Invitation> => {
    return request({ url: `/invitations/${code}`, method: 'GET' })
  },

  // Accept invitation
  accept: async (code: string): Promise<any> => {
    return request({ url: `/invitations/${code}/accept`, method: 'POST' })
  }
}
