import request from '@/utils/request';

export interface Invitation {
  id: number;
  code: string;
  orgId: number;
  inviterId: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter?: {
    name: string;
    phone: string;
  };
}

/** Admin: 为企业生成邀请码 */
export const createInvitation = (orgId: number) => {
  return request.post<Invitation>('/admin/invitations/create', { orgId });
};

/** Admin: 查看企业的邀请码列表 */
export const listInvitations = (orgId: number) => {
  return request.post<Invitation[]>('/admin/invitations/list', { orgId });
};
