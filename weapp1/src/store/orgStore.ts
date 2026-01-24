import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import Taro from '@tarojs/taro'

// Custom storage adapter for Taro (Reuse logic or import if shared, but for now defining inline for simplicity or we can extract it)
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

export interface Organization {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member' | 'leader'
}

interface OrgState {
  currentOrg: Organization | null
  orgList: Organization[]
  setCurrentOrg: (org: Organization | null) => void
  setOrgList: (list: Organization[]) => void
  clearOrgData: () => void
}

export const useOrgStore = create<OrgState>((set) => ({
  currentOrg: null,
  orgList: [],
  setCurrentOrg: (org) => set({ currentOrg: org }),
  setOrgList: (list) => set({ orgList: list }),
  clearOrgData: () => set({ currentOrg: null, orgList: [] }),
}))
