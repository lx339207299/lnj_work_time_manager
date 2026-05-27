import request from '@/utils/request';

export interface AdminProject {
  id: number;
  name: string;
  description: string | null;
  status: string;
  orgId: number;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: number;
    name: string;
  };
  _count: {
    projectMembers: number;
    workRecords: number;
  };
}

export const projectsApi = {
  list: (params: { page?: number; pageSize?: number; keyword?: string }) =>
    request.get<{ data: AdminProject[]; property: { total: number; pageSize: number; currentPage: number } }>(
      '/admin/projects',
      { params }
    ),

  setStatus: (id: number, status: string) =>
    request.post(`/admin/projects/${id}/status`, { status }),
};
