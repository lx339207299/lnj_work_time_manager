export interface User {
  id: number;
  phone: string;
  name?: string;
  avatar?: string;
  email?: string;
  systemRole: 'user' | 'admin';
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  currentOrg?: {
    id: number;
    name: string;
  };
  _count?: {
    ownedOrgs: number;
    memberships: number;
  };
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  orgName?: string;
}
