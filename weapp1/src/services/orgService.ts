import { request } from '../utils/request'

export const orgService = {
  // Get user's organization list
  getUserOrgs: async () => {
    return request({ url: '/organizations/list', method: 'POST' })
  },

  // Create organization
  createOrg: async (name: string): Promise<any> => {
    return request({ url: '/organizations/create', method: 'POST', data: { name } })
  },

  // Exit organization
  exitOrg: async (orgId: string): Promise<void> => {
    return request({ url: '/organizations/leave', method: 'POST', data: { id: orgId } })
  }
}
