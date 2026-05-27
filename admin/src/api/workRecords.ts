import request from '@/utils/request';

export interface AdminWorkRecord {
  id: number;
  date: string;
  duration: number;
  content: string | null;
  amount: number;
  wageType: string;
  createdAt: string;
  projectId: number;
  projectName: string;
  orgId: number;
  orgName: string;
  userName: string;
  userId: number;
}

export interface WorkRecordListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  orgId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}

export const workRecordsApi = {
  list: (params: WorkRecordListParams) =>
    request.get<{ data: AdminWorkRecord[]; property: { total: number; pageSize: number; currentPage: number } }>(
      '/admin/work-records',
      { params },
    ),
};
