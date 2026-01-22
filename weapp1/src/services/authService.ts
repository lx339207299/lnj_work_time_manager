// import { request } from '../utils/request'

export interface User {
  id: string
  name: string
  phone: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
}

export const authService = {
  // Send verification code
  sendCode: async (phone: string): Promise<boolean> => {
    // Mock API
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Verification code sent to ${phone}: 123456`)
        resolve(true)
      }, 1000)
    })
  },

  // Login with phone and code
  loginByPhone: async (phone: string, code: string): Promise<{ token: string, user: User, isProfileComplete: boolean }> => {
    // Mock API
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code === '123456') {
          // Mock logic: if phone ends with 0, profile is incomplete
          const isProfileComplete = !phone.endsWith('0')
          
          resolve({
            token: 'mock_token_' + Date.now(),
            user: {
              id: 'u_' + phone,
              name: isProfileComplete ? `用户${phone.slice(-4)}` : '', // Empty name if incomplete
              phone: phone,
              role: 'member', // Default role
              avatar: 'https://img12.360buyimg.com/imagetools/jfs/t1/196430/38/8105/14329/60c806a4Ed506298a/e6de9fb7b8490f38.png'
            },
            isProfileComplete
          })
        } else {
          reject(new Error('验证码错误'))
        }
      }, 1000)
    })
  }
}
