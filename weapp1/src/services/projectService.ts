import { request } from '../utils/request'
import { Project } from '../store/projectStore'

export const projectService = {
  // Get project list for current org
  getProjects: async (orgId: string): Promise<Project[]> => {
    return request({ url: '/projects', method: 'GET', data: { orgId } })
  },

  getProjectDetail: async (projectId: string): Promise<Project> => {
    return request({ url: `/projects/${projectId}`, method: 'GET' })
  },

  createProject: async (data: any) => {
    return request({ url: '/projects', method: 'POST', data })
  },

  // Get project members
  getProjectMembers: async (projectId: string): Promise<any[]> => {
    return request({ url: `/projects/${projectId}/members`, method: 'GET' })
  },

  // Add members to project
  addProjectMembers: async (projectId: string, memberIds: string[]): Promise<void> => {
    return request({ url: `/projects/${projectId}/members`, method: 'POST', data: { memberIds } })
  },

  // Get project flow list
  getProjectFlows: async (projectId: string): Promise<any[]> => {
    return request({ url: `/projects/${projectId}/flows`, method: 'GET' })
  },

  // Add flow record
  addProjectFlow: async (projectId: string, data: any): Promise<void> => {
    return request({ url: `/projects/${projectId}/flows`, method: 'POST', data })
  }
}
