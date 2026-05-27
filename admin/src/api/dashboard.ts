import request from '@/utils/request';

export interface DashboardOverview {
  totalUsers: number;
  totalOrgs: number;
  activeOrgs: number;
  totalProjects: number;
  activeProjects: number;
  todayNewUsers: number;
  weekNewUsers: number;
  monthNewUsers: number;
  todayWorkHours: number;
  weekWorkHours: number;
  monthWorkHours: number;
}

export interface TrendItem {
  date: string;
  count: number;
  total: number;
}

export interface WorkHourTrendItem {
  date: string;
  hours: number;
}

export interface OrgRankingItem {
  orgId: number;
  orgName: string;
  totalHours: number;
}

export const dashboardApi = {
  overview: () =>
    request.get<{ data: DashboardOverview }>('/admin/dashboard/overview'),

  userTrend: (days: number = 30) =>
    request.get<{ data: TrendItem[] }>('/admin/dashboard/user-trend', { params: { days } }),

  workHourTrend: (days: number = 30) =>
    request.get<{ data: WorkHourTrendItem[] }>('/admin/dashboard/work-hour-trend', { params: { days } }),

  orgRanking: (limit: number = 10) =>
    request.get<{ data: OrgRankingItem[] }>('/admin/dashboard/org-ranking', { params: { limit } }),
};
