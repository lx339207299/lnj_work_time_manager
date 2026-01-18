import { create } from 'zustand'

export interface Project {
  id: string
  name: string
  description: string
  role: 'owner' | 'member'
  memberCount: number
  totalHours: number
}

interface ProjectState {
  projectList: Project[]
  currentProject: Project | null
  setProjectList: (list: Project[]) => void
  setCurrentProject: (project: Project) => void
  addProject: (project: Project) => void
  updateProject: (id: string, data: Partial<Project>) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectList: [],
  currentProject: null,
  setProjectList: (list) => set({ projectList: list }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((state) => ({ projectList: [project, ...state.projectList] })),
  updateProject: (id, data) => set((state) => ({
    projectList: state.projectList.map(p => p.id === id ? { ...p, ...data } : p)
  })),
}))
