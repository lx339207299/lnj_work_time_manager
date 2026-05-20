import request from '@/utils/request';
import type { UserOrgRow, UserListParams } from '@/types/user';

type User = UserOrgRow;

export const getUsers = (params: UserListParams) => {
  return request.get<{ list: User[]; total: number }>('/admin/users', { params });
};

export const lockUser = (userId: number, isLocked: boolean) => {
  return request.patch(`/admin/users/${userId}/lock`, { isLocked });
};

export const resetUserPassword = (userId: number, newPassword: string) => {
  return request.patch(`/admin/users/${userId}/password`, { newPassword });
};
