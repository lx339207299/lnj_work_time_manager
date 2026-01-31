import { request } from '../utils/request'

export const orgService = {
  // Get user's organization list
  getUserOrgs: async () => {
    const { data } = (await request({ url: '/organizations/list', method: 'POST' })) as any
    return data
  },

  // Create organization
  createOrg: async (name: string): Promise<any> => {
    const { data: resData } = (await request({ url: '/organizations/create', method: 'POST', data: { name } })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  // Exit organization
  exitOrg: async (orgId: string): Promise<void> => {
    await request({ url: '/organizations/leave', method: 'POST', data: { id: orgId } })
  }
}
