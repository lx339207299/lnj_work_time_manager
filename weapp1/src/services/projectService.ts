import { request } from '../utils/request'
import { Project, CreateProjectData, UpdateProjectData, ProjectMember, AddProjectMemberData } from '../../types/global'

export const projectService = {
  // Get project list for current org
  getProjects: async (orgId: string): Promise<Project[]> => {
    return request({ url: '/projects', method: 'GET', data: { orgId } })
  },

  getProjectDetail: async (projectId: string): Promise<Project> => {
    return request({ url: `/projects/${projectId}`, method: 'GET' })
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    return request({ url: '/projects', method: 'POST', data })
  },

  // Get project members
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    return request({ url: `/projects/${projectId}/members`, method: 'GET' })
  },

  // Add members to project
  addProjectMembers: async (data: AddProjectMemberData): Promise<void> => {
    return request({ url: `/projects/${data.projectId}/members`, method: 'POST', data: { memberIds: [data.userId] } })
  },

  // Get project flow list
  getProjectFlows: async (projectId: string): Promise<any[]> => {
    return request({ url: `/projects/${projectId}/flows`, method: 'GET' })
  },

  // Add flow record
  addProjectFlow: async (projectId: string, data: any): Promise<void> => {
    return request({ url: `/projects/${projectId}/flows`, method: 'POST', data })
  },

  // Update project
  updateProject: async (projectId: string, data: UpdateProjectData): Promise<void> => {
    return request({ url: `/projects/${projectId}`, method: 'PATCH', data })
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    return request({ url: `/projects/${projectId}`, method: 'DELETE' })
  }
}
