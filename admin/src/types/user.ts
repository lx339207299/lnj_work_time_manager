export interface UserOrgRow {
  _key: string;
  userId: number;
  phone: string;
  name?: string;
  email?: string;
  systemRole: 'user' | 'admin';
  isLocked: boolean;
  createdAt: string;
  ownedOrgsCount: number;
  orgId: number | null;
  orgName?: string | null;
  orgRole?: string | null;
  memberStatus?: string | null;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  orgName?: string;
}
