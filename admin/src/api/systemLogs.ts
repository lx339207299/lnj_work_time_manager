import request from '@/utils/request';

export interface SystemLog {
  id: number;
  userId: number;
  module: string;
  action: string;
  targetId: string | null;
  detail: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    phone: string | null;
  };
}

export interface SystemLogListParams {
  page?: number;
  pageSize?: number;
  module?: string;
  action?: string;
  keyword?: string;
}

export const systemLogsApi = {
  list: (params: SystemLogListParams) =>
    request.get<{ data: SystemLog[]; property: { total: number; pageSize: number; currentPage: number } }>(
      '/admin/system-logs',
      { params },
    ),
};
