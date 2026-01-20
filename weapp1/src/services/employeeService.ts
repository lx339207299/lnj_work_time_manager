
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

// Mock initial data
let mockEmployees: Employee[] = [
  { id: '1', name: '张三', phone: '13800138000', role: 'owner', wageType: 'month', wageAmount: 10000, avatar: '' },
  { id: '2', name: '李四', phone: '13900139000', role: 'leader', wageType: 'day', wageAmount: 500, avatar: '' },
  { id: '3', name: '王五', phone: '13700137000', role: 'member', wageType: 'hour', wageAmount: 50, avatar: '' },
  { id: '4', name: '赵六', phone: '13600136000', role: 'temp', wageType: 'day', wageAmount: 300, avatar: '' },
  { id: '5', name: '钱七', phone: '13500135000', role: 'member', wageType: 'day', wageAmount: 0, avatar: '' }, // No salary set
]

export const employeeService = {
  // Get all employees for current org
  getEmployees: async (): Promise<Employee[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockEmployees])
      }, 500)
    })
  },

  // Get employee by ID
  getEmployeeById: async (id: string): Promise<Employee | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockEmployees.find(e => e.id === id))
      }, 300)
    })
  },

  // Add employee
  addEmployee: async (data: Omit<Employee, 'id'>): Promise<Employee> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newEmployee = { ...data, id: Date.now().toString() }
        mockEmployees.push(newEmployee)
        resolve(newEmployee)
      }, 500)
    })
  },

  // Update employee
  updateEmployee: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockEmployees.findIndex(e => e.id === id)
        if (index > -1) {
          mockEmployees[index] = { ...mockEmployees[index], ...data }
          resolve(mockEmployees[index])
        } else {
          reject(new Error('Employee not found'))
        }
      }, 500)
    })
  },

  // Delete employee
  deleteEmployee: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockEmployees = mockEmployees.filter(e => e.id !== id)
        resolve()
      }, 500)
    })
  },

  // Transfer ownership
  transferOwnership: async (targetUserId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Find current owner and downgrade
        const ownerIndex = mockEmployees.findIndex(e => e.role === 'owner')
        if (ownerIndex > -1) {
            mockEmployees[ownerIndex].role = 'member'
        }
        
        // Upgrade target user
        const targetIndex = mockEmployees.findIndex(e => e.id === targetUserId)
        if (targetIndex > -1) {
            mockEmployees[targetIndex].role = 'owner'
        }
        resolve()
      }, 500)
    })
  }
}
