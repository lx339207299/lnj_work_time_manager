import { request } from '../utils/request'
import { Project, CreateProjectData, UpdateProjectData, ProjectMember, AddProjectMemberData } from '../../types/global'

export const projectService = {
  // Get project list for current org
  getProjects: async (): Promise<Project[]> => {
    const { data } = (await request({ url: '/projects/list', method: 'POST' })) as any
    return data
  },

  getProjectDetail: async (projectId: string): Promise<Project> => {
    const { data: resData } = (await request({ url: '/projects/detail', method: 'POST', data: { id: projectId } })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    const { data: resData } = (await request({ url: '/projects/create', method: 'POST', data })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  // Get project members
  getProjectMembers: async (projectId: string): Promise<ProjectMember[]> => {
    const { data } = (await request({ url: '/projects/list-members', method: 'POST', data: { id: projectId } })) as any
    return data
  },

  // Add members to project
  addProjectMembers: async (data: AddProjectMemberData): Promise<void> => {
    await request({ url: '/projects/add-members', method: 'POST', data: { id: data.projectId, memberIds: [data.userId] } })
  },

  // Get project flow list
  getProjectFlows: async (projectId: string): Promise<any[]> => {
    const { data } = (await request({ url: '/projects/list-flows', method: 'POST', data: { id: projectId } })) as any
    return data
  },

  // Add flow record
  addProjectFlow: async (projectId: string, data: any): Promise<void> => {
    await request({ url: '/projects/add-flow', method: 'POST', data: { id: projectId, ...data } })
  },

  // Update project
  updateProject: async (projectId: string, data: UpdateProjectData): Promise<void> => {
    await request({ url: '/projects/update', method: 'POST', data: { id: projectId, ...data } })
  },

  // Delete project
  deleteProject: async (projectId: string): Promise<void> => {
    await request({ url: '/projects/delete', method: 'POST', data: { id: projectId } })
  }
}
