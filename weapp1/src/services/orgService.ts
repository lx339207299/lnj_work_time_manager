import { request } from '../utils/request'

export const orgService = {
  // Get user's organization list
  getUserOrgs: async () => {
    return request({ url: '/organizations', method: 'GET' })
  },

  // Create organization
  createOrg: async (name: string): Promise<any> => {
    return request({ url: '/organizations', method: 'POST', data: { name } })
  }
}
