import { request } from '../utils/request'

export interface WorkRecord {
  id: number
  projectId: number
  userId: number
  userName: string
  userRole: 'owner' | 'member' | 'admin'
  avatar?: string
  date: string // YYYY-MM-DD
  duration: number
  content: string
  wageType: 'day' | 'hour' | 'month'
}

export interface ProjectMemberStat {
  userId: number
  userName: string
  userAvatar?: string
  userRole: string
  totalDuration: number
  wageType: 'day' | 'hour'
}

export const workRecordService = {
  // Get project member statistics (aggregated work hours)
  getProjectMemberStats: async (projectId: number): Promise<ProjectMemberStat[]> => {
    const { data } = (await request({ url: '/work-records/stats', method: 'POST', data: { projectId } })) as any
    return data
  },

  // Get work records by project and date
  getProjectWorkRecords: async (projectId: number, date: string): Promise<WorkRecord[]> => {
    const { data } = (await request({ 
        url: '/work-records/list', 
        method: 'POST', 
        data: { projectId, date } 
    })) as any
    return data || []
  },

  // Get monthly stats to show dots on calendar
  getProjectMonthStats: async (projectId: number, month: string): Promise<string[]> => {
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
  getProjectRecordsList: async (projectId: number, page: number = 1, pageSize: number = 10): Promise<{ list: WorkRecord[], total: number }> => {
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
  updateWorkRecord: async (id: number, data: Partial<WorkRecord>): Promise<void> => {
    await request({ url: '/work-records/update', method: 'POST', data: { id, ...data } })
  },

  // Delete record
  deleteWorkRecord: async (id: number): Promise<void> => {
    await request({ url: '/work-records/delete', method: 'POST', data: { id } })
  },

  // Batch add work records
  batchAddWorkRecords: async (data: {
      projectId: string | number
      date: string
      records: { memberId: number; duration: number }[]
  }): Promise<void> => {
      await request({ url: '/work-records/batch', method: 'POST', data })
  }
}
