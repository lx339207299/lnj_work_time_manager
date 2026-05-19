import request from '@/utils/request';

export interface Organization {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: number;
    name: string;
    phone: string;
  };
  _count: {
    members: number;
    projects: number;
  };
}

export interface OrganizationListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export const getOrganizations = (params: OrganizationListParams) => {
  return request.get<{ list: Organization[]; total: number }>('/admin/organizations', { params });
};

export const setOrgStatus = (id: number, isDeleted: boolean) => {
  return request.patch(`/admin/organizations/${id}/status`, { isDeleted });
};
