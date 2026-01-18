import { create } from 'zustand'

export interface Organization {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member'
}

interface OrgState {
  currentOrg: Organization | null
  orgList: Organization[]
  setCurrentOrg: (org: Organization) => void
  setOrgList: (list: Organization[]) => void
}

export const useOrgStore = create<OrgState>((set) => ({
  currentOrg: null,
  orgList: [],
  setCurrentOrg: (org) => set({ currentOrg: org }),
  setOrgList: (list) => set({ orgList: list }),
}))
