import request from '@/utils/request';

export interface WorkRecordLog {
  id: number;
  orgId: number;
  projectId: number;
  workRecordId: number;
  date: string;
  action: string;
  oldData: string | null;
  newData: string | null;
  createdAt: string;
  operatorId: number;
  operatorName: string;
  targetMemberId: number;
  targetMemberName: string;
}

export interface WorkRecordLogListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  orgId?: number;
  projectId?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export const workRecordLogsApi = {
  list: (params: WorkRecordLogListParams) =>
    request.get<{ data: WorkRecordLog[]; property: { total: number; pageSize: number; currentPage: number } }>(
      '/admin/work-record-logs',
      { params },
    ),
};
