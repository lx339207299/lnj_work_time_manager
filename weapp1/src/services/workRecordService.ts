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
    const { data } = (await request({ url: '/work-records/stats', method: 'POST', data: { projectId } })) as any
    return data
  },

  // Get work records by project and date
  getProjectWorkRecords: async (projectId: string, date: string): Promise<WorkRecord[]> => {
    const { data } = (await request({ 
        url: '/work-records/list', 
        method: 'POST', 
        data: { projectId, date } 
    })) as any
    return data || []
  },

  // Get monthly stats to show dots on calendar
  getProjectMonthStats: async (projectId: string, month: string): Promise<string[]> => {
    // Return array of dates that have records
    const { data } = (await request({ 
        url: '/work-records/list', 
        method: 'POST', 
        data: { projectId, month, pageSize: 1000 } // Fetch all for month
    })) as any
    const list = Array.isArray(data) ? data : []
    // Extract unique dates
    const dates = list.map((r: WorkRecord) => r.date)
    return Array.from(new Set(dates))
  },

  // Get all records list (pagination supported)
  getProjectRecordsList: async (projectId: string, page: number = 1, pageSize: number = 10): Promise<{ list: WorkRecord[], total: number }> => {
    const { data, property } = (await request({ 
        url: '/work-records/list', 
        method: 'POST', 
        data: { projectId, page, pageSize } 
    })) as any
    
    return {
        list: data || [],
        total: property?.total || 0
    }
  },

  // Update record
  updateWorkRecord: async (id: string, data: Partial<WorkRecord>): Promise<void> => {
    await request({ url: '/work-records/update', method: 'POST', data: { id, ...data } })
  },

  // Delete record
  deleteWorkRecord: async (id: string): Promise<void> => {
    await request({ url: '/work-records/delete', method: 'POST', data: { id } })
  },

  // Batch add work records
  batchAddWorkRecords: async (data: {
      projectId: string
      date: string
      records: { memberId: string; duration: number }[]
  }): Promise<void> => {
      await request({ url: '/work-records/batch', method: 'POST', data })
  }
}
