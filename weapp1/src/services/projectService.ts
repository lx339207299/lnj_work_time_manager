import { request } from '../utils/request'
import { Project, CreateProjectData, UpdateProjectData, ProjectMember, AddProjectMemberData } from '../../types/global'

export const projectService = {
  // Get project list for current org
  getProjects: async (): Promise<Project[]> => {
    return request({ url: '/projects/list', method: 'POST' })
  },

  getProjectDetail: async (projectId: string): Promise<Project> => {
    return request({ url: '/projects/detail', method: 'POST', data: { id: projectId } })
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    return request({ url: '/projects/create', method: 'POST', data })
  },

  // Get project members
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    return request({ url: '/projects/list-members', method: 'POST', data: { id: projectId } })
  },

  // Add members to project
  addProjectMembers: async (data: AddProjectMemberData): Promise<void> => {
    return request({ url: '/projects/add-members', method: 'POST', data: { id: data.projectId, memberIds: [data.userId] } })
  },

  // Get project flow list
  getProjectFlows: async (projectId: string): Promise<any[]> => {
    return request({ url: '/projects/list-flows', method: 'POST', data: { id: projectId } })
  },

  // Add flow record
  addProjectFlow: async (projectId: string, data: any): Promise<void> => {
    return request({ url: '/projects/add-flow', method: 'POST', data: { id: projectId, ...data } })
  },

  // Update project
  updateProject: async (projectId: string, data: UpdateProjectData): Promise<void> => {
    return request({ url: '/projects/update', method: 'POST', data: { id: projectId, ...data } })
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    return request({ url: '/projects/delete', method: 'POST', data: { id: projectId } })
  }
}
