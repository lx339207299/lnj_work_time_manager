import { request } from '../utils/request'

export interface Employee {
  id: number
  role: 'owner' | 'leader' | 'member' | 'temp'
  wageType: 'day' | 'month' | 'hour'
  wageAmount: number
  user: {
    id: number
    name: string
    phone: string
    avatar?: string
    birthday?: string
  }
}

export const employeeService = {
  // Get all employees for current org
  getEmployees: async (onlyActive: boolean = true): Promise<Employee[]> => {
    const { data } = (await request({ url: '/employees/list', method: 'POST', data: { onlyActive } })) as any
    return data
  },

  // Get employee by ID
  getEmployeeById: async (id: number): Promise<Employee | undefined> => {
    const { data: resData } = (await request({ url: '/employees/detail', method: 'POST', data: { id } })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  // Add employee
  addEmployee: async (data: { phone: string, name?: string, birthday?: string, role?: string, wageType?: string, wageAmount?: number }): Promise<Employee> => {
    const { data: resData } = (await request({ url: '/employees/create', method: 'POST', data })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  // Batch add employees
  batchAddEmployees: async (employees: { name: string, phone: string }[]): Promise<{ phone: string, status: 'success' | 'failed', reason?: string }[]> => {
    const { data: resData } = (await request({ url: '/employees/batch-create', method: 'POST', data: { employees } })) as any
    return resData
  },

  // Update employee
  updateEmployee: async (id: number, data: { role?: string, wageType?: string, wageAmount?: number }): Promise<Employee> => {
    const { data: resData } = (await request({ url: '/employees/update', method: 'POST', data: { id, ...data } })) as any
    return Array.isArray(resData) ? resData[0] : resData
  },

  // Delete employee
  deleteEmployee: async (id: number): Promise<void> => {
    await request({ url: '/employees/delete', method: 'POST', data: { id } })
  },

  // Transfer ownership
  transferOwnership: async (targetMemberId: number): Promise<void> => {
    await request({ url: '/employees/transfer-ownership', method: 'POST', data: { id: targetMemberId } })
  }
}
