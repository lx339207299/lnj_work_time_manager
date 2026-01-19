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
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            userId: 'u1',
            userName: '张三',
            userRole: 'owner',
            totalDuration: 12.5,
            wageType: 'day'
          },
          {
            userId: 'u2',
            userName: '李四',
            userRole: 'member',
            totalDuration: 45,
            wageType: 'hour'
          },
          {
            userId: 'u3',
            userName: '王五',
            userRole: 'member',
            totalDuration: 8,
            wageType: 'day'
          },
          {
            userId: 'u4',
            userName: '赵六',
            userRole: 'member',
            totalDuration: 120,
            wageType: 'hour'
          },
          {
            userId: 'u5',
            userName: '钱七',
            userRole: 'member',
            totalDuration: 5.5,
            wageType: 'day'
          }
        ])
      }, 300)
    })
  },

  // Get work records by project and date
  getProjectWorkRecords: async (projectId: string, date: string): Promise<WorkRecord[]> => {
    // Mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock logic: return random records
        const records: WorkRecord[] = [
          {
            id: '1',
            projectId,
            userId: 'u1',
            userName: '张三',
            userRole: 'owner',
            date: date,
            duration: 8,
            content: '完成SaaS平台基础架构搭建，集成权限管理模块'
          },
          {
            id: '2',
            projectId,
            userId: 'u2',
            userName: '李四',
            userRole: 'member',
            date: date,
            duration: 4,
            content: '修复登录页样式兼容性问题'
          },
          {
            id: '3',
            projectId,
            userId: 'u3',
            userName: '王五',
            userRole: 'member',
            date: date,
            duration: 6.5,
            content: '编写API接口文档'
          }
        ]
        
        // Return random subset to simulate different data per day
        resolve(Math.random() > 0.3 ? records : [])
      }, 300)
    })
  },

  // Get monthly stats to show dots on calendar
  getProjectMonthStats: async (projectId: string, month: string): Promise<string[]> => {
    // Mock data: return array of dates that have records
    return new Promise((resolve) => {
      setTimeout(() => {
        const days = ['01', '05', '12', '15', '20', '22', '25', '28']
        resolve(days.map(d => `${month}-${d}`))
      }, 300)
    })
  },

  // Get all records list (pagination supported)
  getProjectRecordsList: async (projectId: string, page: number = 1, pageSize: number = 10): Promise<{ list: WorkRecord[], total: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate mock list spanning multiple dates
        const list: WorkRecord[] = []
        for (let i = 0; i < pageSize; i++) {
            const dayOffset = (page - 1) * pageSize + i
            const date = new Date()
            date.setDate(date.getDate() - dayOffset) // Past dates
            const dateStr = date.toISOString().split('T')[0]
            
            list.push({
                id: `list-${dayOffset}`,
                projectId,
                userId: i % 2 === 0 ? 'u1' : 'u2',
                userName: i % 2 === 0 ? '张三' : '李四',
                userRole: i % 2 === 0 ? 'owner' : 'member',
                date: dateStr,
                duration: 4 + (i % 5),
                content: `工时记录详情内容测试 ${dayOffset}`
            })
        }
        resolve({
            list,
            total: 50 // Mock total count
        })
      }, 300)
    })
  },

  // Update record
  updateWorkRecord: async (id: string, data: Partial<WorkRecord>): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Update record:', id, data)
            resolve()
        }, 500)
    })
  },

  // Delete record
  deleteWorkRecord: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Delete record:', id)
            resolve()
        }, 500)
    })
  }
}
