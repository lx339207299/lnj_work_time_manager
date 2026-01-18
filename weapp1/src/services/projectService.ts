// import { request } from '../utils/request'
import { Project } from '../store/projectStore'

export const projectService = {
  // Get project list for current org
  getProjects: async (orgId: string): Promise<Project[]> => {
    // Mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '101', name: 'SaaS平台开发', description: '企业级SaaS平台研发项目', role: 'owner', memberCount: 5, totalHours: 120 },
          { id: '102', name: '小程序重构', description: '微信小程序Taro重构', role: 'member', memberCount: 3, totalHours: 45 },
          { id: '103', name: '旧系统维护', description: 'Legacy system maintenance', role: 'member', memberCount: 2, totalHours: 300 },
        ])
      }, 500)
    })
  },

  getProjectDetail: async (projectId: string) => {
    // Mock data
  },

  createProject: async (data: any) => {
    // Mock create
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id: 'mock_' + Date.now(), ...data, role: 'owner', memberCount: 1, totalHours: 0 })
      }, 500)
    })
  }
}
