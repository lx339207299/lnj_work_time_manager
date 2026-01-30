import { request } from '../utils/request'

export interface Employee {
  id: string
  name: string
  phone: string
  role: 'owner' | 'leader' | 'member' | 'temp'
  wageType: 'day' | 'month' | 'hour'
  wageAmount: number
  birthday?: string
  avatar?: string
}

export const employeeService = {
  // Get all employees for current org
  getEmployees: async (): Promise<Employee[]> => {
    return request({ url: '/employees/list', method: 'POST' })
  },

  // Get employee by ID
  getEmployeeById: async (id: string): Promise<Employee | undefined> => {
    return request({ url: '/employees/detail', method: 'POST', data: { id } })
  },

  // Add employee
  addEmployee: async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    return request({ url: '/employees/create', method: 'POST', data })
  },

  // Update employee
  updateEmployee: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return request({ url: '/employees/update', method: 'POST', data: { id, ...data } })
  },

  // Delete employee
  deleteEmployee: async (id: string): Promise<void> => {
    return request({ url: '/employees/delete', method: 'POST', data: { id } })
  },

  // Transfer ownership (New API needed in backend if not exists)
  transferOwnership: async (targetMemberId: string): Promise<void> => {
    // Ideally this should be an org-level operation
    // For now we can use a custom endpoint or update employee role
    // But transfer ownership is special (involves 2 updates)
    // Let's assume we call a specific endpoint
    return request({ url: `/employees/${targetMemberId}/transfer-ownership`, method: 'POST' })
  }
}
