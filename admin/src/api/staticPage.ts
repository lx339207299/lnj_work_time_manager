import request from '@/utils/request';

export interface StaticPage {
  id: number;
  name: string;
  code: string;
  content: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaticPageParams {
  name: string;
  code: string;
  content: string;
  remark?: string;
}

export interface StaticPageListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

export const staticPageApi = {
  list: (params: StaticPageListParams) =>
    request<{ property: { total: number; pageSize: number; currentPage: number }; data: StaticPage[] }>('/admin/static-pages', { params }),

  get: (id: number) =>
    request<{ data: StaticPage }>(`/admin/static-pages/${id}`),

  create: (data: StaticPageParams) =>
    request<{ data: StaticPage }>('/admin/static-pages', { method: 'POST', data }),

  update: (id: number, data: Partial<StaticPageParams>) =>
    request<{ data: StaticPage }>(`/admin/static-pages/${id}`, { method: 'PATCH', data }),

  remove: (id: number) =>
    request(`/admin/static-pages/${id}`, { method: 'DELETE' }),
};
