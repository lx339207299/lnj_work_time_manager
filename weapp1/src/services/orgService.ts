import { request } from '../utils/request'
import { orgManager } from '../utils/orgManager'

export const orgService = {
  // Get user's organization list
  getUserOrgs: async () => {
    const { data } = (await request({ url: '/organizations/list', method: 'POST' })) as any
    return data
  },

  // Create organization
  createOrg: async (name: string): Promise<any> => {
    const { data: resData } = (await request({ url: '/organizations/create', method: 'POST', data: { name } })) as any
    const data = Array.isArray(resData) ? resData[0] : resData
    
    // 缓存新创建的组织ID
    if (data?.id) {
      orgManager.setCurrentOrgId(data.id)
    }
    
    return data
  },

  // Exit organization
  exitOrg: async (orgId: string): Promise<void> => {
    await request({ url: '/organizations/leave', method: 'POST', data: { id: orgId } })
  }
}
