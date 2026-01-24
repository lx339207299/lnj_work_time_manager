import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// Custom storage adapter for Taro
const taroStorage = {
  getItem: (name: string) => {
    return Taro.getStorageSync(name) || null
  },
  setItem: (name: string, value: string) => {
    Taro.setStorageSync(name, value)
  },
  removeItem: (name: string) => {
    Taro.removeStorageSync(name)
  },
}

interface UserState {
  userInfo: any
  token: string | null
  setUserInfo: (info: any) => void
  setToken: (token: string) => void
  logout: () => void
}

import { useOrgStore } from './orgStore'

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userInfo: null,
      token: null,
      setUserInfo: (info) => set({ userInfo: info }),
      setToken: (token) => set({ token }),
      logout: () => {
        set({ userInfo: null, token: null })
        // Clear org data as well
        useOrgStore.getState().clearOrgData()
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({ token: state.token }), // Only persist token
    }
  )
)

