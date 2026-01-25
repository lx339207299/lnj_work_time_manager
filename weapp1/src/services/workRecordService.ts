import { request } from '../utils/request'

export interface WorkRecord {
  id: string
  projectId: string
  userId: string
  userName: string
  userRole: 'owner' | 'member' | 'admin'
  avatar?: string
  date: string // YYYY-MM-DD
  duration: number
  content: string
}

export interface ProjectMemberStat {
  userId: string
  userName: string
  userAvatar?: string
  userRole: string
  totalDuration: number
  wageType: 'day' | 'hour'
}

export const workRecordService = {
  // Get project member statistics (aggregated work hours)
  getProjectMemberStats: async (projectId: string): Promise<ProjectMemberStat[]> => {
    return request({ url: '/work-records/stats', method: 'GET', data: { projectId } })
  },

  // Get work records by project and date
  getProjectWorkRecords: async (projectId: string, date: string): Promise<WorkRecord[]> => {
    const res = await request({ 
        url: '/work-records', 
        method: 'GET', 
        data: { projectId, date } 
    })
    return res.list || []
  },

  // Get monthly stats to show dots on calendar
  getProjectMonthStats: async (projectId: string, month: string): Promise<string[]> => {
    // Return array of dates that have records
    const res = await request({ 
        url: '/work-records', 
        method: 'GET', 
        data: { projectId, month, pageSize: 1000 } // Fetch all for month
    })
    // Extract unique dates
    const dates = res.list.map((r: WorkRecord) => r.date)
    return Array.from(new Set(dates))
  },

  // Get all records list (pagination supported)
  getProjectRecordsList: async (projectId: string, page: number = 1, pageSize: number = 10): Promise<{ list: WorkRecord[], total: number }> => {
    return request({ 
        url: '/work-records', 
        method: 'GET', 
        data: { projectId, page, pageSize } 
    })
  },

  // Update record
  updateWorkRecord: async (id: string, data: Partial<WorkRecord>): Promise<void> => {
    return request({ url: `/work-records/${id}`, method: 'PATCH', data })
  },

  // Delete record
  deleteWorkRecord: async (id: string): Promise<void> => {
    return request({ url: `/work-records/${id}`, method: 'DELETE' })
  },

  // Batch add work records
  batchAddWorkRecords: async (data: {
      projectId: string
      date: string
      records: { memberId: string; duration: number }[]
  }): Promise<void> => {
      return request({ url: '/work-records/batch', method: 'POST', data })
  }
}
