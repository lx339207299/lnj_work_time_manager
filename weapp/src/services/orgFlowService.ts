import { request } from '../utils/request'

export interface OrgFlow {
  id: number
  type: 'income' | 'expense'
  category: string
  amount: number // 单位：分
  date: string // YYYY-MM-DD
  remark?: string
  relatedUserId?: number
  relatedUserName?: string
}

export const orgFlowService = {
  // 组织流水列表（可选按月筛选）
  listOrgFlows: async (month?: string): Promise<OrgFlow[]> => {
    const { data } = (await request({ url: '/org-flows/list', method: 'POST', data: month ? { month } : {} })) as any
    return data || []
  },

  // 新增组织流水（金额单位：分）
  addOrgFlow: async (data: {
    type: 'income' | 'expense'
    category: string
    amount: number
    date: string
    remark?: string
    relatedMemberId?: number
  }): Promise<void> => {
    await request({ url: '/org-flows/create', method: 'POST', data })
  },

  // 删除组织流水
  deleteOrgFlow: async (id: number): Promise<void> => {
    await request({ url: '/org-flows/delete', method: 'POST', data: { id } })
  },
}
