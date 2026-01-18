import { create } from 'zustand'

interface UserState {
  userInfo: any
  token: string | null
  setUserInfo: (info: any) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  token: null,
  setUserInfo: (info) => set({ userInfo: info }),
  setToken: (token) => set({ token }),
  logout: () => set({ userInfo: null, token: null }),
}))
