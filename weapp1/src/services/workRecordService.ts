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

export const workRecordService = {
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
  }
}
