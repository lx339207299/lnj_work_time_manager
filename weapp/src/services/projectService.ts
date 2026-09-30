import { request } from '../utils/request'
import { Project, CreateProjectData, UpdateProjectData, ProjectMember, AddProjectMemberData } from '../../types/global'

export interface ProjectListResult {
  list: Project[]
  total: number
  hasMore: boolean
}

export const projectService = {
  // Get project list for current org (paged)
  getProjects: async (page = 1, pageSize = 20): Promise<ProjectListResult> => {
    const res = (await request({ url: '/projects/list', method: 'POST', data: { page, pageSize } })) as any
    const data = res?.data
    const list: Project[] = Array.isArray(data) ? data : []
    const total = res?.pagination?.total
    return {
      list,
      total: total ?? list.length,
      // 旧后端无 pagination 时返回全量数据，视为没有更多
      hasMore: total !== undefined ? page * pageSize < total : false,
    }
  },

  getProjectDetail: async (projectId: number): Promise<Project> => {
    const { data: resData } = (await request({ url: '/projects/detail', method: 'POST', data: { id: projectId } })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    const { data: resData } = (await request({ url: '/projects/create', method: 'POST', data })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  // Get project members
  getProjectMembers: async (projectId: number): Promise<ProjectMember[]> => {
    const { data } = (await request({ url: '/projects/list-members', method: 'POST', data: { id: projectId } })) as any
    return data
  },

  // Add members to project
  addProjectMembers: async (data: AddProjectMemberData): Promise<void> => {
    await request({ url: '/projects/add-members', method: 'POST', data: { id: data.projectId, memberIds: [data.userId] } })
  },

  // Get project flow list
  getProjectFlows: async (projectId: number): Promise<any[]> => {
    const { data } = (await request({ url: '/projects/list-flows', method: 'POST', data: { id: projectId } })) as any
    return data
  },

  // Add flow record
  addProjectFlow: async (projectId: number, data: any): Promise<void> => {
    await request({ url: '/projects/add-flow', method: 'POST', data: { id: projectId, ...data } })
  },

  // Update project
  updateProject: async (projectId: number, data: UpdateProjectData): Promise<void> => {
    await request({ url: '/projects/update', method: 'POST', data: { id: projectId, ...data } })
  },

  // Delete project
  deleteProject: async (projectId: number): Promise<void> => {
    await request({ url: '/projects/delete', method: 'POST', data: { id: projectId } })
  }
}
