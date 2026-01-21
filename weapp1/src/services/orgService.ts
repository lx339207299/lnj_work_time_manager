import { request } from '../utils/request'

export const orgService = {
  // Get user's organization list
  getUserOrgs: async () => {
    // Mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', name: '默认组织', role: 'owner' },
          { id: '2', name: '兼职团队', role: 'member' }
        ])
      }, 500)
    })
    // return request({ url: '/api/orgs', method: 'GET' })
  },

  // Create organization
  createOrg: async (name: string): Promise<any> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
            id: 'org_' + Date.now(),
            name,
            role: 'owner'
        })
      }, 500)
    })
  }
}
